import logging
import re
import uuid
from datetime import date, datetime, timedelta, timezone

from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import invalidate_cached_token, resolve_is_staff
from .clinical import (
    SPAY_NEUTER_KEYWORDS,
    compute_active_quarantine,
    compute_spayed_neutered,
    compute_vaccination_status,
    create_condition_medical_log,
    generate_next_pet_id,
    is_meaningful_condition,
    normalize_pet_classification,
    safe_sync_pet_vaccination_status,
    validate_species_vaccine_compatibility,
)
from .permissions import IsAuthenticatedUser, IsMDCStaff
from .supabase_client import create_auth_client, get_db_client
from .validators import (
    EMAIL_PATTERN,
    ID_PATTERN,
    PHONE_PATTERN,
    clean_text,
    normalize_date_str,
    parse_datetime_safe,
    validate_http_url,
    validate_image_upload,
)

logger = logging.getLogger(__name__)

DEFAULT_PET_PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba"

ALLOWED_PET_UPDATE_FIELDS = frozenset({
    "name",
    "species",
    "pet_type",
    "breed",
    "gender",
    "age",
    "weight",
    "size",
    "adoption_status",
    "found_near",
    "feeding_area",
    "rescue_date",
    "current_conditions",
    "behavior_notes",
    "about_text",
    "description",
    "primary_image",
})

ALLOWED_INVENTORY_FIELDS = frozenset({
    "item_name",
    "category",
    "quantity",
    "unit",
    "min_threshold",
    "supplier_donor",
    "expiration_date",
})

APPROVED_INVENTORY_UNITS = frozenset({
    "kg", "cans", "bags", "packs", "pouches", "g", "vials", "pcs", "bottles", "boxes", "units", "doses",
    "KG", "CAN", "VIAL", "PCS", "UNITS", "BOXES", "BAGS", "PACKS", "POUCHES", "G",
})

ALLOWED_INVENTORY_CATEGORIES = frozenset({"Food", "Medical", "Supplies"})
ALLOWED_SIGHTING_STATUSES = frozenset({"Pending", "Investigated", "Resolved"})
ALLOWED_ANIMAL_TYPES = frozenset({"Cat", "Dog", "Others"})

URGENT_MARKERS = ("[URGENT EMERGENCY]", "[🚨 URGENT EMERGENCY]")


def _is_urgent_feature_text(text: str | None) -> bool:
    val = str(text or "")
    return any(marker in val for marker in URGENT_MARKERS)


def _strip_urgent_marker(text: str | None) -> str:
    val = str(text or "")
    for marker in URGENT_MARKERS:
        val = val.replace(marker, "")
    return val.strip()


def _upload_image_to_bucket(image_file, bucket: str, prefix: str) -> str:
    file_bytes, safe_ext, safe_mime = validate_image_upload(image_file)
    storage_filename = f"{prefix}_{uuid.uuid4().hex}.{safe_ext}"
    db = get_db_client()
    db.storage.from_(bucket).upload(
        path=storage_filename,
        file=file_bytes,
        file_options={"content-type": safe_mime},
    )
    return db.storage.from_(bucket).get_public_url(storage_filename)


def _parse_pagination_params(request, default_limit: int = 0, max_limit: int = 200):
    raw_limit = request.query_params.get("limit")
    raw_offset = request.query_params.get("offset")
    limit = default_limit
    offset = 0
    if raw_limit is not None:
        try:
            limit = max(1, min(int(raw_limit), max_limit))
        except (ValueError, TypeError):
            limit = default_limit
    if raw_offset is not None:
        try:
            offset = max(0, int(raw_offset))
        except (ValueError, TypeError):
            offset = 0
    return limit, offset


def _build_session_payload(
    access_token: str,
    supa_user,
    profile_rec: dict | None = None,
    refresh_token: str | None = None,
) -> dict:
    user_meta = getattr(supa_user, "user_metadata", None) or {}
    app_meta = getattr(supa_user, "app_metadata", None) or {}
    profile = profile_rec or {}

    role = (
        str(profile.get("role") or "").strip().lower()
        or str(app_meta.get("role") or "").strip().lower()
        or str(user_meta.get("role") or "").strip().lower()
    )
    if role == "authenticated":
        role = ""

    email = (getattr(supa_user, "email", "") or profile.get("email") or "").strip().lower()
    first_name = (profile.get("first_name") or user_meta.get("first_name") or "").strip()
    last_name = (profile.get("last_name") or user_meta.get("last_name") or "").strip()
    custom_id = (
        profile.get("custom_id")
        or user_meta.get("custom_id")
        or user_meta.get("user_id")
        or ""
    ).strip()

    is_staff = resolve_is_staff(role, email)
    resolved_role = role or ("staff" if is_staff else "user")

    payload = {
        "access_token": access_token,
        "role": resolved_role,
        "is_staff": is_staff,
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "full_name": f"{first_name} {last_name}".strip(),
        "custom_id": custom_id,
        "student_id": custom_id,
    }
    if refresh_token:
        payload["refresh_token"] = refresh_token
    return payload


# =====================================================================
# 1. AUTHENTICATION & SESSION MANAGEMENT
# =====================================================================

class RegisterUserView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        data = request.data
        user_id = clean_text(data.get("id"), 20)
        first_name = clean_text(data.get("first_name"), 80)
        last_name = clean_text(data.get("last_name"), 80)
        email = clean_text(data.get("email"), 150).lower()
        password = str(data.get("password") or "")

        if not first_name or not last_name:
            return Response(
                {"error": "Both first name and last name are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not user_id or not ID_PATTERN.match(user_id):
            return Response(
                {"error": "Student or employee ID must follow the format XX-XXXX-XXX."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not email or not EMAIL_PATTERN.match(email):
            return Response(
                {"error": "Registration is restricted to authorized @cit.edu institutional email addresses."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(password) < 8 or not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
            return Response(
                {"error": "Password must be at least 8 characters and include both letters and numbers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            auth_client = create_auth_client()
            auth_response = auth_client.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "custom_id": user_id,
                        "first_name": first_name,
                        "last_name": last_name,
                        "role": "user",
                    }
                },
            })
            if not auth_response or not auth_response.user:
                return Response(
                    {"error": "Unable to complete registration. Please check if this email is already registered."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            profile_payload = {
                "id": auth_response.user.id,
                "custom_id": user_id,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "role": "user",
            }
            try:
                get_db_client().table("profiles").upsert(profile_payload).execute()
            except Exception as exc:
                logger.warning("Profile upsert failed after signup for %s: %s", email, exc)

            # Automatically issue session when Supabase returns an active access token
            supa_session = getattr(auth_response, "session", None)
            access_token = getattr(supa_session, "access_token", None)
            refresh_token = getattr(supa_session, "refresh_token", None)
            if access_token:
                session_payload = _build_session_payload(
                    access_token, auth_response.user, profile_payload, refresh_token=refresh_token
                )
                return Response(
                    {
                        "message": f"Welcome, {first_name}! Your account has been created.",
                        "session": session_payload,
                        "requires_email_confirmation": False,
                    },
                    status=status.HTTP_201_CREATED,
                )

            return Response(
                {
                    "message": "Account created successfully. Please check your @cit.edu inbox to confirm your email before signing in.",
                    "requires_email_confirmation": True,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            err_msg = str(exc).lower()
            logger.info("Registration error for %s: %s", email, exc)
            if "already registered" in err_msg or "unique" in err_msg or "already exists" in err_msg:
                return Response(
                    {"error": "This institutional email is already registered. Please sign in instead."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if "rate limit" in err_msg or "too many" in err_msg:
                return Response(
                    {"error": "Too many registration attempts. Please wait a few minutes and try again."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response(
                {"error": "Unable to create your account right now. Please try again shortly."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        email = clean_text(request.data.get("email"), 150).lower()
        password = str(request.data.get("password") or "")

        if not email or not password:
            return Response(
                {"error": "Institutional email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            auth_client = create_auth_client()
            response = auth_client.auth.sign_in_with_password({"email": email, "password": password})
            if not response or not response.user:
                return Response(
                    {"error": "Invalid email or password."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            supa_session = getattr(response, "session", None)
            access_token = getattr(supa_session, "access_token", None)
            refresh_token = getattr(supa_session, "refresh_token", None)
            if not access_token:
                return Response(
                    {"error": "Please confirm your institutional email before signing in."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            profile_rec = {}
            try:
                p = get_db_client().table("profiles").select(
                    "id, custom_id, first_name, last_name, email, role"
                ).eq("id", response.user.id).execute()
                if p.data:
                    profile_rec = p.data[0] or {}
            except Exception as exc:
                logger.warning("Profile lookup during login failed for %s: %s", email, exc)

            session_payload = _build_session_payload(
                access_token, response.user, profile_rec, refresh_token=refresh_token
            )
            return Response({"session": session_payload}, status=status.HTTP_200_OK)
        except Exception as exc:
            err_str = str(exc).lower()
            logger.info("Login failed for %s: %s", email, exc)
            if "email not confirmed" in err_str:
                return Response(
                    {"error": "Please confirm your institutional email before signing in."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if "invalid" in err_str or "credential" in err_str or "user not found" in err_str:
                return Response(
                    {"error": "Invalid email or password. Please check your credentials and try again."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            return Response(
                {"error": "Unable to sign in at the moment. Please try again."},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class SessionView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        return Response({"user": request.user.to_profile_dict()}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = getattr(request, "auth", None)
        if isinstance(token, str) and token:
            invalidate_cached_token(token)
        return Response({"message": "Signed out successfully."}, status=status.HTTP_200_OK)


# =====================================================================
# 2. PET REGISTRY & PUBLIC PASSPORT
# =====================================================================

class PetListAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsMDCStaff()]

    def get(self, request):
        try:
            db = get_db_client()
            include_archived = (
                bool(getattr(request.user, "is_staff", False))
                and str(request.query_params.get("include_archived", "")).strip().lower() in ("true", "1", "yes")
            )
            res_data = db.table("pets").select("*").execute().data or []
            if not include_archived:
                res_data = [p for p in res_data if not p.get("archived_at")]

            logs_by_pet = {}
            try:
                med_logs = db.table("medical_records").select("*").execute().data or []
                for m in med_logs:
                    pid = m.get("pet_id")
                    if pid:
                        logs_by_pet.setdefault(pid, []).append(m)
            except Exception as exc:
                logger.warning("Skipping medical_records enrichment: %s", exc)

            vacs_by_pet = {}
            vacs_loaded = False
            try:
                vac_logs = db.table("vaccination_logs").select("*").execute().data or []
                vacs_loaded = True
                for v in vac_logs:
                    pid = v.get("pet_id")
                    if pid:
                        vacs_by_pet.setdefault(pid, []).append(v)
            except Exception as exc:
                logger.warning("Skipping vaccination_logs enrichment: %s", exc)

            for pet in res_data:
                p_id = pet.get("pet_id")
                pet_med_logs = logs_by_pet.get(p_id, [])
                pet_vac_logs = vacs_by_pet.get(p_id, [])

                if vacs_loaded:
                    pet["vaccination_status"] = compute_vaccination_status(pet_vac_logs)

                pet["spayed_neutered"] = compute_spayed_neutered(pet_med_logs)

                is_q, q_until, q_iso = compute_active_quarantine(pet, pet_med_logs)
                if is_q:
                    pet["is_quarantined"] = True
                    pet["status"] = "Quarantine / Rabies Observation"
                    if q_until:
                        pet["quarantine_until"] = q_until
                    if q_iso:
                        pet["quarantine_expiry_date"] = q_iso
                else:
                    pet["is_quarantined"] = False
                    if pet.get("status") == "Quarantine / Rabies Observation":
                        pet["status"] = "Active / Campus Resident"

            res_data.sort(key=lambda x: str(x.get("created_at") or x.get("rescue_date") or ""), reverse=True)
            limit, offset = _parse_pagination_params(request)
            if limit > 0:
                res_data = res_data[offset: offset + limit]
            return Response(res_data, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to list pets: %s", exc)
            return Response(
                {"error": "Unable to load campus animal directory."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        try:
            d = request.data
            canonical_type, canonical_adoption_status = normalize_pet_classification(
                d.get("pet_type"), d.get("adoption_status")
            )
            species_clean = clean_text(d.get("species"), 30) or "Cat"
            if species_clean not in ("Cat", "Dog"):
                species_clean = "Cat" if "cat" in species_clean.lower() else ("Dog" if "dog" in species_clean.lower() else species_clean)

            generated_pet_id, seq_num = generate_next_pet_id(canonical_type)

            name_clean = clean_text(d.get("name"), 120)
            if not name_clean:
                if canonical_type == "Stray":
                    name_clean = f"Stray {species_clean} #{seq_num}"
                else:
                    return Response({"error": "Animal name is required."}, status=status.HTTP_400_BAD_REQUEST)

            image_file = request.FILES.get("image")
            try:
                if image_file:
                    image_url = _upload_image_to_bucket(image_file, "petpictures", "pet")
                else:
                    supplied_url = validate_http_url(d.get("primary_image"))
                    image_url = supplied_url or DEFAULT_PET_PLACEHOLDER_IMAGE
            except ValueError as val_err:
                return Response({"error": str(val_err)}, status=status.HTTP_400_BAD_REQUEST)

            raw_conditions = clean_text(d.get("current_conditions"), 500) or "None"
            normalized_rescue_date = normalize_date_str(d.get("rescue_date"))

            insert_payload = {
                "pet_id": generated_pet_id,
                "name": name_clean,
                "species": species_clean,
                "pet_type": canonical_type,
                "breed": clean_text(d.get("breed"), 100) or None,
                "gender": clean_text(d.get("gender"), 20) or None,
                "age": clean_text(d.get("age"), 50) or None,
                "weight": clean_text(d.get("weight"), 30) or None,
                "size": clean_text(d.get("size"), 20) or None,
                "vaccination_status": "Not Vaccinated",
                "spayed_neutered": False,
                "adoption_status": canonical_adoption_status,
                "found_near": clean_text(d.get("found_near"), 150) or None,
                "rescue_date": normalized_rescue_date,
                "current_conditions": raw_conditions,
                "behavior_notes": clean_text(d.get("behavior_notes"), 500) or None,
                "about_text": clean_text(d.get("about_text"), 1500) or None,
                "description": clean_text(d.get("description"), 1500) or None,
                "primary_image": image_url,
            }
            insert_payload = {k: v for k, v in insert_payload.items() if v is not None}

            res = get_db_client().table("pets").insert(insert_payload).execute()
            if not res.data:
                return Response({"error": "Failed to save animal profile."}, status=status.HTTP_400_BAD_REQUEST)

            created_pet = res.data[0]
            if is_meaningful_condition(raw_conditions):
                create_condition_medical_log(
                    pet_id=generated_pet_id,
                    condition_text=raw_conditions,
                    log_date_str=normalized_rescue_date,
                    weight_str=d.get("weight"),
                    tag="INTAKE MEDICAL CONDITION",
                )

            return Response(created_pet, status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Failed to create pet profile: %s", exc)
            return Response(
                {"error": "Unable to register animal profile. Please check your inputs and try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PetDetailAPIView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsMDCStaff()]

    def get(self, request, pet_id):
        try:
            db = get_db_client()
            clean_id = clean_text(pet_id, 60)
            if not clean_id:
                return Response({"error": "Animal record not found."}, status=status.HTTP_404_NOT_FOUND)

            pet_data = None
            exact_query = db.table("pets").select("*").eq("pet_id", clean_id).execute()
            if exact_query.data:
                pet_data = exact_query.data[0]
            else:
                ci_id_query = db.table("pets").select("*").ilike("pet_id", clean_id).execute()
                if ci_id_query.data:
                    pet_data = ci_id_query.data[0]
                else:
                    ci_name_query = db.table("pets").select("*").ilike("name", clean_id).execute()
                    if ci_name_query.data:
                        pet_data = ci_name_query.data[0]

            if not pet_data:
                return Response({"error": f'Animal record for "{clean_id}" was not found.'}, status=status.HTTP_404_NOT_FOUND)

            resolved_pet_id = pet_data.get("pet_id", clean_id)

            try:
                img = db.table("pet_images").select("image_url").eq("pet_id", resolved_pet_id).eq("is_primary", True).execute()
                if img.data and img.data[0].get("image_url"):
                    pet_data["primary_image"] = img.data[0]["image_url"]
            except Exception as exc:
                logger.debug("pet_images lookup skipped for %s: %s", resolved_pet_id, exc)

            try:
                med_logs = db.table("medical_records").select("*").eq("pet_id", resolved_pet_id).execute().data or []
                vac_logs = db.table("vaccination_logs").select("*").eq("pet_id", resolved_pet_id).execute().data or []

                pet_data["vaccination_status"] = compute_vaccination_status(vac_logs)
                pet_data["spayed_neutered"] = compute_spayed_neutered(med_logs)

                is_q, q_until, q_iso = compute_active_quarantine(pet_data, med_logs)
                if is_q:
                    pet_data["is_quarantined"] = True
                    pet_data["status"] = "Quarantine / Rabies Observation"
                    if q_until:
                        pet_data["quarantine_until"] = q_until
                    if q_iso and not pet_data.get("quarantine_expiry_date"):
                        pet_data["quarantine_expiry_date"] = q_iso
                elif not pet_data.get("quarantine_expiry_date"):
                    pet_data["is_quarantined"] = False
                    if pet_data.get("status") == "Quarantine / Rabies Observation":
                        pet_data["status"] = "Active / Campus Resident"
            except Exception as exc:
                logger.warning("Clinical enrichment failed for %s: %s", resolved_pet_id, exc)

            return Response(pet_data, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to load pet detail for %s: %s", pet_id, exc)
            return Response(
                {"error": "Unable to retrieve animal profile."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request, pet_id):
        try:
            db = get_db_client()
            raw = dict(request.data)
            update_payload = {k: v for k, v in raw.items() if k in ALLOWED_PET_UPDATE_FIELDS}

            existing_res = db.table("pets").select("*").eq("pet_id", pet_id).execute()
            if not existing_res.data:
                return Response({"error": f'Animal "{pet_id}" not found.'}, status=status.HTTP_404_NOT_FOUND)
            existing_pet = existing_res.data[0]
            prev_conditions = str(existing_pet.get("current_conditions") or "").strip()

            if "primary_image" in update_payload:
                raw_img = str(update_payload["primary_image"] or "").strip()
                if not raw_img:
                    update_payload.pop("primary_image", None)
                else:
                    try:
                        update_payload["primary_image"] = validate_http_url(raw_img)
                    except ValueError as val_err:
                        return Response({"error": str(val_err)}, status=status.HTTP_400_BAD_REQUEST)

            if "rescue_date" in update_payload:
                norm_date = normalize_date_str(update_payload["rescue_date"])
                if norm_date:
                    update_payload["rescue_date"] = norm_date
                else:
                    update_payload.pop("rescue_date", None)

            if "pet_type" in update_payload or "adoption_status" in update_payload:
                c_type, c_status = normalize_pet_classification(
                    update_payload.get("pet_type", existing_pet.get("pet_type")),
                    update_payload.get("adoption_status", existing_pet.get("adoption_status")),
                )
                update_payload["pet_type"] = c_type
                update_payload["adoption_status"] = c_status

            for str_field in ("name", "breed", "gender", "age", "weight", "size", "found_near", "feeding_area"):
                if str_field in update_payload and update_payload[str_field] is not None:
                    update_payload[str_field] = clean_text(update_payload[str_field], 150)

            for long_field in ("current_conditions", "behavior_notes", "about_text", "description"):
                if long_field in update_payload and update_payload[long_field] is not None:
                    update_payload[long_field] = clean_text(update_payload[long_field], 1500)

            if not update_payload:
                return Response({"error": "No valid fields provided for update."}, status=status.HTTP_400_BAD_REQUEST)

            q = db.table("pets").update(update_payload).eq("pet_id", pet_id).execute()
            if not q.data:
                return Response({"error": f'Animal "{pet_id}" not found.'}, status=status.HTTP_404_NOT_FOUND)

            updated_pet = q.data[0]
            new_conditions = str(update_payload.get("current_conditions") or "").strip()
            if (
                "current_conditions" in update_payload
                and is_meaningful_condition(new_conditions)
                and new_conditions.lower() != prev_conditions.lower()
            ):
                create_condition_medical_log(
                    pet_id=pet_id,
                    condition_text=new_conditions,
                    log_date_str=date.today().strftime("%Y-%m-%d"),
                    weight_str=updated_pet.get("weight"),
                    tag="CONDITION UPDATE",
                )

            try:
                med_logs = db.table("medical_records").select("*").eq("pet_id", pet_id).execute().data or []
                vac_logs = db.table("vaccination_logs").select("*").eq("pet_id", pet_id).execute().data or []
                updated_pet["vaccination_status"] = compute_vaccination_status(vac_logs)
                updated_pet["spayed_neutered"] = compute_spayed_neutered(med_logs)
            except Exception as exc:
                logger.warning("Post-update status sync failed for %s: %s", pet_id, exc)

            return Response(updated_pet, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to update pet %s: %s", pet_id, exc)
            return Response(
                {"error": "Unable to update animal profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request, pet_id):
        try:
            db = get_db_client()
            permanent = str(request.query_params.get("permanent", "")).strip().lower() in ("true", "1", "yes")

            if not permanent:
                logger.info("Soft-archiving pet %s by %s", pet_id, request.user.email)
                res = (
                    db.table("pets")
                    .update({
                        "archived_at": datetime.now(timezone.utc).isoformat(),
                        "archived_by": request.user.email,
                    })
                    .eq("pet_id", pet_id)
                    .execute()
                )
                if not res.data:
                    return Response({"error": f'Animal "{pet_id}" not found.'}, status=status.HTTP_404_NOT_FOUND)
                return Response(
                    {
                        "message": "Animal profile archived (clinical & RA 9482 history preserved).",
                        "archived": True,
                        "pet": res.data[0],
                    },
                    status=status.HTTP_200_OK,
                )

            logger.info("Permanently deleting pet %s and dependent records by %s", pet_id, request.user.email)

            feed_id_token = f"pet_{pet_id}"
            db.table("feed_likes").delete().eq("feed_id", feed_id_token).execute()
            db.table("feed_comments").delete().eq("feed_id", feed_id_token).execute()
            db.table("medical_records").delete().eq("pet_id", pet_id).execute()
            db.table("vaccination_logs").delete().eq("pet_id", pet_id).execute()
            db.table("adoption_applications").delete().eq("pet_id", pet_id).execute()
            db.table("pet_images").delete().eq("pet_id", pet_id).execute()

            res = db.table("pets").delete().eq("pet_id", pet_id).execute()
            if not res.data:
                return Response({"error": f'Animal "{pet_id}" not found.'}, status=status.HTTP_404_NOT_FOUND)

            return Response({"message": "Animal profile permanently deleted."}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to delete/archive pet %s: %s", pet_id, exc)
            return Response(
                {"error": "Unable to archive animal profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )


# =====================================================================
# 3. CLINICAL MEDICAL & VACCINATION RECORDS
# =====================================================================

class MedicalRecordsAPIView(APIView):
    permission_classes = [IsMDCStaff]

    def get(self, request, pet_id="log"):
        try:
            db = get_db_client()
            if pet_id in ("all", "log", None):
                data = db.table("medical_records").select("*").order("log_date", desc=True).execute().data
            else:
                data = db.table("medical_records").select("*").eq("pet_id", pet_id).order("log_date", desc=True).execute().data
            return Response(data or [], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to load medical records: %s", exc)
            return Response(
                {"error": "Unable to retrieve medical records."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request, pet_id="log"):
        try:
            db = get_db_client()
            p = dict(request.data)
            if pet_id and pet_id != "log":
                p["pet_id"] = pet_id

            target_pet = clean_text(p.get("pet_id"), 50)
            if not target_pet or target_pet == "log":
                return Response({"error": "A valid pet_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            p["pet_id"] = target_pet

            raw_rtype = clean_text(p.get("record_type"), 80)
            raw_rtype_l = raw_rtype.lower()
            is_spay_neuter = any(kw in raw_rtype_l for kw in SPAY_NEUTER_KEYWORDS)

            if is_spay_neuter:
                record_type_candidates = ["Spay / Neuter", "Clinical Treatment"]
                existing_notes = clean_text(p.get("notes"), 2500)
                if "[spay / neuter" not in existing_notes.lower():
                    p["notes"] = (
                        f"[SPAY / NEUTER — TNR STERILIZATION]\n{existing_notes}"
                        if existing_notes
                        else "[SPAY / NEUTER — TNR STERILIZATION]"
                    )
                record_type = "Spay / Neuter"
            elif "Bite" in raw_rtype or ("Incident" in raw_rtype and "Scratch" not in raw_rtype):
                record_type = "Bite Incident"
                record_type_candidates = [record_type]
            elif "Scratch" in raw_rtype:
                record_type = "Scratch Incident"
                record_type_candidates = [record_type]
            elif "Treatment" in raw_rtype or "Clinical" in raw_rtype:
                record_type = "Clinical Treatment"
                record_type_candidates = [record_type]
            else:
                record_type = "Check-up"
                record_type_candidates = [record_type]
            p["record_type"] = record_type

            parsed_log_dt = parse_datetime_safe(p.get("log_date")) or datetime.now()
            p["log_date"] = parsed_log_dt.strftime("%Y-%m-%d")
            p["next_followup_date"] = normalize_date_str(p.get("next_followup_date"))

            if "Bite" in record_type or "Scratch" in record_type:
                expiry_dt = parsed_log_dt + timedelta(days=14)
                expiry_str = expiry_dt.strftime("%Y-%m-%d")
                if not p.get("next_followup_date"):
                    p["next_followup_date"] = expiry_str

                try:
                    db.table("pets").update({
                        "status": "Quarantine / Rabies Observation",
                        "current_conditions": f"Under 14-day Rabies Observation (until {p['next_followup_date']})",
                    }).eq("pet_id", target_pet).execute()
                except Exception as exc:
                    logger.warning("Failed to update quarantine status for %s: %s", target_pet, exc)

            p["notes"] = clean_text(p.get("notes"), 3000)
            p["medication_prescribed"] = clean_text(p.get("medication_prescribed"), 500)
            p["weight_at_log"] = clean_text(p.get("weight_at_log"), 40)
            p["veterinarian"] = clean_text(p.get("veterinarian"), 120) or request.user.full_name or request.user.email

            allowed_fields = {
                "pet_id", "record_type", "notes", "log_date",
                "medication_prescribed", "next_followup_date",
                "weight_at_log", "veterinarian",
            }

            res = None
            last_err = None
            for cand_rtype in record_type_candidates:
                p["record_type"] = cand_rtype
                insert_payload = {
                    k: v for k, v in p.items()
                    if k in allowed_fields and v is not None and str(v).strip() != ""
                }
                try:
                    res = db.table("medical_records").insert(insert_payload).execute()
                    last_err = None
                    break
                except Exception as ins_err:
                    last_err = ins_err
                    if "23514" not in str(ins_err) and "check constraint" not in str(ins_err).lower():
                        raise

            if last_err is not None:
                raise last_err
            if not res or not res.data:
                return Response({"error": "Failed to save medical record."}, status=status.HTTP_400_BAD_REQUEST)

            if is_spay_neuter:
                try:
                    db.table("pets").update({"spayed_neutered": True}).eq("pet_id", target_pet).execute()
                except Exception as exc:
                    logger.warning("Failed to sync spayed_neutered for %s: %s", target_pet, exc)

            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Failed to save medical record: %s", exc)
            return Response(
                {"error": "Unable to save medical record. Please check the entered fields."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class VaccinationLogsAPIView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            pet_id = self.kwargs.get("pet_id")
            if pet_id in ("all", "log", None):
                return [IsMDCStaff()]
            return [IsAuthenticatedUser()]
        return [IsMDCStaff()]

    def get(self, request, pet_id="log"):
        try:
            db = get_db_client()
            if pet_id in ("all", "log", None):
                data = db.table("vaccination_logs").select("*").order("administered_date", desc=True).execute().data
            else:
                data = db.table("vaccination_logs").select("*").eq("pet_id", pet_id).order("administered_date", desc=True).execute().data
            return Response(data or [], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to load vaccination logs: %s", exc)
            return Response(
                {"error": "Unable to retrieve vaccination records."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request, pet_id="log"):
        try:
            db = get_db_client()
            p = dict(request.data)
            if pet_id and pet_id != "log":
                p["pet_id"] = pet_id

            target_pet = clean_text(p.get("pet_id"), 50)
            vaccine_name = clean_text(p.get("vaccine_name"), 150)
            if not target_pet or target_pet == "log":
                return Response({"error": "A valid pet_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            if not vaccine_name:
                return Response({"error": "Vaccine name is required."}, status=status.HTTP_400_BAD_REQUEST)

            p["pet_id"] = target_pet
            p["vaccine_name"] = vaccine_name

            try:
                pet_row = db.table("pets").select("species").eq("pet_id", target_pet).execute()
                if pet_row.data:
                    species_err = validate_species_vaccine_compatibility(
                        pet_row.data[0].get("species"), vaccine_name
                    )
                    if species_err:
                        return Response({"error": species_err}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as exc:
                logger.warning("Species compatibility check skipped for %s: %s", target_pet, exc)

            for date_key in ("administered_date", "next_due_date", "expiration_date"):
                if date_key in p:
                    p[date_key] = normalize_date_str(p.get(date_key))

            p["batch_lot_number"] = clean_text(p.get("batch_lot_number"), 60)
            p["batch_number"] = clean_text(p.get("batch_number"), 60)
            p["weight_at_vaccination"] = clean_text(p.get("weight_at_vaccination"), 40)
            p["administered_by"] = clean_text(p.get("administered_by"), 120) or request.user.full_name or request.user.email

            allowed_fields = {
                "pet_id", "vaccine_name", "administered_date", "next_due_date",
                "batch_lot_number", "batch_number", "weight_at_vaccination",
                "administered_by", "expiration_date",
            }
            insert_payload = {
                k: v for k, v in p.items()
                if k in allowed_fields and v is not None and str(v).strip() != ""
            }
            res = db.table("vaccination_logs").insert(insert_payload).execute()
            if not res.data:
                return Response({"error": "Failed to save vaccination log."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                all_pet_vacs = db.table("vaccination_logs").select("*").eq("pet_id", target_pet).execute().data or []
                computed_vac_status = compute_vaccination_status(all_pet_vacs)
                safe_sync_pet_vaccination_status(target_pet, computed_vac_status)
            except Exception as exc:
                logger.warning("Post-vaccine status sync failed for %s: %s", target_pet, exc)

            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Failed to log vaccination: %s", exc)
            return Response(
                {"error": "Unable to save vaccination log."},
                status=status.HTTP_400_BAD_REQUEST,
            )


# =====================================================================
# 4. SUPPLY & INVENTORY LOGISTICS
# =====================================================================

def _validate_inventory_payload(raw_data: dict, require_core: bool = False):
    payload = {k: v for k, v in raw_data.items() if k in ALLOWED_INVENTORY_FIELDS}

    if require_core:
        item_name = clean_text(payload.get("item_name"), 150)
        if not item_name:
            return None, {"error": "Item name is required."}
        payload["item_name"] = item_name
    elif "item_name" in payload:
        item_name = clean_text(payload.get("item_name"), 150)
        if not item_name:
            return None, {"error": "Item name cannot be empty."}
        payload["item_name"] = item_name

    if "category" in payload and payload["category"]:
        cat = clean_text(payload["category"], 40)
        if cat not in ALLOWED_INVENTORY_CATEGORIES:
            return None, {"category": [f'"{cat}" is not a valid category.']}
        payload["category"] = cat

    unit_submitted = payload.get("unit")
    if unit_submitted is not None and str(unit_submitted).strip() != "":
        unit_clean = str(unit_submitted).strip()
        if unit_clean not in APPROVED_INVENTORY_UNITS:
            return None, {"unit": [f'"{unit_clean}" is not a valid choice.']}
        payload["unit"] = unit_clean

    if "quantity" in payload:
        try:
            q = int(float(payload["quantity"]))
            if q < 0:
                return None, {"quantity": ["Stock quantity cannot be negative."]}
            payload["quantity"] = q
        except (ValueError, TypeError):
            return None, {"quantity": ["Stock quantity must be a valid number."]}

    if "min_threshold" in payload and payload["min_threshold"] is not None:
        try:
            mt = int(float(payload["min_threshold"]))
            if mt < 0:
                return None, {"min_threshold": ["Minimum threshold cannot be negative."]}
            payload["min_threshold"] = mt
        except (ValueError, TypeError):
            return None, {"min_threshold": ["Minimum threshold must be a valid non-negative number."]}

    if "supplier_donor" in payload:
        payload["supplier_donor"] = clean_text(payload.get("supplier_donor"), 150) or None

    if "expiration_date" in payload:
        payload["expiration_date"] = normalize_date_str(payload.get("expiration_date"))

    return payload, None


class InventoryAPIView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticatedUser()]
        return [IsMDCStaff()]

    def get(self, request):
        try:
            data = get_db_client().table("inventory").select("*").order("item_name").execute().data
            return Response(data or [], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to load inventory: %s", exc)
            return Response(
                {"error": "Unable to retrieve inventory records."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        try:
            payload, err = _validate_inventory_payload(dict(request.data), require_core=True)
            if err:
                return Response(err, status=status.HTTP_400_BAD_REQUEST)

            res = get_db_client().table("inventory").insert(payload).execute()
            if not res.data:
                return Response({"error": "Failed to add inventory item."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Failed to create inventory item: %s", exc)
            return Response(
                {"error": "Unable to save inventory item."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class InventoryDetailAPIView(APIView):
    permission_classes = [IsMDCStaff]

    def patch(self, request, item_id):
        return self.put(request, item_id)

    def put(self, request, item_id):
        try:
            payload, err = _validate_inventory_payload(dict(request.data), require_core=False)
            if err:
                return Response(err, status=status.HTTP_400_BAD_REQUEST)
            if not payload:
                return Response({"error": "No valid fields provided for update."}, status=status.HTTP_400_BAD_REQUEST)

            res = get_db_client().table("inventory").update(payload).eq("item_id", item_id).execute()
            if not res.data:
                return Response({"error": "Inventory item not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response(res.data[0], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to update inventory item %s: %s", item_id, exc)
            return Response(
                {"error": "Unable to update inventory item."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request, item_id):
        try:
            res = get_db_client().table("inventory").delete().eq("item_id", item_id).execute()
            if not res.data:
                return Response({"error": "Inventory item not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response({"message": "Inventory item removed."}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to delete inventory item %s: %s", item_id, exc)
            return Response(
                {"error": "Unable to delete inventory item."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class InventoryTransactionAPIView(APIView):
    permission_classes = [IsMDCStaff]

    def get(self, request):
        try:
            data = (
                get_db_client()
                .table("inventory_transactions")
                .select("*, inventory(item_name, unit)")
                .order("logged_at", desc=True)
                .execute()
                .data
            )
            return Response(data or [], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to load inventory transactions: %s", exc)
            return Response(
                {"error": "Unable to load stock transaction history."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        try:
            db = get_db_client()
            d = request.data
            item_id = d.get("item_id")
            if item_id is None:
                return Response({"error": "item_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            tx_type = clean_text(d.get("transaction_type"), 20).upper()
            try:
                qty_changed = int(float(d.get("quantity_changed", 0)))
            except (ValueError, TypeError):
                qty_changed = 0

            if qty_changed <= 0:
                return Response(
                    {"error": "Disbursement or replenishment quantity must be greater than zero."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            reason_clean = clean_text(d.get("reason"), 300) or "Routine Stock Update"
            supplier_clean = clean_text(d.get("supplier_donor"), 150) or None
            logged_by = request.user.email or request.user.full_name or "MDC Staff"

            # Prefer atomic Postgres RPC (locks inventory row with FOR UPDATE)
            if hasattr(db, "rpc"):
                try:
                    rpc_res = db.rpc(
                        "record_inventory_transaction",
                        {
                            "p_item_id": int(item_id),
                            "p_transaction_type": tx_type or "IN",
                            "p_quantity_changed": qty_changed,
                            "p_reason": reason_clean,
                            "p_supplier_donor": supplier_clean,
                            "p_logged_by": logged_by,
                        },
                    ).execute()
                    tx_row = rpc_res.data[0] if isinstance(rpc_res.data, list) and rpc_res.data else rpc_res.data
                    if tx_row:
                        return Response(tx_row, status=status.HTTP_201_CREATED)
                except Exception as rpc_err:
                    err_str = str(rpc_err)
                    if "exceeds available balance" in err_str.lower() or "greater than zero" in err_str.lower():
                        return Response({"error": err_str}, status=status.HTTP_400_BAD_REQUEST)
                    if "not found in inventory" in err_str.lower():
                        return Response({"error": "Item not found in inventory."}, status=status.HTTP_404_NOT_FOUND)
                    logger.warning("Atomic inventory RPC fallback triggered: %s", rpc_err)

            i_q = db.table("inventory").select("quantity, item_name, unit").eq("item_id", item_id).execute()
            if not i_q.data:
                return Response({"error": "Item not found in inventory."}, status=status.HTTP_404_NOT_FOUND)

            try:
                current_qty = int(float(i_q.data[0].get("quantity", 0)))
            except (ValueError, TypeError):
                current_qty = 0

            is_outflow = tx_type in ("OUT", "OUTFLOW", "DISBURSEMENT", "DEDUCTION")
            if is_outflow:
                if qty_changed > current_qty:
                    return Response(
                        {"error": f"Disbursement quantity exceeds available balance ({current_qty} on-hand)"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                new_q = current_qty - qty_changed
            else:
                new_q = current_qty + qty_changed

            db.table("inventory").update({"quantity": new_q}).eq("item_id", item_id).execute()
            tx = db.table("inventory_transactions").insert({
                "item_id": item_id,
                "transaction_type": "OUT" if is_outflow else "IN",
                "quantity_changed": qty_changed,
                "reason": reason_clean,
                "supplier_donor": supplier_clean,
                "logged_by": logged_by,
            }).execute()
            if not tx.data:
                return Response({"error": "Failed to record inventory transaction."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(tx.data[0], status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Failed to log inventory transaction: %s", exc)
            return Response(
                {"error": "Unable to record inventory transaction."},
                status=status.HTTP_400_BAD_REQUEST,
            )


# =====================================================================
# 5. ADOPTION APPLICATION PIPELINE
# =====================================================================

class AdoptionApplicationAPIView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        try:
            db = get_db_client()
            query = db.table("adoption_applications").select("*")
            if request.user.is_staff:
                email_filter = clean_text(request.query_params.get("email"), 150).lower()
                if email_filter:
                    query = query.eq("email", email_filter)
            else:
                # Regular users may only view their own adoption applications
                query = query.eq("email", request.user.email)

            res_data = query.execute().data or []
            res_data.sort(key=lambda x: str(x.get("submitted_at") or x.get("created_at") or ""), reverse=True)
            return Response(res_data, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to load adoption applications: %s", exc)
            return Response(
                {"error": "Unable to retrieve adoption applications."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        try:
            db = get_db_client()
            d = request.data
            pet_id = clean_text(d.get("pet_id"), 50)
            full_name = clean_text(d.get("full_name"), 150) or request.user.full_name
            email = request.user.email
            contact_number = clean_text(d.get("contact_number"), 30)
            address = clean_text(d.get("address"), 300)
            plan_if_moving = clean_text(d.get("plan_if_moving"), 1000)

            if not pet_id or not full_name or not email or not contact_number:
                return Response(
                    {"error": "Pet ID, full name, and contact number are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            digits_only = re.sub(r"[\s-]", "", contact_number)
            if not PHONE_PATTERN.match(digits_only):
                return Response(
                    {"error": "Please enter a valid contact number (e.g. 09171234567)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not address or len(address) < 5:
                return Response(
                    {"error": "Please provide your residential address."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not bool(d.get("household_agreement")):
                return Response(
                    {"error": "Household agreement is required before submitting an adoption application."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            pet_check = db.table("pets").select("pet_id, adoption_status").eq("pet_id", pet_id).execute()
            if not pet_check.data:
                return Response({"error": "Selected animal record was not found."}, status=status.HTTP_404_NOT_FOUND)
            if str(pet_check.data[0].get("adoption_status") or "").lower() == "adopted":
                return Response(
                    {"error": "This companion has already been adopted and is no longer accepting applications."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            dup_check = (
                db.table("adoption_applications")
                .select("application_id")
                .eq("pet_id", pet_id)
                .eq("email", email)
                .eq("application_status", "Pending")
                .execute()
            )
            if dup_check.data:
                return Response(
                    {"error": "You already have a pending adoption application for this companion."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ins = {
                "pet_id": pet_id,
                "full_name": full_name,
                "email": email,
                "contact_number": contact_number,
                "address": address,
                "experience_level": clean_text(d.get("experience_level"), 60) or "Beginner",
                "housing_type": clean_text(d.get("housing_type"), 60) or "Owned House",
                "has_secure_fence": bool(d.get("has_secure_fence")),
                "household_agreement": bool(d.get("household_agreement")),
                "pet_care_budget": clean_text(d.get("pet_care_budget"), 80) or "Moderate (PHP 2,000 - 5,000)",
                "plan_if_moving": plan_if_moving,
                "application_status": "Pending",
            }
            res = db.table("adoption_applications").insert(ins).execute()
            if not res.data:
                return Response({"error": "Failed to submit adoption application."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Failed to submit adoption application: %s", exc)
            return Response(
                {"error": "Unable to submit adoption application."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class AdoptionApplicationDetailAPIView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def put(self, request, application_id):
        try:
            db = get_db_client()
            d = request.data
            status_val = clean_text(d.get("application_status"), 40)
            if not status_val:
                return Response({"error": "application_status is required."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                target_id = int(application_id)
            except ValueError:
                target_id = application_id

            raw_lower = status_val.lower()
            is_withdrawal = raw_lower in ("cancelled", "canceled", "withdrawn")

            existing = db.table("adoption_applications").select("*").eq("application_id", target_id).execute()
            if not existing.data:
                return Response({"error": "Adoption application not found."}, status=status.HTTP_404_NOT_FOUND)

            existing_app = existing.data[0]
            app_owner_email = (existing_app.get("email") or "").strip().lower()

            # Authorization: non-staff users may only withdraw their own pending application
            if not request.user.is_staff:
                if not is_withdrawal or app_owner_email != request.user.email:
                    return Response(
                        {"detail": "You do not have permission to perform this action."},
                        status=status.HTTP_403_FORBIDDEN,
                    )

            if is_withdrawal and existing_app.get("application_status") == "Approved":
                return Response(
                    {"error": "Approved adoption placements cannot be withdrawn directly. Please contact MDC staff."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if raw_lower in ("rejected", "reject", "denied", "deny", "declined", "decline"):
                status_candidates = ["Denied", "Declined", "Rejected"]
            elif is_withdrawal:
                status_candidates = ["Cancelled", "Canceled", "Denied", "Declined"]
            elif raw_lower == "approved":
                status_candidates = ["Approved"]
            elif raw_lower == "pending":
                status_candidates = ["Pending"]
            else:
                return Response({"error": "Invalid application status."}, status=status.HTTP_400_BAD_REQUEST)

            pet_id = existing_app.get("pet_id") or d.get("pet_id")

            if status_candidates[0] == "Approved" and pet_id:
                current_pet = db.table("pets").select("adoption_status, name, primary_image").eq("pet_id", pet_id).execute()
                if current_pet.data and current_pet.data[0].get("adoption_status") == "Adopted":
                    return Response(
                        {"error": "This companion has already been placed with an approved applicant."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            res = None
            last_err = None
            for candidate_status in status_candidates:
                try:
                    res = (
                        db.table("adoption_applications")
                        .update({"application_status": candidate_status})
                        .eq("application_id", target_id)
                        .execute()
                    )
                    status_val = candidate_status
                    last_err = None
                    break
                except Exception as upd_err:
                    last_err = upd_err
                    if "23514" not in str(upd_err) and "check constraint" not in str(upd_err).lower():
                        raise

            if last_err is not None:
                raise last_err
            if not res or not res.data:
                return Response({"error": "Adoption application not found."}, status=status.HTTP_404_NOT_FOUND)

            if status_val == "Approved" and pet_id:
                db.table("pets").update({"adoption_status": "Adopted"}).eq("pet_id", pet_id).execute()

                for close_status in ("Closed - Pet Placed", "Denied", "Declined", "Rejected", "Cancelled"):
                    try:
                        (
                            db.table("adoption_applications")
                            .update({"application_status": close_status})
                            .eq("pet_id", pet_id)
                            .eq("application_status", "Pending")
                            .neq("application_id", target_id)
                            .execute()
                        )
                        break
                    except Exception as close_err:
                        if "23514" not in str(close_err) and "check constraint" not in str(close_err).lower():
                            logger.warning("Closing sibling applications failed: %s", close_err)
                            break

                try:
                    pet_query = db.table("pets").select("name, primary_image").eq("pet_id", pet_id).execute()
                    pet_name = pet_query.data[0].get("name", "A companion") if pet_query.data else "A companion"
                    pet_image = pet_query.data[0].get("primary_image") if pet_query.data else None
                    db.table("campus_announcements").insert({
                        "title": f"Adoption Confirmed: {pet_name} Found a Forever Home!",
                        "content": f"Great news! The adoption application for {pet_name} ({pet_id}) has been approved by MDC staff.",
                        "author_email": request.user.email or "mdc.operations@cit.edu",
                        "image_url": pet_image,
                    }).execute()
                except Exception as inner_err:
                    logger.warning("Could not auto-post adoption announcement: %s", inner_err)

            return Response(res.data[0], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to update adoption application %s: %s", application_id, exc)
            return Response(
                {"error": "Unable to update adoption application status."},
                status=status.HTTP_400_BAD_REQUEST,
            )


# =====================================================================
# 6. ANIMAL SIGHTINGS & TRIAGE
# =====================================================================

class AnimalSightingAPIView(APIView):
    permission_classes = [IsAuthenticatedUser]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request):
        try:
            db = get_db_client()
            query = db.table("animal_sightings").select("*")
            if request.user.is_staff:
                email_filter = clean_text(request.query_params.get("email"), 150).lower()
                if email_filter:
                    query = query.eq("reporter_email", email_filter)
            else:
                query = query.eq("reporter_email", request.user.email)

            res = query.order("logged_at", desc=True).execute()
            return Response(res.data or [], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to fetch sightings: %s", exc)
            return Response(
                {"error": "Unable to load sighting reports."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        try:
            d = request.data
            image_file = request.FILES.get("image")
            image_url = None
            if image_file:
                try:
                    image_url = _upload_image_to_bucket(image_file, "sightings", "sighting")
                except ValueError as val_err:
                    return Response({"error": str(val_err)}, status=status.HTTP_400_BAD_REQUEST)

            campus_zone = clean_text(d.get("campus_zone"), 120)
            is_emergency = str(d.get("is_emergency", "")).strip().lower() in ("true", "1", "yes")
            location_details = clean_text(d.get("location_details"), 400)
            distinct_features = clean_text(d.get("distinct_features"), 1200)
            animal_type = clean_text(d.get("animal_type"), 30) or "Others"
            if animal_type not in ALLOWED_ANIMAL_TYPES:
                animal_type = "Others"

            if not location_details or not distinct_features:
                return Response(
                    {"error": "Both location details and distinguishing features are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if campus_zone and not location_details.startswith(f"[{campus_zone}]"):
                location_details = f"[{campus_zone}] {location_details}"

            if is_emergency and not _is_urgent_feature_text(distinct_features):
                distinct_features = f"[URGENT EMERGENCY] {distinct_features}"

            insert_payload = {
                "reporter_email": request.user.email,
                "animal_type": animal_type,
                "distinct_features": distinct_features,
                "location_details": location_details,
                "campus_zone": campus_zone or None,
                "is_emergency": is_emergency,
                "image_url": image_url,
                "status": "Pending",
            }
            res = get_db_client().table("animal_sightings").insert(insert_payload).execute()
            if not res.data:
                return Response({"error": "Failed to save sighting report."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Failed to submit sighting report: %s", exc)
            return Response(
                {"error": "Unable to submit sighting report."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class AnimalSightingDetailAPIView(APIView):
    permission_classes = [IsMDCStaff]

    def put(self, request, sighting_id):
        try:
            status_val = clean_text(request.data.get("status"), 30)
            if status_val not in ALLOWED_SIGHTING_STATUSES:
                return Response(
                    {"error": "Status must be one of: Pending, Investigated, Resolved."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            res = (
                get_db_client()
                .table("animal_sightings")
                .update({"status": status_val})
                .eq("sighting_id", sighting_id)
                .execute()
            )
            if not res.data:
                return Response({"error": "Sighting report not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response(res.data[0], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to update sighting %s: %s", sighting_id, exc)
            return Response(
                {"error": "Unable to update sighting status."},
                status=status.HTTP_400_BAD_REQUEST,
            )


# =====================================================================
# 7. ANNOUNCEMENTS & COMMUNITY NEWSFEED
# =====================================================================

class CampusAnnouncementAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticatedUser()]
        return [IsMDCStaff()]

    def get(self, request):
        try:
            res = get_db_client().table("campus_announcements").select("*").order("created_at", desc=True).execute()
            return Response(res.data or [], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to load announcements: %s", exc)
            return Response(
                {"error": "Unable to load campus announcements."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        try:
            d = request.data
            title = clean_text(d.get("title"), 200)
            content = clean_text(d.get("content"), 4000)
            if not title or not content:
                return Response({"error": "Both title and content are required."}, status=status.HTTP_400_BAD_REQUEST)

            image_file = request.FILES.get("image")
            uploaded_image_url = None
            if image_file:
                try:
                    uploaded_image_url = _upload_image_to_bucket(image_file, "announcements", "announcement")
                except ValueError as val_err:
                    return Response({"error": str(val_err)}, status=status.HTTP_400_BAD_REQUEST)

            insert_payload = {
                "title": title,
                "content": content,
                "author_email": request.user.email or "mdc.staff@cit.edu",
                "image_url": uploaded_image_url,
            }
            res = get_db_client().table("campus_announcements").insert(insert_payload).execute()
            if not res.data:
                return Response({"error": "Failed to publish campus announcement."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Failed to create announcement: %s", exc)
            return Response(
                {"error": "Unable to publish announcement."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UnifiedNewsfeedAPIView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        try:
            db = get_db_client()
            unified_feed = []
            current_user = request.user.email

            all_likes = db.table("feed_likes").select("*").execute().data or []
            all_comments = db.table("feed_comments").select("*").order("created_at", desc=False).execute().data or []

            likes_map = {}
            user_liked_set = set()
            for like in all_likes:
                fid = like.get("feed_id")
                if not fid:
                    continue
                likes_map[fid] = likes_map.get(fid, 0) + 1
                if current_user and (like.get("user_email") or "").strip().lower() == current_user:
                    user_liked_set.add(fid)

            comments_map = {}
            for comment in all_comments:
                fid = comment.get("feed_id")
                if not fid:
                    continue
                resolved_cid = comment.get("comment_id") if comment.get("comment_id") is not None else comment.get("id")
                comments_map.setdefault(fid, []).append({
                    "comment_id": resolved_cid,
                    "id": resolved_cid,
                    "user_email": comment.get("user_email"),
                    "comment_text": comment.get("comment_text"),
                    "timestamp": comment.get("created_at"),
                    "created_at": comment.get("created_at"),
                })

            # 1. Verified sightings and active emergencies
            sightings = db.table("animal_sightings").select("*").neq("status", "Resolved").execute().data or []
            for s in sightings:
                raw_features = s.get("distinct_features") or ""
                is_urgent = bool(s.get("is_emergency")) or _is_urgent_feature_text(raw_features)
                status_val = s.get("status") or "Pending"
                if status_val == "Pending" and not is_urgent:
                    continue

                fid = f"sighting_{s.get('sighting_id')}"
                clean_features = _strip_urgent_marker(raw_features) or "See attached photo"
                badge = "URGENT EMERGENCY" if is_urgent else ("Verified Sighting" if status_val == "Investigated" else status_val)
                unified_feed.append({
                    "feed_id": fid,
                    "item_type": "sighting",
                    "is_urgent": is_urgent,
                    "title": f"Campus Sighting: {s.get('animal_type') or 'Campus Animal'}",
                    "body": f"{clean_features}",
                    "badge_text": badge,
                    "meta_details": s.get("location_details") or "CIT-U Campus Grounds",
                    "campus_zone": s.get("campus_zone") or "",
                    "image_url": s.get("image_url"),
                    "author_tag": s.get("reporter_email") or "Campus Reporter",
                    "timestamp": s.get("logged_at") or "",
                    "likes_count": likes_map.get(fid, 0),
                    "is_liked_by_me": fid in user_liked_set,
                    "comments": comments_map.get(fid, []),
                })

            # 2. Registered companion profiles (exclude soft-archived records)
            pets = [p for p in (db.table("pets").select("*").execute().data or []) if not p.get("archived_at")]
            for p in pets:
                fid = f"pet_{p.get('pet_id')}"
                pet_timestamp = p.get("created_at") or p.get("rescue_date") or ""
                breed_str = (p.get("breed") or "Domestic Mix").strip()
                species_str = (p.get("species") or "Companion").strip()
                about_str = (p.get("about_text") or p.get("description") or "Active companion cared for by CIT-U Task Force Bruno.").strip()
                colony_str = (p.get("found_near") or "CIT-U Grounds").strip()
                unified_feed.append({
                    "feed_id": fid,
                    "item_type": "pet",
                    "is_urgent": False,
                    "title": f"Meet {p.get('name') or p.get('pet_id')}",
                    "body": f"{breed_str} {species_str} — {about_str}",
                    "badge_text": p.get("adoption_status") or "Campus Pet",
                    "meta_details": colony_str,
                    "image_url": p.get("primary_image"),
                    "author_tag": "CIT-U MDC Operations",
                    "timestamp": pet_timestamp,
                    "likes_count": likes_map.get(fid, 0),
                    "is_liked_by_me": fid in user_liked_set,
                    "comments": comments_map.get(fid, []),
                })

            # 3. Official campus announcements
            announcements = db.table("campus_announcements").select("*").execute().data or []
            for a in announcements:
                fid = f"announcement_{a.get('announcement_id')}"
                unified_feed.append({
                    "feed_id": fid,
                    "item_type": "announcement",
                    "is_urgent": False,
                    "title": a.get("title") or "Campus Bulletin",
                    "body": a.get("content") or "",
                    "badge_text": "Official Notice",
                    "meta_details": "MDC Bulletin",
                    "image_url": a.get("image_url"),
                    "author_tag": a.get("author_email") or "mdc.staff@cit.edu",
                    "timestamp": a.get("created_at") or "",
                    "likes_count": likes_map.get(fid, 0),
                    "is_liked_by_me": fid in user_liked_set,
                    "comments": comments_map.get(fid, []),
                })

            unified_feed.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)
            limit, offset = _parse_pagination_params(request)
            if limit > 0:
                unified_feed = unified_feed[offset: offset + limit]
            return Response(unified_feed, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to build unified newsfeed: %s", exc)
            return Response(
                {"error": "Unable to load the community newsfeed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ToggleLikeAPIView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        try:
            db = get_db_client()
            feed_id = clean_text(request.data.get("feed_id"), 100)
            user_email = request.user.email
            if not feed_id:
                return Response({"error": "feed_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            existing = db.table("feed_likes").select("*").eq("feed_id", feed_id).eq("user_email", user_email).execute()
            if existing.data:
                db.table("feed_likes").delete().eq("feed_id", feed_id).eq("user_email", user_email).execute()
                return Response({"liked": False}, status=status.HTTP_200_OK)

            db.table("feed_likes").insert({"feed_id": feed_id, "user_email": user_email}).execute()
            return Response({"liked": True}, status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Failed to toggle like: %s", exc)
            return Response({"error": "Unable to update like."}, status=status.HTTP_400_BAD_REQUEST)


class AddCommentAPIView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        try:
            feed_id = clean_text(request.data.get("feed_id"), 100)
            user_email = request.user.email
            comment_text = clean_text(request.data.get("comment_text"), 1000)
            if not feed_id or not comment_text:
                return Response(
                    {"error": "feed_id and non-empty comment_text are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            res = get_db_client().table("feed_comments").insert({
                "feed_id": feed_id,
                "user_email": user_email,
                "comment_text": comment_text,
            }).execute()
            if not res.data:
                return Response({"error": "Failed to save comment."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Failed to add comment: %s", exc)
            return Response({"error": "Unable to post comment."}, status=status.HTTP_400_BAD_REQUEST)


class CommentActionAPIView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def _parse_comment_id(self, raw_id):
        if raw_id is None:
            return None
        s = str(raw_id).strip()
        if not s:
            return None
        return int(s) if s.isdigit() else s

    def _lookup_comment(self, parsed_id):
        db = get_db_client()
        for pk_col in ("comment_id", "id"):
            try:
                res = db.table("feed_comments").select("*").eq(pk_col, parsed_id).execute()
                if res.data:
                    return pk_col, res.data[0]
            except Exception:
                continue
        return None, None

    def patch(self, request):
        return self.put(request)

    def put(self, request):
        try:
            d = request.data
            raw_cid = d.get("comment_id") if d.get("comment_id") is not None else d.get("id")
            user_email = request.user.email
            comment_text = clean_text(d.get("comment_text"), 1000)

            comment_id = self._parse_comment_id(raw_cid)
            if comment_id is None or not comment_text:
                return Response(
                    {"error": "comment_id and non-empty comment_text are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            pk_col, row = self._lookup_comment(comment_id)
            if not row:
                return Response({"error": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)

            existing_email = (row.get("user_email") or "").strip().lower()
            if existing_email != user_email:
                return Response({"error": "You can only edit your own comment."}, status=status.HTTP_403_FORBIDDEN)

            db = get_db_client()
            res = db.table("feed_comments").update({"comment_text": comment_text}).eq(pk_col, comment_id).execute()
            if not res.data:
                verify = db.table("feed_comments").select("comment_text").eq(pk_col, comment_id).execute()
                if not verify.data or verify.data[0].get("comment_text") != comment_text:
                    return Response(
                        {"error": "Unable to update comment due to database permissions."},
                        status=status.HTTP_403_FORBIDDEN,
                    )

            finalized = res.data[0] if res.data else {
                "comment_id": comment_id,
                "id": comment_id,
                "comment_text": comment_text,
            }
            return Response(finalized, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to edit comment: %s", exc)
            return Response({"error": "Unable to update comment."}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        try:
            raw_cid = (
                request.query_params.get("comment_id")
                or request.query_params.get("id")
                or request.data.get("comment_id")
                or request.data.get("id")
            )
            comment_id = self._parse_comment_id(raw_cid)
            if comment_id is None:
                return Response({"error": "comment_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            pk_col, row = self._lookup_comment(comment_id)
            if not row:
                return Response({"error": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)

            existing_email = (row.get("user_email") or "").strip().lower()
            if existing_email != request.user.email and not request.user.is_staff:
                return Response({"error": "You can only delete your own comment."}, status=status.HTTP_403_FORBIDDEN)

            db = get_db_client()
            res = db.table("feed_comments").delete().eq(pk_col, comment_id).execute()
            if not res.data:
                verify = db.table("feed_comments").select(pk_col).eq(pk_col, comment_id).execute()
                if verify.data:
                    return Response(
                        {"error": "Unable to delete comment due to database permissions."},
                        status=status.HTTP_403_FORBIDDEN,
                    )

            return Response({"message": "Comment deleted."}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to delete comment: %s", exc)
            return Response({"error": "Unable to delete comment."}, status=status.HTTP_400_BAD_REQUEST)


# =====================================================================
# 8. STAFF FEED MODERATION & AI TRAIT SEARCH
# =====================================================================

class NewsfeedItemActionAPIView(APIView):
    permission_classes = [IsMDCStaff]

    def delete(self, request):
        try:
            db = get_db_client()
            feed_id = clean_text(request.query_params.get("feed_id"), 100)
            if not feed_id:
                return Response({"error": "feed_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            if feed_id.startswith("announcement_"):
                raw_id = feed_id.replace("announcement_", "", 1)
                try:
                    announcement_id = int(raw_id)
                except ValueError:
                    return Response({"error": "Invalid announcement ID."}, status=status.HTTP_400_BAD_REQUEST)

                db.table("feed_likes").delete().eq("feed_id", feed_id).execute()
                db.table("feed_comments").delete().eq("feed_id", feed_id).execute()
                delete_res = db.table("campus_announcements").delete().eq("announcement_id", announcement_id).execute()
                if not delete_res.data:
                    return Response({"error": "Announcement not found."}, status=status.HTTP_404_NOT_FOUND)

            elif feed_id.startswith("sighting_"):
                raw_id = feed_id.replace("sighting_", "", 1)
                try:
                    sighting_id = int(raw_id)
                except ValueError:
                    return Response({"error": "Invalid sighting ID."}, status=status.HTTP_400_BAD_REQUEST)

                db.table("feed_likes").delete().eq("feed_id", feed_id).execute()
                db.table("feed_comments").delete().eq("feed_id", feed_id).execute()
                delete_res = db.table("animal_sightings").delete().eq("sighting_id", sighting_id).execute()
                if not delete_res.data:
                    return Response({"error": "Sighting report not found."}, status=status.HTTP_404_NOT_FOUND)

            elif feed_id.startswith("pet_"):
                # Feed moderation clears comments/likes without deleting the master pet profile
                db.table("feed_likes").delete().eq("feed_id", feed_id).execute()
                db.table("feed_comments").delete().eq("feed_id", feed_id).execute()
                logger.info("Cleared feed interactions for %s by %s", feed_id, request.user.email)
            else:
                return Response({"error": "Unsupported feed item type."}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"message": "Post deleted successfully."}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to delete feed item: %s", exc)
            return Response({"error": "Unable to delete feed post."}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            d = request.data
            feed_id = clean_text(d.get("feed_id"), 100)
            if not feed_id:
                return Response({"error": "feed_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            if not feed_id.startswith("announcement_"):
                return Response({"error": "Only announcements can be edited."}, status=status.HTTP_403_FORBIDDEN)

            title = clean_text(d.get("title"), 200)
            body = clean_text(d.get("body"), 4000)
            if not title or not body:
                return Response({"error": "Both title and body are required."}, status=status.HTTP_400_BAD_REQUEST)

            raw_id = feed_id.replace("announcement_", "", 1)
            try:
                announcement_id = int(raw_id)
            except ValueError:
                return Response({"error": "Invalid announcement ID."}, status=status.HTTP_400_BAD_REQUEST)

            update_res = (
                get_db_client()
                .table("campus_announcements")
                .update({"title": title, "content": body})
                .eq("announcement_id", announcement_id)
                .execute()
            )
            if not update_res.data:
                return Response({"error": "Announcement not found."}, status=status.HTTP_404_NOT_FOUND)

            return Response(
                {"message": "Announcement updated successfully.", "data": update_res.data[0]},
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            logger.exception("Failed to edit announcement: %s", exc)
            return Response({"error": "Unable to update announcement."}, status=status.HTTP_400_BAD_REQUEST)


class HealthCheckAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok", "service": "task-force-bruno-api"}, status=status.HTTP_200_OK)


class PetAISearchAPIView(APIView):
    """
    Trait-based natural language pet search supporting negation ("not a dog"),
    local Philippine synonyms (aspin/askal/irong -> dog, puspin/iring -> cat),
    stopword filtering, and weighted scoring across species, coat traits, breed,
    and campus landmark zones.
    """
    permission_classes = [IsAuthenticatedUser]
    throttle_scope = "search"

    SYNONYMS = {
        "pup": "dog", "puppy": "dog", "hound": "dog", "aspin": "dog", "askal": "dog",
        "canine": "dog", "aso": "dog", "irong": "dog",
        "kitten": "cat", "kitty": "cat", "puspin": "cat", "feline": "cat",
        "pusa": "cat", "iring": "cat",
    }

    STOPWORDS = {
        "not", "never", "except", "the", "and", "with", "near", "for", "that",
        "this", "has", "have", "was", "are", "but", "from", "very", "just",
        "one", "pet", "animal", "seen", "spotted", "found", "around", "looking",
    }

    COLOR_TRAITS = {
        "orange", "ginger", "black", "white", "brown", "gray", "grey",
        "calico", "tabby", "tricolor", "golden", "spotted", "tan", "cream",
    }

    def post(self, request):
        try:
            raw_query = clean_text(request.data.get("description"), 300).lower()
            if not raw_query:
                return Response({"error": "Please enter a description to search."}, status=status.HTTP_400_BAD_REQUEST)

            all_pets = (
                get_db_client()
                .table("pets")
                .select("pet_id, name, species, breed, about_text, description, primary_image, found_near, current_conditions")
                .execute()
                .data
                or []
            )

            raw_negatives = set(re.findall(r"(?:not|no|never|except)\s+(?:a\s+|an\s+)?(\w+)", raw_query))
            negative_tokens = {self.SYNONYMS.get(neg, neg) for neg in raw_negatives}

            raw_tokens = [t for t in re.split(r"\W+", raw_query) if len(t) > 2]
            query_tokens = []
            seen_tokens = set()
            for token in raw_tokens:
                if token in self.STOPWORDS or token in raw_negatives:
                    continue
                canonical = self.SYNONYMS.get(token, token)
                if canonical in negative_tokens or canonical in seen_tokens:
                    continue
                seen_tokens.add(canonical)
                query_tokens.append(canonical)

            if not query_tokens:
                return Response([], status=status.HTTP_200_OK)

            scored_candidates = []
            for pet in all_pets:
                species_val = str(pet.get("species") or "").lower()
                breed_val = str(pet.get("breed") or "").lower()
                origin_val = str(pet.get("found_near") or "").lower()
                explicit_desc = str(pet.get("description") or "").lower()
                searchable_blob = (
                    f"{pet.get('name') or ''} {species_val} {breed_val} "
                    f"{pet.get('about_text') or ''} {explicit_desc} "
                    f"{origin_val} {pet.get('current_conditions') or ''}"
                ).lower()
                blob_words = set(re.split(r"\W+", searchable_blob))

                if any(
                    neg in species_val or neg in breed_val or neg in blob_words
                    for neg in negative_tokens
                ):
                    continue

                score = 0
                for token in query_tokens:
                    if token == species_val or (len(token) >= 3 and re.search(rf"\b{re.escape(token)}\b", species_val)):
                        score += 20
                    if token in self.COLOR_TRAITS and (token in explicit_desc or token in breed_val or token in blob_words):
                        score += 15
                    if token in explicit_desc:
                        score += 12
                    if token in breed_val:
                        score += 10
                    if token in origin_val:
                        score += 8
                    if token in blob_words:
                        score += 3

                if score > 0:
                    pet_copy = dict(pet)
                    pet_copy["search_affinity_score"] = score
                    scored_candidates.append(pet_copy)

            scored_candidates.sort(key=lambda x: x["search_affinity_score"], reverse=True)
            return Response(scored_candidates[:5], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Pet search failed: %s", exc)
            return Response(
                {"error": "Unable to complete trait search right now."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
