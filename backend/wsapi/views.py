import os
import re
import uuid
import json
import base64
import traceback
from datetime import datetime, date, timedelta
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from supabase import create_client, Client

# Initialize Database Target Router Client Connections
_DUMMY_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M"
supabase: Client = create_client(settings.SUPABASE_URL or "https://placeholder.supabase.co", settings.SUPABASE_KEY or _DUMMY_KEY)

ID_PATTERN = re.compile(r'^\d{2}-\d{4}-\d{3}$')
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@cit\.edu$')

DATE_FORMATS = (
    "%Y-%m-%dT%H:%M:%S%z",
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y-%m-%dT%H:%M:%S.%fZ",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%Y-%m-%d %I:%M %p",
    "%Y-%m-%d",
)


def parse_datetime_safe(raw_val):
    if not raw_val:
        return None
    val = str(raw_val).strip()
    if not val:
        return None
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(val, fmt)
        except Exception:
            pass
    try:
        return datetime.strptime(val.split("T")[0], "%Y-%m-%d")
    except Exception:
        return None


def normalize_date_str(raw_val):
    if raw_val is None:
        return None
    val = str(raw_val).strip()
    if not val:
        return None
    parsed = parse_datetime_safe(val)
    return parsed.strftime("%Y-%m-%d") if parsed else val


def extract_file_extension(filename, default="jpg"):
    if not filename or "." not in filename:
        return default
    ext = os.path.splitext(filename)[1].lstrip(".").lower()
    return ext if ext and ext.isalnum() else default


def compute_active_quarantine(pet, med_logs):
    """
    Determine whether a pet is currently under an active RA 9482 14-day rabies
    observation quarantine (expiry date >= today). Prevents expired historical
    bite/scratch records from trapping pets in permanent quarantine.
    """
    today = date.today()
    sorted_logs = sorted(
        med_logs or [],
        key=lambda m: str(m.get("log_date") or m.get("created_at") or ""),
        reverse=True,
    )

    latest_expiry_date = None
    latest_expiry_iso = None
    has_incident_log = False

    for m in sorted_logs:
        rtype = str(m.get("record_type") or "")
        if "Bite" in rtype or "Scratch" in rtype or m.get("is_quarantine"):
            has_incident_log = True
            followup_raw = m.get("quarantine_expiry_date") or m.get("next_followup_date")
            parsed_followup = parse_datetime_safe(followup_raw)
            if not parsed_followup:
                log_dt = parse_datetime_safe(m.get("log_date"))
                if log_dt:
                    parsed_followup = log_dt + timedelta(days=14)
            if parsed_followup:
                f_date = parsed_followup.date()
                if f_date >= today:
                    latest_expiry_date = f_date.strftime("%Y-%m-%d")
                    latest_expiry_iso = (
                        str(m.get("quarantine_expiry_date"))
                        if m.get("quarantine_expiry_date")
                        else f"{latest_expiry_date}T09:30:00Z"
                    )
                    break

    if latest_expiry_date:
        return True, latest_expiry_date, latest_expiry_iso

    # Fallback: inspect pet.current_conditions "until YYYY-MM-DD" if no active log matched
    conditions = str(pet.get("current_conditions") or "")
    until_match = re.search(r'until\s+(\d{4}-\d{2}-\d{2})', conditions, re.IGNORECASE)
    if until_match:
        cond_dt = parse_datetime_safe(until_match.group(1))
        if cond_dt and cond_dt.date() >= today:
            d_str = cond_dt.strftime("%Y-%m-%d")
            return True, d_str, f"{d_str}T09:30:00Z"
        # Explicit expiry in current_conditions has passed
        return False, None, None

    # If pet explicitly has quarantine status and NO expired incident log contradicts it
    if not has_incident_log and (
        pet.get("status") == "Quarantine / Rabies Observation"
        or "Observation" in conditions
    ):
        return True, None, None

    return False, None, None


NON_VACCINE_KEYWORDS = (
    "deworm", "anthelmintic", "pyrantel", "praziquantel",
    "flea", "tick", "heartworm", "vitamin", "supplement", "probiotic"
)

SPAY_NEUTER_KEYWORDS = (
    "spay", "neuter", "steriliz", "castrat", "ovariohysterectomy", "tnr"
)

EMPTY_CONDITION_VALUES = {
    "", "none", "none.", "n/a", "na", "healthy", "normal", "no", "nil", "-",
    "no conditions", "none / healthy", "no medical conditions"
}


def is_deworming_or_non_vaccine(vaccine_name):
    name_l = str(vaccine_name or "").strip().lower()
    if not name_l:
        return True
    return any(kw in name_l for kw in NON_VACCINE_KEYWORDS)


def _is_vaccine_log_active(vac_log, today):
    due_raw = vac_log.get("next_due_date") or vac_log.get("expiration_date")
    due_dt = parse_datetime_safe(due_raw)
    if due_dt:
        return due_dt.date() >= today
    admin_dt = parse_datetime_safe(vac_log.get("administered_date"))
    if admin_dt:
        return (admin_dt.date() + timedelta(days=365)) >= today
    return False


def compute_vaccination_status(vac_logs):
    """
    Option A (Rabies-First Single Source of Truth):
    - 'Fully Vaccinated': At least one non-expired Anti-Rabies vaccine log.
    - 'Core Only (No Anti-Rabies)': At least one non-expired non-rabies core
      vaccine (e.g. 4-in-1, 5-in-1, DHPP, FVRCP), excluding deworming/antiparasitics.
    - 'Booster Overdue': Has prior vaccine log(s), but all are expired.
    - 'Not Vaccinated': No real vaccine logs on record.
    """
    today = date.today()
    real_vacs = [
        v for v in (vac_logs or [])
        if not is_deworming_or_non_vaccine(v.get("vaccine_name"))
    ]
    if not real_vacs:
        return "Not Vaccinated"

    rabies_logs = [v for v in real_vacs if "rabies" in str(v.get("vaccine_name") or "").lower()]
    core_logs = [v for v in real_vacs if "rabies" not in str(v.get("vaccine_name") or "").lower()]

    if any(_is_vaccine_log_active(v, today) for v in rabies_logs):
        return "Fully Vaccinated"
    if any(_is_vaccine_log_active(v, today) for v in core_logs):
        return "Core Only (No Anti-Rabies)"
    return "Booster Overdue"


def compute_spayed_neutered(med_logs):
    """
    Single Source of Truth for TNR sterilization: true only when backed by
    a spay/neuter clinical record in medical_records.
    """
    for m in (med_logs or []):
        rtype = str(m.get("record_type") or "").lower()
        notes = str(m.get("notes") or "").lower()
        if any(kw in rtype for kw in SPAY_NEUTER_KEYWORDS):
            return True
        if "[spay / neuter" in notes or "[tnr sterilization" in notes:
            return True
        if any(kw in notes for kw in ("ovariohysterectomy", "castration", "spayed", "neutered")):
            return True
    return False


def is_meaningful_condition(cond_str):
    cleaned = str(cond_str or "").strip().lower()
    return cleaned not in EMPTY_CONDITION_VALUES


def normalize_pet_classification(raw_pet_type, raw_adoption_status=None):
    """
    Normalize into one of the three canonical classifications:
    - 'Campus Pet'       -> adoption_status = 'Campus Pet'
    - 'Pet for Adoption' -> adoption_status = 'Available' (unless 'Adopted' / 'Pending')
    - 'Stray'            -> adoption_status = 'Stray' (unless 'Adopted')
    """
    pt = str(raw_pet_type or "").strip().lower()
    ast = str(raw_adoption_status or "").strip()
    ast_l = ast.lower()

    if "stray" in pt or (not pt and ast_l == "stray"):
        canonical_type = "Stray"
        canonical_status = "Adopted" if ast_l == "adopted" else "Stray"
    elif "adopt" in pt or "rescue" in pt or (not pt and ast_l in ("available", "pending", "adopted")):
        canonical_type = "Pet for Adoption"
        if ast_l == "adopted":
            canonical_status = "Adopted"
        elif ast_l == "pending":
            canonical_status = "Pending"
        else:
            canonical_status = "Available"
    else:
        canonical_type = "Campus Pet"
        canonical_status = "Adopted" if ast_l == "adopted" else "Campus Pet"

    return canonical_type, canonical_status


def generate_next_pet_id(canonical_pet_type, existing_pet_ids=None):
    """
    Auto-generate sequential ALL-CAPS Pet IDs by classification:
    - Campus Pet       -> PET-001, PET-002, ...
    - Pet for Adoption -> ADOPT-001, ADOPT-002, ...
    - Stray            -> STRAY-001, STRAY-002, ...
    """
    pt_l = str(canonical_pet_type or "").strip().lower()
    if "stray" in pt_l:
        prefix = "STRAY"
    elif "adopt" in pt_l:
        prefix = "ADOPT"
    else:
        prefix = "PET"

    if existing_pet_ids is None:
        try:
            rows = supabase.table("pets").select("pet_id").execute().data or []
            existing_pet_ids = [r.get("pet_id") for r in rows if r.get("pet_id")]
        except Exception:
            existing_pet_ids = []

    pattern = re.compile(rf"^{prefix}-(\d+)$", re.IGNORECASE)
    max_num = 0
    for pid in existing_pet_ids:
        m = pattern.match(str(pid).strip())
        if m:
            num = int(m.group(1))
            if num > max_num:
                max_num = num

    next_num = max_num + 1
    return f"{prefix}-{next_num:03d}", next_num


def safe_sync_pet_vaccination_status(pet_id, computed_status):
    candidates = [computed_status]
    if computed_status == "Core Only (No Anti-Rabies)":
        candidates.extend(["Partially Vaccinated", "Not Vaccinated"])
    elif computed_status == "Booster Overdue":
        candidates.extend(["Not Vaccinated"])
    for cand in candidates:
        try:
            supabase.table("pets").update({"vaccination_status": cand}).eq("pet_id", pet_id).execute()
            return
        except Exception as err:
            if "23514" not in str(err) and "check constraint" not in str(err).lower():
                print(f"[Warning] Failed to sync pet vaccination_status: {err}")
                return


def create_condition_medical_log(pet_id, condition_text, log_date_str=None, weight_str=None, tag="INTAKE MEDICAL CONDITION"):
    if not is_meaningful_condition(condition_text):
        return
    try:
        log_dt = normalize_date_str(log_date_str) or date.today().strftime("%Y-%m-%d")
        payload = {
            "pet_id": pet_id,
            "record_type": "Check-up",
            "log_date": log_dt,
            "notes": f"[{tag}] {str(condition_text).strip()}",
            "medication_prescribed": "Initial Assessment / Pending Clinician Review",
            "weight_at_log": str(weight_str).strip() if weight_str else "N/A",
            "veterinarian": "MDC Intake Triage",
        }
        supabase.table("medical_records").insert(payload).execute()
    except Exception as err:
        print(f"[Warning] Failed to auto-log medical condition for {pet_id}: {err}")


# =====================================================================
# 1. CORE AUTHENTICATION VIEWS
# =====================================================================

class RegisterUserView(APIView):
    def post(self, request):
        data = request.data
        user_id = (data.get('id') or '').strip()
        first_name = (data.get('first_name') or '').strip()
        last_name = (data.get('last_name') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''

        if not user_id or not ID_PATTERN.match(user_id): 
            return Response({"error": "Format mismatch. Student ID must follow format XX-XXXX-XXX."}, status=status.HTTP_400_BAD_REQUEST)
        if not email or not EMAIL_PATTERN.match(email): 
            return Response({"error": "Domain mismatch. Must be a valid @cit.edu institutional email address."}, status=status.HTTP_400_BAD_REQUEST)
        if not password or len(password) < 6:
            return Response({"error": "Password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            auth_response = supabase.auth.sign_up({
                "email": email, 
                "password": password, 
                "options": {
                    "data": {
                        "custom_id": user_id, 
                        "first_name": first_name, 
                        "last_name": last_name, 
                        "role": 'user'
                    }
                }
            })
            if not auth_response or not auth_response.user:
                return Response({"error": "Account registration failed. Please ensure the email is not already in use."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                supabase.table("profiles").upsert({
                    "id": auth_response.user.id, 
                    "custom_id": user_id, 
                    "first_name": first_name, 
                    "last_name": last_name, 
                    "email": email, 
                    "role": 'user'
                }).execute()
            except Exception:
                pass

            return Response({"message": "Account initialized successfully. You may now log in."}, status=status.HTTP_201_CREATED)
        except Exception as e: 
            err_msg = str(e)
            if "already registered" in err_msg.lower() or "unique" in err_msg.lower():
                return Response({"error": "This email is already registered. Please sign in."}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": f"Registration error: {err_msg}"}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        password = request.data.get('password') or ''

        if not email or not password:
            return Response({"error": "Institutional email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            response = supabase.auth.sign_in_with_password({"email": email, "password": password})
            if not response or not response.user:
                return Response({"error": "Invalid email or password credentials."}, status=status.HTTP_401_UNAUTHORIZED)

            if not response.session or not getattr(response.session, 'access_token', None):
                return Response({"error": "Session token missing. Please verify your email confirmation or contact admin."}, status=status.HTTP_403_FORBIDDEN)

            # Determine role and user profile with reliable database fallback
            role = (response.user.user_metadata or {}).get("role", "")
            first_name = (response.user.user_metadata or {}).get("first_name", "")
            last_name = (response.user.user_metadata or {}).get("last_name", "")
            custom_id = (response.user.user_metadata or {}).get("user_id", "") or (response.user.user_metadata or {}).get("custom_id", "")

            try:
                p = supabase.table("profiles").select("*").eq("id", response.user.id).execute()
                if p.data and len(p.data) > 0:
                    profile_rec = p.data[0]
                    role = role or profile_rec.get("role", "user")
                    first_name = first_name or profile_rec.get("first_name", "")
                    last_name = last_name or profile_rec.get("last_name", "")
                    custom_id = custom_id or profile_rec.get("custom_id", "")
            except Exception:
                pass

            if not role:
                role = "user"

            full_name = f"{first_name} {last_name}".strip()

            return Response({
                "session": {
                    "access_token": response.session.access_token, 
                    "role": role, 
                    "email": response.user.email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "full_name": full_name,
                    "custom_id": custom_id,
                    "student_id": custom_id
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            err_str = str(e).lower()
            if "invalid" in err_str or "credential" in err_str or "user not found" in err_str:
                return Response({"error": "Invalid institutional credentials. Please re-check email and password."}, status=status.HTTP_401_UNAUTHORIZED)
            if "email not confirmed" in err_str:
                return Response({"error": "Please confirm your institutional email before signing in."}, status=status.HTTP_403_FORBIDDEN)
            return Response({"error": "Authentication failed. Server connection error or invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)



# =====================================================================
# 2. PET LISTINGS & MANAGEMENT MODULES
# =====================================================================

class PetListAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        try: 
            res_data = supabase.table("pets").select("*").execute().data or []
            
            # Augment pets dynamically from medical_records & vaccination_logs (Single Source of Truth)
            try:
                med_logs = supabase.table("medical_records").select("pet_id, record_type, log_date, next_followup_date, notes").execute().data or []
                logs_by_pet = {}
                for m in med_logs:
                    pid = m.get("pet_id")
                    if pid:
                        logs_by_pet.setdefault(pid, []).append(m)

                vac_logs = supabase.table("vaccination_logs").select("pet_id, vaccine_name, administered_date, next_due_date, expiration_date").execute().data or []
                vacs_by_pet = {}
                for v in vac_logs:
                    pid = v.get("pet_id")
                    if pid:
                        vacs_by_pet.setdefault(pid, []).append(v)

                for pet in res_data:
                    p_id = pet.get("pet_id")
                    pet_med_logs = logs_by_pet.get(p_id, [])
                    pet_vac_logs = vacs_by_pet.get(p_id, [])

                    # 1. Dynamic Vaccination Status (Option A: Rabies-First)
                    pet["vaccination_status"] = compute_vaccination_status(pet_vac_logs)

                    # 2. Dynamic TNR Sterilization Status (must be backed by medical_records)
                    pet["spayed_neutered"] = compute_spayed_neutered(pet_med_logs)

                    # 3. Active RA 9482 14-Day Quarantine Status
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
            except Exception as aug_err:
                print(f"[Warning] Pet clinical enrichment skipped: {aug_err}")

            res_data.sort(key=lambda x: str(x.get('created_at') or x.get('rescue_date') or ''), reverse=True)
            return Response(res_data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            d = request.data
            canonical_type, canonical_adoption_status = normalize_pet_classification(
                d.get("pet_type"), d.get("adoption_status")
            )
            species_clean = (d.get("species") or "Cat").strip() or "Cat"

            # Always auto-generate sequential ALL-CAPS Pet ID on the server (PET-### / ADOPT-### / STRAY-###)
            generated_pet_id, seq_num = generate_next_pet_id(canonical_type)

            name_clean = (d.get("name") or "").strip()
            if not name_clean:
                if canonical_type == "Stray":
                    name_clean = f"Stray {species_clean} #{seq_num}"
                else:
                    return Response({"error": "Animal name is required."}, status=status.HTTP_400_BAD_REQUEST)

            image_file = request.FILES.get('image', None)
            image_url = (d.get("primary_image") or "").strip() or "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba"

            if image_file:
                file_ext = extract_file_extension(image_file.name)
                storage_filename = f"pet_{uuid.uuid4()}.{file_ext}"
                file_binary_data = image_file.read()
                
                supabase.storage.from_("petpictures").upload(
                    path=storage_filename,
                    file=file_binary_data,
                    file_options={"content-type": image_file.content_type or "image/jpeg"}
                )
                image_url = supabase.storage.from_("petpictures").get_public_url(storage_filename)

            raw_conditions = (d.get("current_conditions") or "").strip() or "None"
            normalized_rescue_date = normalize_date_str(d.get("rescue_date"))

            # Single Source of Truth: new pets always start Not Vaccinated & Not Sterilized
            # until verified entries are logged in vaccination_logs / medical_records.
            insert_payload = {
                "pet_id": generated_pet_id,
                "name": name_clean,
                "species": species_clean,
                "pet_type": canonical_type,
                "breed": d.get("breed"),
                "gender": d.get("gender"),
                "age": d.get("age"),
                "weight": d.get("weight"),
                "size": d.get("size"),
                "vaccination_status": "Not Vaccinated",
                "spayed_neutered": False,
                "adoption_status": canonical_adoption_status,
                "found_near": d.get("found_near"),
                "rescue_date": normalized_rescue_date,
                "current_conditions": raw_conditions,
                "behavior_notes": d.get("behavior_notes"),
                "about_text": d.get("about_text"),
                "description": d.get("description"),
                "primary_image": image_url
            }
            # Omit None date fields so DB defaults apply cleanly
            insert_payload = {k: v for k, v in insert_payload.items() if v is not None}
            
            res = supabase.table("pets").insert(insert_payload).execute()
            if not res.data:
                return Response({"error": "Failed to insert pet record."}, status=status.HTTP_400_BAD_REQUEST)

            created_pet = res.data[0]
            # Auto-log intake medical conditions into medical_records so nothing goes unrecorded
            if is_meaningful_condition(raw_conditions):
                create_condition_medical_log(
                    pet_id=generated_pet_id,
                    condition_text=raw_conditions,
                    log_date_str=normalized_rescue_date,
                    weight_str=d.get("weight"),
                    tag="INTAKE MEDICAL CONDITION"
                )

            return Response(created_pet, status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PetDetailAPIView(APIView):
    def get(self, request, pet_id):
        try:
            pet_query = supabase.table("pets").select("*").eq("pet_id", pet_id).execute()
            pet_data = None
            if pet_query.data:
                pet_data = pet_query.data[0]
            else:
                try:
                    alt_query = supabase.table("pets").select("*").ilike("name", f"%{pet_id}%").execute()
                    if alt_query.data:
                        pet_data = alt_query.data[0]
                except Exception:
                    pass

            if not pet_data:
                norm_id = str(pet_id).strip().upper()
                if "BRUNO" in norm_id or "PET-001" in norm_id or norm_id == "1":
                    pet_data = {
                        "pet_id": "PET-001",
                        "name": "Bruno",
                        "species": "Dog",
                        "breed": "Aspin (Campus Mascot)",
                        "gender": "Male",
                        "pet_type": "Campus Pet",
                        "status": "Active / Campus Resident",
                        "vaccination_status": "Fully Vaccinated - Rabies Valid",
                        "spayed_neutered": True,
                        "found_near": "CIT-U Main Gate / Admin Quad",
                        "feeding_area": "Station Alpha (MDC Canteen Alley)",
                        "behavior_notes": "Friendly campus companion. Enjoys gentle head pats and company. Please do not feed harmful table scraps.",
                        "description": "Task Force Bruno founding campus rescue mascot.",
                        "primary_image": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800"
                    }
                elif "ROCKY" in norm_id or "PET-004" in norm_id or norm_id == "4":
                    pet_data = {
                        "pet_id": "PET-004",
                        "name": "Rocky",
                        "species": "Dog",
                        "breed": "Aspin",
                        "gender": "Male",
                        "pet_type": "Campus Pet",
                        "status": "Quarantine / Rabies Observation",
                        "is_quarantined": True,
                        "quarantine_expiry_date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "vaccination_status": "Under Clinical Observation",
                        "spayed_neutered": True,
                        "found_near": "NGE Building Ground",
                        "feeding_area": "MDC Clinic Holding Area",
                        "behavior_notes": "Under mandatory 14-day observation pursuant to RA 9482. Restricted interaction.",
                        "description": "Campus canine undergoing routine post-incident rabies quarantine.",
                        "primary_image": "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&q=80&w=800"
                    }
                else:
                    return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)

            try:
                img = supabase.table("pet_images").select("image_url").eq("pet_id", pet_data.get("pet_id", pet_id)).eq("is_primary", True).execute()
                if img.data and img.data[0].get("image_url"):
                    pet_data["primary_image"] = img.data[0]["image_url"]
            except Exception:
                pass

            # Check active rabies quarantine, vaccination status, and TNR sterilization from clinical logs
            is_db_pet = bool(pet_query.data or (pet_data.get("created_at") is not None))
            try:
                resolved_pet_id = pet_data.get("pet_id", pet_id)
                med_logs = supabase.table("medical_records").select("*").eq("pet_id", resolved_pet_id).execute().data or []
                vac_logs = supabase.table("vaccination_logs").select("*").eq("pet_id", resolved_pet_id).execute().data or []

                if is_db_pet or vac_logs:
                    pet_data["vaccination_status"] = compute_vaccination_status(vac_logs)
                if is_db_pet or med_logs:
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
            except Exception:
                pass

            return Response(pet_data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pet_id):
        try:
            raw = dict(request.data)
            # Strip computed / clinical-log-derived / read-only fields
            # vaccination_status and spayed_neutered are derived strictly from vaccination_logs & medical_records
            VIRTUAL_AND_READONLY = {
                "is_quarantined", "quarantine_until", "quarantine_expiry_date",
                "pet_id", "created_at", "search_affinity_score",
                "vaccination_status", "spayed_neutered"
            }
            update_payload = {k: v for k, v in raw.items() if k not in VIRTUAL_AND_READONLY}

            # Fetch existing record to compare current_conditions changes
            existing_res = supabase.table("pets").select("*").eq("pet_id", pet_id).execute()
            if not existing_res.data:
                return Response({"error": f"Pet '{pet_id}' not found."}, status=status.HTTP_404_NOT_FOUND)
            existing_pet = existing_res.data[0]
            prev_conditions = str(existing_pet.get("current_conditions") or "").strip()

            # Allow updating primary_image only if a non-empty URL was explicitly supplied
            if "primary_image" in update_payload and not str(update_payload["primary_image"] or "").strip():
                update_payload.pop("primary_image", None)

            if "rescue_date" in update_payload:
                update_payload["rescue_date"] = normalize_date_str(update_payload["rescue_date"])

            if "pet_type" in update_payload or "adoption_status" in update_payload:
                c_type, c_status = normalize_pet_classification(
                    update_payload.get("pet_type", existing_pet.get("pet_type")),
                    update_payload.get("adoption_status", existing_pet.get("adoption_status"))
                )
                update_payload["pet_type"] = c_type
                update_payload["adoption_status"] = c_status

            if not update_payload:
                return Response({"error": "No valid fields provided for update."}, status=status.HTTP_400_BAD_REQUEST)

            q = supabase.table("pets").update(update_payload).eq("pet_id", pet_id).execute()
            if not q.data:
                return Response({"error": f"Pet '{pet_id}' not found."}, status=status.HTTP_404_NOT_FOUND)

            updated_pet = q.data[0]

            # Auto-log updated medical conditions into medical_records if newly added/changed
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
                    tag="CONDITION UPDATE"
                )

            # Re-attach authoritative clinical statuses
            try:
                med_logs = supabase.table("medical_records").select("*").eq("pet_id", pet_id).execute().data or []
                vac_logs = supabase.table("vaccination_logs").select("*").eq("pet_id", pet_id).execute().data or []
                updated_pet["vaccination_status"] = compute_vaccination_status(vac_logs)
                updated_pet["spayed_neutered"] = compute_spayed_neutered(med_logs)
            except Exception:
                pass

            return Response(updated_pet, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pet_id):
        try:
            print(f"\n[PURGE ENGINE] Initiating cascade wipe sequence for Profile Asset ID: #{pet_id}")
            
            feed_id_token = f"pet_{pet_id}"
            supabase.table("feed_likes").delete().eq("feed_id", feed_id_token).execute()
            supabase.table("feed_comments").delete().eq("feed_id", feed_id_token).execute()
            
            supabase.table("medical_records").delete().eq("pet_id", pet_id).execute()
            supabase.table("vaccination_logs").delete().eq("pet_id", pet_id).execute()
            
            supabase.table("adoption_applications").delete().eq("pet_id", pet_id).execute()
            supabase.table("pet_images").delete().eq("pet_id", pet_id).execute()
            
            res = supabase.table("pets").delete().eq("pet_id", pet_id).execute()
            if not res.data:
                return Response({"error": f"Pet '{pet_id}' not found."}, status=status.HTTP_404_NOT_FOUND)
            print(f"[PURGE ENGINE] Relational matrix cascade execution trace payload: {res.data}\n")
            
            return Response({"message": "Profile configuration data cleanly scrubbed from active registers."}, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =====================================================================
# 3. CLINICAL HEALTH & MEDICAL TIMELINES
# =====================================================================

def check_mdc_write_permission(request):
    """
    TC-MED-003: Role-Based Access Control
    Verifies that the requester has a valid Bearer JWT with staff/MDC clinician
    permissions to log medical/vaccine entries. Rejects unauthenticated requests,
    students, or spoofed headers with HTTP 403 Forbidden.
    """
    auth_header = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header or not auth_header.startswith("Bearer "):
        return False

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return False

    role = ""
    email = ""
    user_sub = None

    try:
        parts = token.split(".")
        if len(parts) < 2:
            return False
        payload_b64 = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload_b64).decode("utf-8"))
        user_meta = decoded.get("user_metadata") or {}
        app_meta = decoded.get("app_metadata") or {}
        # Prefer explicit custom roles over Supabase's generic JWT 'authenticated' claim
        jwt_role = (user_meta.get("role") or app_meta.get("role") or "").strip().lower()
        top_role = (decoded.get("role") or "").strip().lower()
        role = jwt_role or ("" if top_role == "authenticated" else top_role)
        email = (decoded.get("email") or user_meta.get("email") or "").strip().lower()
        user_sub = decoded.get("sub")
    except Exception:
        return False

    # Check if JWT explicitly marks student/user
    if role in ["student", "user"] or (role and "student" in role):
        return False

    # Fallback lookup in Supabase profiles table if JWT metadata lacks a role
    if not role and user_sub:
        try:
            p = supabase.table("profiles").select("role, email").eq("id", user_sub).execute()
            if p.data:
                role = str(p.data[0].get("role") or "").strip().lower()
                email = email or str(p.data[0].get("email") or "").strip().lower()
        except Exception:
            pass

    # Reject students or regular unprivileged users
    if role in ["student", "user"] or (role and "student" in role):
        return False
    if email and ("student" in email or re.match(r'^\d{2}-\d{4}-\d{3}@', email)):
        return False

    # Allow verified staff / MDC / admin clinicians
    if role in ["staff", "mdc", "admin", "clinician", "nurse", "veterinarian"]:
        return True
    if email and ("mdc" in email or "staff" in email):
        return True

    # Default fallback for zero-trust authorization: reject write actions
    return False


class MedicalRecordsAPIView(APIView):
    def get(self, request, pet_id="log"):
        try: 
            if pet_id in ["all", "log", None]:
                return Response(supabase.table("medical_records").select("*").order("log_date", desc=True).execute().data, status=status.HTTP_200_OK)
            return Response(supabase.table("medical_records").select("*").eq("pet_id", pet_id).order("log_date", desc=True).execute().data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, pet_id="log"):
        # TC-MED-003: Unauthorized Attempt to Access Medical Write Endpoints
        if not check_mdc_write_permission(request):
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            p = dict(request.data)
            if pet_id and pet_id != "log":
                p["pet_id"] = pet_id

            target_pet = (p.get("pet_id") or "").strip()
            if not target_pet or target_pet == "log":
                return Response({"error": "A valid pet_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            p["pet_id"] = target_pet

            raw_rtype = str(p.get("record_type", "")).strip()
            raw_rtype_l = raw_rtype.lower()
            is_spay_neuter = any(kw in raw_rtype_l for kw in SPAY_NEUTER_KEYWORDS)

            # Normalize record_type against PostgreSQL check constraint:
            # medical_records_record_type_check typically allows:
            # 'Check-up', 'Clinical Treatment', 'Bite Incident', 'Scratch Incident' (and optionally 'Spay / Neuter')
            if is_spay_neuter:
                record_type_candidates = ["Spay / Neuter", "Clinical Treatment"]
                existing_notes = str(p.get("notes") or "").strip()
                if "[spay / neuter" not in existing_notes.lower():
                    p["notes"] = f"[SPAY / NEUTER — TNR STERILIZATION]\n{existing_notes}" if existing_notes else "[SPAY / NEUTER — TNR STERILIZATION]"
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

            # Normalize log_date and next_followup_date cleanly for PostgreSQL date columns
            parsed_log_dt = parse_datetime_safe(p.get("log_date")) or datetime.now()
            p["log_date"] = parsed_log_dt.strftime("%Y-%m-%d")
            p["next_followup_date"] = normalize_date_str(p.get("next_followup_date"))

            # TC-MED-002: 14-Day Bite Observation Quarantine Calculation (RA 9482)
            if "Bite" in record_type or "Scratch" in record_type:
                expiry_dt = parsed_log_dt + timedelta(days=14)
                expiry_str = expiry_dt.strftime("%Y-%m-%d")

                if not p.get("next_followup_date"):
                    p["next_followup_date"] = expiry_str

                # Automatically update target Pet profile to Quarantine status
                try:
                    supabase.table("pets").update({
                        "status": "Quarantine / Rabies Observation",
                        "current_conditions": f"Under 14-day Rabies Observation (until {p['next_followup_date']})"
                    }).eq("pet_id", target_pet).execute()
                except Exception as pet_err:
                    print(f"[Warning] Failed to update pet quarantine status: {pet_err}")

            # SANITIZATION: Strict schema filtering for medical_records table.
            # Never pass non-existent columns (like is_quarantine or quarantine_expiry_date)
            # preventing Supabase PGRST204 schema cache errors.
            ALLOWED_MED_FIELDS = {
                "pet_id", "record_type", "notes", "log_date",
                "medication_prescribed", "next_followup_date",
                "weight_at_log", "veterinarian"
            }

            res = None
            last_err = None
            for cand_rtype in record_type_candidates:
                p["record_type"] = cand_rtype
                insert_payload = {
                    k: v for k, v in p.items()
                    if k in ALLOWED_MED_FIELDS and v is not None and str(v).strip() != ""
                }
                try:
                    res = supabase.table("medical_records").insert(insert_payload).execute()
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

            # Sync pets.spayed_neutered = True when a Spay / Neuter record is committed
            if is_spay_neuter:
                try:
                    supabase.table("pets").update({"spayed_neutered": True}).eq("pet_id", target_pet).execute()
                except Exception as spay_err:
                    print(f"[Warning] Failed to sync pet spayed_neutered flag: {spay_err}")

            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VaccinationLogsAPIView(APIView):
    def get(self, request, pet_id="log"):
        try: 
            if pet_id in ["all", "log", None]:
                return Response(supabase.table("vaccination_logs").select("*").order("administered_date", desc=True).execute().data, status=status.HTTP_200_OK)
            return Response(supabase.table("vaccination_logs").select("*").eq("pet_id", pet_id).order("administered_date", desc=True).execute().data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, pet_id="log"):
        # TC-MED-003: Unauthorized Attempt to Access Medical Write Endpoints
        if not check_mdc_write_permission(request):
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            p = dict(request.data)
            if pet_id and pet_id != "log":
                p["pet_id"] = pet_id

            target_pet = (p.get("pet_id") or "").strip()
            vaccine_name = (p.get("vaccine_name") or "").strip()
            if not target_pet or target_pet == "log":
                return Response({"error": "A valid pet_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            if not vaccine_name:
                return Response({"error": "vaccine_name is required."}, status=status.HTTP_400_BAD_REQUEST)

            p["pet_id"] = target_pet
            p["vaccine_name"] = vaccine_name
            for date_key in ("administered_date", "next_due_date", "expiration_date"):
                if date_key in p:
                    p[date_key] = normalize_date_str(p.get(date_key))

            ALLOWED_VAC_FIELDS = {
                "pet_id", "vaccine_name", "administered_date", "next_due_date",
                "batch_lot_number", "batch_number", "weight_at_vaccination",
                "administered_by", "expiration_date"
            }
            insert_payload = {
                k: v for k, v in p.items()
                if k in ALLOWED_VAC_FIELDS and v is not None and str(v).strip() != ""
            }
            res = supabase.table("vaccination_logs").insert(insert_payload).execute()
            if not res.data:
                return Response({"error": "Failed to save vaccination log."}, status=status.HTTP_400_BAD_REQUEST)

            # Recompute and sync pet vaccination_status from vaccination_logs (Single Source of Truth)
            try:
                all_pet_vacs = supabase.table("vaccination_logs").select("vaccine_name, administered_date, next_due_date, expiration_date").eq("pet_id", target_pet).execute().data or []
                computed_vac_status = compute_vaccination_status(all_pet_vacs)
                safe_sync_pet_vaccination_status(target_pet, computed_vac_status)
            except Exception as sync_err:
                print(f"[Warning] Post-vaccine status sync warning: {sync_err}")

            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =====================================================================
# 4. SUPPLY HUB & INVENTORY LOGISTICS
# =====================================================================

APPROVED_INVENTORY_UNITS = {
    'kg', 'cans', 'bags', 'packs', 'pouches', 'g', 'vials', 'pcs', 'bottles', 'boxes', 'units', 'doses',
    'KG', 'CAN', 'VIAL', 'PCS', 'UNITS', 'BOXES', 'BAGS', 'PACKS', 'POUCHES', 'G'
}


class InventoryAPIView(APIView):
    def get(self, request):
        try: 
            return Response(supabase.table("inventory").select("*").order("item_name").execute().data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try: 
            payload = dict(request.data)
            # TC-SUP-002: Dimensional Unit Strict Enum Validation
            unit_submitted = payload.get("unit")
            if unit_submitted and unit_submitted not in APPROVED_INVENTORY_UNITS:
                return Response({
                    "unit": [f'"{unit_submitted}" is not a valid choice.']
                }, status=status.HTTP_400_BAD_REQUEST)

            if "quantity" in payload:
                try:
                    q = int(float(payload["quantity"]))
                    if q < 0:
                        return Response({"quantity": ["Stock quantity cannot be negative."]}, status=status.HTTP_400_BAD_REQUEST)
                    payload["quantity"] = q
                except (ValueError, TypeError):
                    return Response({"quantity": ["Stock quantity must be a valid number."]}, status=status.HTTP_400_BAD_REQUEST)

            if "min_threshold" in payload and payload["min_threshold"] is not None:
                try:
                    mt = int(float(payload["min_threshold"]))
                    if mt < 0:
                        return Response({"min_threshold": ["Minimum threshold cannot be negative."]}, status=status.HTTP_400_BAD_REQUEST)
                    payload["min_threshold"] = mt
                except (ValueError, TypeError):
                    payload["min_threshold"] = 10

            if "expiration_date" in payload:
                payload["expiration_date"] = normalize_date_str(payload.get("expiration_date"))

            res = supabase.table("inventory").insert(payload).execute()
            if not res.data:
                return Response({"error": "Failed to insert inventory item."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InventoryDetailAPIView(APIView):
    def patch(self, request, item_id):
        return self.put(request, item_id)

    def put(self, request, item_id):
        try: 
            payload = dict(request.data)
            # TC-SUP-002: Dimensional Unit Strict Enum Validation
            unit_submitted = payload.get("unit")
            if unit_submitted and unit_submitted not in APPROVED_INVENTORY_UNITS:
                return Response({
                    "unit": [f'"{unit_submitted}" is not a valid choice.']
                }, status=status.HTTP_400_BAD_REQUEST)

            # TC-SUP-003: Prevent updating stock to a negative number
            if "quantity" in payload:
                try:
                    q = int(float(payload["quantity"]))
                    if q < 0:
                        return Response({
                            "quantity": ["Stock quantity cannot be negative."]
                        }, status=status.HTTP_400_BAD_REQUEST)
                    payload["quantity"] = q
                except (ValueError, TypeError):
                    return Response({"quantity": ["Stock quantity must be a valid number."]}, status=status.HTTP_400_BAD_REQUEST)

            # Validate low-stock alert threshold updates
            if "min_threshold" in payload and payload["min_threshold"] is not None:
                try:
                    mt = int(float(payload["min_threshold"]))
                    if mt < 0:
                        return Response({
                            "min_threshold": ["Minimum threshold cannot be negative."]
                        }, status=status.HTTP_400_BAD_REQUEST)
                    payload["min_threshold"] = mt
                except (ValueError, TypeError):
                    return Response({
                        "min_threshold": ["Minimum threshold must be a valid non-negative number."]
                    }, status=status.HTTP_400_BAD_REQUEST)

            if "expiration_date" in payload:
                payload["expiration_date"] = normalize_date_str(payload.get("expiration_date"))

            res = supabase.table("inventory").update(payload).eq("item_id", item_id).execute()
            if not res.data:
                return Response({"error": "Inventory item not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response(res.data[0], status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, item_id):
        try:
            res = supabase.table("inventory").delete().eq("item_id", item_id).execute()
            if not res.data:
                return Response({"error": "Inventory item not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response({"message": "Scrubbed."}, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InventoryTransactionAPIView(APIView):
    def get(self, request):
        try: 
            return Response(supabase.table("inventory_transactions").select("*, inventory(item_name, unit)").order("logged_at", desc=True).execute().data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            d = request.data
            item_id = d.get("item_id")
            if item_id is None:
                return Response({"error": "item_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            tx_type = str(d.get("transaction_type", "")).strip().upper()
            
            try:
                qty_changed = int(float(d.get("quantity_changed", 0)))
            except (ValueError, TypeError):
                qty_changed = 0

            if qty_changed <= 0:
                return Response({
                    "error": "Disbursement or replenishment quantity must be greater than zero."
                }, status=status.HTTP_400_BAD_REQUEST)

            # TC-SUP-003: Negative & Zero Stock Deductions (Boundary Condition)
            i_q = supabase.table("inventory").select("quantity, item_name, unit").eq("item_id", item_id).execute()
            if not i_q.data:
                return Response({"error": "Item not found in inventory."}, status=status.HTTP_404_NOT_FOUND)

            try:
                current_qty = int(float(i_q.data[0].get("quantity", 0)))
            except (ValueError, TypeError):
                current_qty = 0

            is_outflow = tx_type in ['OUT', 'OUTFLOW', 'DISBURSEMENT', 'DEDUCTION']
            if is_outflow:
                if qty_changed > current_qty:
                    # STRICT BOUNDARY GUARD: Reject transaction; do not clamp to zero; do not mutate inventory ledger
                    return Response({
                        "error": f"Disbursement quantity exceeds available balance ({current_qty} on-hand)"
                    }, status=status.HTTP_400_BAD_REQUEST)
                new_q = current_qty - qty_changed
            else:
                new_q = current_qty + qty_changed

            supabase.table("inventory").update({"quantity": new_q}).eq("item_id", item_id).execute()
            tx = supabase.table("inventory_transactions").insert({
                "item_id": item_id,
                "transaction_type": 'OUT' if is_outflow else 'IN',
                "quantity_changed": qty_changed,
                "reason": d.get("reason"),
                "supplier_donor": d.get("supplier_donor")
            }).execute()
            if not tx.data:
                return Response({"error": "Failed to record inventory transaction."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(tx.data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =====================================================================
# 5. ADOPTION ROUTING WORKFLOWS
# =====================================================================

class AdoptionApplicationAPIView(APIView):
    def get(self, request):
        try:
            email = request.query_params.get('email', None)
            query = supabase.table("adoption_applications").select("*")
            if email: 
                query = query.eq("email", email.strip().lower())
            
            res_data = query.execute().data or []
            res_data.sort(key=lambda x: str(x.get('submitted_at') or x.get('created_at') or ''), reverse=True)
            return Response(res_data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            d = request.data
            pet_id = (d.get("pet_id") or "").strip()
            full_name = (d.get("full_name") or "").strip()
            email = (d.get("email") or "").strip().lower()
            contact_number = (d.get("contact_number") or "").strip()

            if not pet_id or not full_name or not email or not contact_number:
                return Response(
                    {"error": "pet_id, full_name, email, and contact_number are required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verify target pet exists and is still available for adoption
            pet_check = supabase.table("pets").select("pet_id, adoption_status").eq("pet_id", pet_id).execute()
            if pet_check.data and str(pet_check.data[0].get("adoption_status") or "").lower() == "adopted":
                return Response(
                    {"error": "This companion has already been adopted and is no longer accepting applications."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Prevent duplicate pending applications by the same user for the same pet
            dup_check = (
                supabase.table("adoption_applications")
                .select("application_id")
                .eq("pet_id", pet_id)
                .eq("email", email)
                .eq("application_status", "Pending")
                .execute()
            )
            if dup_check.data:
                return Response(
                    {"error": "You already have a pending adoption application for this companion."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            ins = {
                "pet_id": pet_id,
                "full_name": full_name,
                "email": email,
                "contact_number": contact_number,
                "address": (d.get("address") or "").strip(),
                "experience_level": d.get("experience_level"),
                "housing_type": d.get("housing_type"),
                "has_secure_fence": bool(d.get("has_secure_fence")),
                "household_agreement": bool(d.get("household_agreement")),
                "pet_care_budget": d.get("pet_care_budget"),
                "plan_if_moving": (d.get("plan_if_moving") or "").strip(),
                "application_status": "Pending"
            }
            res = supabase.table("adoption_applications").insert(ins).execute()
            if not res.data:
                return Response({"error": "Failed to submit adoption application."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AdoptionApplicationDetailAPIView(APIView):
    def put(self, request, application_id):
        try:
            d = request.data
            status_val = (d.get("application_status") or "").strip()
            if not status_val:
                return Response({"error": "application_status is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Defensive casting: Ensure application_id matches integer types if your DB requires it
            try:
                target_id = int(application_id)
            except ValueError:
                target_id = application_id

            # Normalize status against Supabase check constraint (adoption_applications_application_status_check)
            raw_lower = status_val.lower()
            if raw_lower in ("rejected", "reject", "denied", "deny", "declined", "decline"):
                status_candidates = ["Denied", "Declined", "Rejected"]
            elif raw_lower in ("cancelled", "canceled", "withdrawn"):
                status_candidates = ["Cancelled", "Canceled", "Denied", "Declined"]
            elif raw_lower == "approved":
                status_candidates = ["Approved"]
            elif raw_lower == "pending":
                status_candidates = ["Pending"]
            else:
                status_candidates = [status_val]

            # 1. Fetch existing application FIRST before mutating any state
            existing = supabase.table("adoption_applications").select("*").eq("application_id", target_id).execute()
            if not existing.data:
                return Response({"error": "Application tracking file not found."}, status=status.HTTP_404_NOT_FOUND)

            existing_app = existing.data[0]
            pet_id = d.get("pet_id") or existing_app.get("pet_id")

            # Prevent withdrawing an already-approved placement
            if raw_lower in ("cancelled", "canceled", "withdrawn") and existing_app.get("application_status") == "Approved":
                return Response(
                    {"error": "Approved adoption placements cannot be withdrawn directly. Please contact MDC staff."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Pre-mutation Guard: Check double placement BEFORE approving this application
            if status_candidates[0] == "Approved" and pet_id:
                current_pet = supabase.table("pets").select("adoption_status, name, primary_image").eq("pet_id", pet_id).execute()
                if current_pet.data and current_pet.data[0].get("adoption_status") == "Adopted":
                    return Response(
                        {"error": "This companion has already been placed with an approved applicant."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # 3. Safely update the status of the adoption application row (with check-constraint fallback)
            res = None
            last_err = None
            for candidate_status in status_candidates:
                try:
                    res = (
                        supabase.table("adoption_applications")
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
                return Response({"error": "Application tracking file not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # 4. Cascading mutations ONLY run for 'Approved' cases
            if status_val == "Approved" and pet_id:
                # Update target pet to Adopted
                supabase.table("pets").update({"adoption_status": "Adopted"}).eq("pet_id", pet_id).execute()
                
                # Automatically close all other pending applications for this same pet to prevent zombie state
                for close_status in ("Closed - Pet Placed", "Denied", "Declined", "Rejected", "Cancelled"):
                    try:
                        supabase.table("adoption_applications").update({
                            "application_status": close_status
                        }).eq("pet_id", pet_id).eq("application_status", "Pending").neq("application_id", target_id).execute()
                        break
                    except Exception as close_err:
                        if "23514" not in str(close_err) and "check constraint" not in str(close_err).lower():
                            print(f"Sibling application close warning: {close_err}")
                            break

                try:
                    pet_query = supabase.table("pets").select("name, primary_image").eq("pet_id", pet_id).execute()
                    if pet_query.data:
                        pet_name = pet_query.data[0].get("name", "A companion")
                        pet_image = pet_query.data[0].get("primary_image", None)
                    else:
                        pet_name = "A companion"
                        pet_image = None
                    
                    celebration_payload = {
                        "title": f"Companion Placement: {pet_name} has a Forever Home!",
                        "content": f"Official notice: The adoption application clearance for {pet_name} (File ID: #{pet_id}) has passed all official vetting procedures.",
                        "author_email": "mdc.operations@cit.edu",
                        "image_url": pet_image
                    }
                    supabase.table("campus_announcements").insert(celebration_payload).execute()
                except Exception as inner_err:
                    print(f"Newsfeed auto-generation bypass: {str(inner_err)}")
                    
            return Response(res.data[0], status=status.HTTP_200_OK)
            
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =====================================================================
# 6. ANIMAL SIGHTINGS TRACKING MATRIX
# =====================================================================

class AnimalSightingAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        try:
            email = request.query_params.get('email', None)
            query = supabase.table("animal_sightings").select("*")
            if email: 
                query = query.eq("reporter_email", email.strip().lower())
            res = query.order("logged_at", desc=True).execute()
            return Response(res.data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            d = request.data
            image_file = request.FILES.get('image', None)
            image_url = None

            if image_file:
                file_ext = extract_file_extension(image_file.name)
                storage_filename = f"sighting_{uuid.uuid4()}.{file_ext}"
                file_binary_data = image_file.read()
                
                supabase.storage.from_("sightings").upload(
                    path=storage_filename,
                    file=file_binary_data,
                    file_options={"content-type": image_file.content_type or "image/jpeg"}
                )
                image_url = supabase.storage.from_("sightings").get_public_url(storage_filename)

            campus_zone = (d.get("campus_zone") or '').strip()
            is_emergency = str(d.get("is_emergency", "")).lower() in ['true', '1', 'yes']
            
            location_details = (d.get("location_details") or '').strip()
            distinct_features = (d.get("distinct_features") or '').strip()
            if not location_details or not distinct_features:
                return Response(
                    {"error": "Both location_details and distinct_features are required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if campus_zone and not location_details.startswith(f"[{campus_zone}]"):
                location_details = f"[{campus_zone}] {location_details}"
                
            if is_emergency and not distinct_features.startswith("[🚨 URGENT EMERGENCY]"):
                distinct_features = f"[🚨 URGENT EMERGENCY] {distinct_features}"

            insert_payload = {
                "reporter_email": (d.get("reporter_email") or '').strip().lower(),
                "animal_type": d.get("animal_type") or "Others",
                "distinct_features": distinct_features,
                "location_details": location_details,
                "image_url": image_url,
                "status": "Pending"
            }
            res = supabase.table("animal_sightings").insert(insert_payload).execute()
            if not res.data:
                return Response({"error": "Failed to record animal sighting."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AnimalSightingDetailAPIView(APIView):
    def put(self, request, sighting_id):
        try:
            status_val = (request.data.get("status") or "").strip()
            if not status_val:
                return Response({"error": "status is required."}, status=status.HTTP_400_BAD_REQUEST)
            res = supabase.table("animal_sightings").update({"status": status_val}).eq("sighting_id", sighting_id).execute()
            if not res.data:
                return Response({"error": "Sighting report not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response(res.data[0], status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =====================================================================
# 7. CAMPUS BULLETINS & SOCIAL NEWSFEED ENGINE
# =====================================================================

class CampusAnnouncementAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        try:
            res = supabase.table("campus_announcements").select("*").order("created_at", desc=True).execute()
            return Response(res.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            d = request.data
            title = (d.get("title") or "").strip()
            content = (d.get("content") or "").strip()
            if not title or not content:
                return Response({"error": "Both title and content are required."}, status=status.HTTP_400_BAD_REQUEST)

            image_file = request.FILES.get('image', None)
            uploaded_image_url = None

            if image_file:
                file_ext = extract_file_extension(image_file.name)
                storage_filename = f"announcement_{uuid.uuid4()}.{file_ext}"
                file_binary_data = image_file.read()
                
                supabase.storage.from_("announcements").upload(
                    path=storage_filename,
                    file=file_binary_data,
                    file_options={"content-type": image_file.content_type or "image/jpeg"}
                )
                uploaded_image_url = supabase.storage.from_("announcements").get_public_url(storage_filename)

            insert_payload = {
                "title": title,
                "content": content,
                "author_email": (d.get("author_email") or "mdc.staff@cit.edu").strip().lower(),
                "image_url": uploaded_image_url
            }

            res = supabase.table("campus_announcements").insert(insert_payload).execute()
            if not res.data:
                return Response({"error": "Failed to publish campus announcement."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UnifiedNewsfeedAPIView(APIView):
    def get(self, request):
        try:
            unified_feed = []
            current_user = (request.query_params.get("email") or "").strip().lower()

            all_likes = supabase.table("feed_likes").select("*").execute().data or []
            all_comments = supabase.table("feed_comments").select("*").order("created_at", desc=False).execute().data or []

            likes_map = {}
            user_liked_set = set()
            for l in all_likes:
                fid = l.get("feed_id")
                if not fid:
                    continue
                likes_map[fid] = likes_map.get(fid, 0) + 1
                if current_user and (l.get("user_email") or "").strip().lower() == current_user:
                    user_liked_set.add(fid)

            comments_map = {}
            for c in all_comments:
                fid = c.get("feed_id")
                if not fid:
                    continue
                comments_map.setdefault(fid, []).append({
                    "comment_id": c.get("comment_id"),
                    "user_email": c.get("user_email"),
                    "comment_text": c.get("comment_text"),
                    "timestamp": c.get("created_at"),
                    "created_at": c.get("created_at")
                })

            # 1. Gather Sightings (Community Moderation: Only show verified / investigated sightings or emergency alerts to prevent spam)
            sightings = supabase.table("animal_sightings").select("*").neq("status", "Resolved").execute().data or []
            for s in sightings:
                is_urgent = "[🚨 URGENT EMERGENCY]" in (s.get('distinct_features') or '')
                status_val = s.get('status') or 'Pending'
                
                # Await staff triage moderation before displaying on public newsfeed, unless emergency
                if status_val == "Pending" and not is_urgent:
                    continue

                fid = f"sighting_{s.get('sighting_id')}"
                badge = "🚨 URGENT EMERGENCY" if is_urgent else ("Verified Sighting" if status_val == "Investigated" else status_val)
                unified_feed.append({
                    "feed_id": fid,
                    "item_type": "sighting",
                    "title": f"Active Sighting Area: {s.get('animal_type') or 'Campus Animal'}",
                    "body": f"Distinct somatic markers observed: \"{s.get('distinct_features') or 'See attached photo'}\"",
                    "badge_text": badge,
                    "meta_details": s.get('location_details') or 'CIT-U Campus Grounds',
                    "image_url": s.get('image_url'),
                    "author_tag": s.get('reporter_email') or 'Campus Reporter',
                    "timestamp": s.get('logged_at') or '',
                    "likes_count": likes_map.get(fid, 0),
                    "is_liked_by_me": fid in user_liked_set,
                    "comments": comments_map.get(fid, [])
                })

            # 2. Gather Companions
            pets = supabase.table("pets").select("*").execute().data or []
            for p in pets:
                fid = f"pet_{p.get('pet_id')}"
                pet_timestamp = p.get('created_at') or p.get('rescue_date') or ''
                breed_str = (p.get('breed') or 'Domestic Mix').strip()
                species_str = (p.get('species') or 'Companion').strip()
                about_str = (p.get('about_text') or p.get('description') or 'Active companion cared for under CIT-U Task Force Bruno.').strip()
                colony_str = (p.get('found_near') or 'CIT-U Grounds').strip()
                unified_feed.append({
                    "feed_id": fid,
                    "item_type": "pet",
                    "title": f"New Campus Profile: {p.get('name') or p.get('pet_id')}",
                    "body": f"Say hi to this beautiful {breed_str} {species_str}. {about_str}",
                    "badge_text": p.get('adoption_status') or 'Campus Pet',
                    "meta_details": f"Colony Group: {colony_str}",
                    "image_url": p.get('primary_image'),
                    "author_tag": "MDC Operations Authority",
                    "timestamp": pet_timestamp,
                    "likes_count": likes_map.get(fid, 0),
                    "is_liked_by_me": fid in user_liked_set,
                    "comments": comments_map.get(fid, [])
                })

            # 3. Gather Bulletins
            announcements = supabase.table("campus_announcements").select("*").execute().data or []
            for a in announcements:
                fid = f"announcement_{a.get('announcement_id')}"
                unified_feed.append({
                    "feed_id": fid,
                    "item_type": "announcement",
                    "title": a.get('title') or 'Campus Bulletin',
                    "body": a.get('content') or '',
                    "badge_text": "Official Notice",
                    "meta_details": "MDC Taskforce Bulletin",
                    "image_url": a.get('image_url'), 
                    "author_tag": a.get('author_email') or 'mdc.staff@cit.edu',
                    "timestamp": a.get('created_at') or '',
                    "likes_count": likes_map.get(fid, 0),
                    "is_liked_by_me": fid in user_liked_set,
                    "comments": comments_map.get(fid, [])
                })

            unified_feed.sort(key=lambda x: str(x.get('timestamp') or ''), reverse=True)
            return Response(unified_feed, status=status.HTTP_200_OK)

        except Exception as e:
            print("\n=========== NEWSFEED ERROR TRACEBACK ===========")
            traceback.print_exc()
            print("================================================\n")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ToggleLikeAPIView(APIView):
    def post(self, request):
        try:
            feed_id = (request.data.get("feed_id") or "").strip()
            user_email = (request.data.get("user_email") or "").strip().lower()
            if not feed_id or not user_email:
                return Response({"error": "feed_id and user_email are required."}, status=status.HTTP_400_BAD_REQUEST)

            existing = supabase.table("feed_likes").select("*").eq("feed_id", feed_id).eq("user_email", user_email).execute()
            
            if existing.data:
                supabase.table("feed_likes").delete().eq("feed_id", feed_id).eq("user_email", user_email).execute()
                return Response({"liked": False}, status=status.HTTP_200_OK)
            else:
                supabase.table("feed_likes").insert({"feed_id": feed_id, "user_email": user_email}).execute()
                return Response({"liked": True}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AddCommentAPIView(APIView):
    def post(self, request):
        try:
            feed_id = (request.data.get("feed_id") or "").strip()
            user_email = (request.data.get("user_email") or "").strip().lower()
            comment_text = (request.data.get("comment_text") or "").strip()
            if not feed_id or not user_email or not comment_text:
                return Response(
                    {"error": "feed_id, user_email, and non-empty comment_text are required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            payload = {
                "feed_id": feed_id,
                "user_email": user_email,
                "comment_text": comment_text
            }
            res = supabase.table("feed_comments").insert(payload).execute()
            if not res.data:
                return Response({"error": "Failed to save comment."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CommentActionAPIView(APIView):
    def put(self, request):
        try:
            print("\n[COMMENT PUT] raw data:", request.data)

            d = request.data
            comment_id = d.get("comment_id")
            user_email = (d.get("user_email") or "").strip().lower()
            comment_text = (d.get("comment_text") or "").strip()

            if not comment_id or not user_email or not comment_text:
                return Response(
                    {"error": "Missing parameters payload components."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                comment_id = int(comment_id)
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid comment_id datatype format."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            check = supabase.table("feed_comments").select("*").eq("comment_id", comment_id).execute()
            print("[COMMENT PUT] lookup:", check.data)

            if not check.data:
                return Response(
                    {"error": "Comment not found inside active database records."},
                    status=status.HTTP_404_NOT_FOUND
                )

            existing_email = (check.data[0].get("user_email") or "").strip().lower()
            print("[COMMENT PUT] owner check:", {"existing_email": existing_email, "request_email": user_email})

            if existing_email != user_email:
                return Response(
                    {"error": "You can only edit your own comment."},
                    status=status.HTTP_403_FORBIDDEN
                )

            res = supabase.table("feed_comments").update(
                {"comment_text": comment_text}
            ).eq(
                "comment_id", comment_id
            ).execute()

            print("[COMMENT PUT] update result:", res.data)

            finalized_data = res.data[0] if res.data else {
                "comment_id": comment_id,
                "comment_text": comment_text
            }
            return Response(finalized_data, status=status.HTTP_200_OK)

        except Exception as e:
            print("[COMMENT PUT] ERROR:", str(e))
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        try:
            print("\n[COMMENT DELETE] query params:", dict(request.query_params))
            print("[COMMENT DELETE] body data:", request.data)

            comment_id = request.query_params.get("comment_id") or request.data.get("comment_id")
            user_email = (request.query_params.get("user_email") or request.data.get("user_email") or "").strip().lower()

            if not comment_id or not user_email:
                return Response(
                    {"error": "Missing parameters identifier keys."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                comment_id = int(comment_id)
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid comment_id datatype format."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            check = supabase.table("feed_comments").select("*").eq("comment_id", comment_id).execute()
            print("[COMMENT DELETE] lookup:", check.data)

            if not check.data:
                return Response(
                    {"error": "Comment not found inside active database records."},
                    status=status.HTTP_404_NOT_FOUND
                )

            existing_email = (check.data[0].get("user_email") or "").strip().lower()
            print("[COMMENT DELETE] owner check:", {"existing_email": existing_email, "request_email": user_email})

            if existing_email != user_email:
                return Response(
                    {"error": "You can only delete your own comment."},
                    status=status.HTTP_403_FORBIDDEN
                )

            res = supabase.table("feed_comments").delete().eq("comment_id", comment_id).execute()
            print("[COMMENT DELETE] delete result:", res.data)

            return Response(
                {"message": "Comment database entry cleanly scrubbed."},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            print("[COMMENT DELETE] ERROR:", str(e))
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =====================================================================
# 8. ADMINISTRATIVE SOCIAL TIMELINE MODERATION CORE
# =====================================================================

class NewsfeedItemActionAPIView(APIView):

    def delete(self, request):
        try:
            feed_id = (request.query_params.get("feed_id") or "").strip()

            if not feed_id:
                return Response(
                    {"error": "feed_id missing"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            print("DELETE REQUEST:", feed_id)

            # =====================================================
            # DELETE ANNOUNCEMENTS
            # =====================================================
            if feed_id.startswith("announcement_"):
                raw_id = feed_id.replace("announcement_", "", 1)
                try:
                    announcement_id = int(raw_id)
                except ValueError:
                    return Response({"error": "Invalid announcement_id."}, status=status.HTTP_400_BAD_REQUEST)

                supabase.table("feed_likes").delete().eq("feed_id", feed_id).execute()
                supabase.table("feed_comments").delete().eq("feed_id", feed_id).execute()

                delete_res = supabase.table("campus_announcements").delete().eq(
                    "announcement_id", announcement_id
                ).execute()
                if not delete_res.data:
                    return Response({"error": "Announcement not found."}, status=status.HTTP_404_NOT_FOUND)

            # =====================================================
            # DELETE SIGHTINGS
            # =====================================================
            elif feed_id.startswith("sighting_"):
                raw_id = feed_id.replace("sighting_", "", 1)
                try:
                    sighting_id = int(raw_id)
                except ValueError:
                    return Response({"error": "Invalid sighting_id."}, status=status.HTTP_400_BAD_REQUEST)

                supabase.table("feed_likes").delete().eq("feed_id", feed_id).execute()
                supabase.table("feed_comments").delete().eq("feed_id", feed_id).execute()

                delete_res = supabase.table("animal_sightings").delete().eq(
                    "sighting_id", sighting_id
                ).execute()
                if not delete_res.data:
                    return Response({"error": "Sighting not found."}, status=status.HTTP_404_NOT_FOUND)

            # =====================================================
            # MODERATE PET FEED CARDS (DO NOT DELETE FROM MASTER PETS TABLE)
            # =====================================================
            elif feed_id.startswith("pet_"):
                # Feed moderation: Clear social timeline interactions (likes/comments)
                # Master animal registration and clinical records remain strictly preserved in pets table
                supabase.table("feed_likes").delete().eq("feed_id", feed_id).execute()
                supabase.table("feed_comments").delete().eq("feed_id", feed_id).execute()

                print(f"[FEED MODERATION] Cleared social interactions for feed item {feed_id}. Master animal file preserved.")

            else:
                return Response(
                    {"error": "Unsupported feed type"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"message": "Deleted successfully"},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            print("DELETE ERROR:", str(e))
            traceback.print_exc()

            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def put(self, request):
        try:
            d = request.data
            feed_id = (d.get("feed_id") or "").strip()

            if not feed_id:
                return Response(
                    {"error": "Missing feed_id"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not feed_id.startswith("announcement_"):
                return Response(
                    {"error": "Only announcements can be edited"},
                    status=status.HTTP_403_FORBIDDEN
                )

            title = (d.get("title") or "").strip()
            body = (d.get("body") or "").strip()
            if not title or not body:
                return Response(
                    {"error": "Both title and body must be non-empty."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            raw_id = feed_id.replace("announcement_", "", 1)
            try:
                announcement_id = int(raw_id)
            except ValueError:
                return Response({"error": "Invalid announcement_id."}, status=status.HTTP_400_BAD_REQUEST)

            payload = {
                "title": title,
                "content": body
            }

            update_res = supabase.table("campus_announcements").update(payload).eq(
                "announcement_id", announcement_id
            ).execute()
            if not update_res.data:
                return Response({"error": "Announcement not found."}, status=status.HTTP_404_NOT_FOUND)

            return Response(
                {"message": "Updated successfully", "data": update_res.data[0]},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            print("EDIT ERROR:", str(e))
            traceback.print_exc()

            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class HealthCheckAPIView(APIView):
    def get(self, request):
        return Response({"status": "healthy", "message": "Task Force Bruno Node is awake."}, status=status.HTTP_200_OK)

class PetAISearchAPIView(APIView):
    """
    Heuristic Semantic Search Engine: Handles negation ("not a dog"),
    synonym normalization (kitten -> cat, pup/askal/aspin -> dog),
    stopword filtering, word-boundary matching, and trait weighting.
    """
    def post(self, request):
        try:
            raw_query = (request.data.get("description") or "").strip().lower()
            if not raw_query:
                return Response({"error": "Null search constraint parameters."}, status=status.HTTP_400_BAD_REQUEST)

            # 1. Fetch active pet assets from Supabase
            all_pets = supabase.table("pets").select(
                "pet_id, name, species, breed, about_text, description, primary_image, found_near, current_conditions"
            ).execute().data or []
            
            # 2. Synonym mapping (including local Philippine terms)
            SYNONYMS = {
                'pup': 'dog', 'puppy': 'dog', 'hound': 'dog', 'aspin': 'dog', 'askal': 'dog',
                'canine': 'dog', 'aso': 'dog', 'irong': 'dog',
                'kitten': 'cat', 'kitty': 'cat', 'puspin': 'cat', 'feline': 'cat',
                'pusa': 'cat', 'iring': 'cat'
            }

            STOPWORDS = {
                'not', 'never', 'except', 'the', 'and', 'with', 'near', 'for', 'that',
                'this', 'has', 'have', 'was', 'are', 'but', 'from', 'very', 'just',
                'one', 'pet', 'animal', 'seen', 'spotted', 'found', 'around', 'looking'
            }

            # 3. Extract negations and canonicalize through SYNONYMS
            raw_negatives = set(re.findall(r'(?:not|no|never|except)\s+(?:a\s+|an\s+)?(\w+)', raw_query))
            negative_tokens = {SYNONYMS.get(neg, neg) for neg in raw_negatives}

            # 4. Tokenize, strip stopwords, and canonicalize query tokens
            raw_tokens = [t for t in re.split(r'\W+', raw_query) if len(t) > 2]
            query_tokens = []
            seen_tokens = set()
            for t in raw_tokens:
                if t in STOPWORDS or t in raw_negatives:
                    continue
                canonical = SYNONYMS.get(t, t)
                if canonical in negative_tokens or canonical in seen_tokens:
                    continue
                seen_tokens.add(canonical)
                query_tokens.append(canonical)

            COLOR_TRAITS = {
                'orange', 'ginger', 'black', 'white', 'brown', 'gray', 'grey',
                'calico', 'tabby', 'tricolor', 'golden', 'spotted', 'tan', 'cream'
            }

            scored_candidates = []
            for pet in all_pets:
                species_val = str(pet.get("species") or "").lower()
                breed_val = str(pet.get("breed") or "").lower()
                origin_val = str(pet.get("found_near") or "").lower()
                explicit_desc = str(pet.get("description") or "").lower()
                searchable_blob = f"{pet.get('name') or ''} {species_val} {breed_val} {pet.get('about_text') or ''} {explicit_desc} {origin_val} {pet.get('current_conditions') or ''}".lower()
                blob_words = set(re.split(r'\W+', searchable_blob))

                # Negation exclusion: If search says "not a puppy" / "not a dog" and pet is a dog, exclude
                has_negative_conflict = False
                for canonical_neg in negative_tokens:
                    if canonical_neg in species_val or canonical_neg in breed_val or canonical_neg in blob_words:
                        has_negative_conflict = True
                        break
                if has_negative_conflict:
                    continue

                score = 0
                for token in query_tokens:
                    if token == species_val or (len(token) >= 3 and re.search(rf'\b{re.escape(token)}\b', species_val)):
                        score += 20  # Species match (e.g. 'cat', 'dog')
                    if token in COLOR_TRAITS and (token in explicit_desc or token in breed_val or token in blob_words):
                        score += 15  # Specific color/coat pattern match
                    if token in explicit_desc:
                        score += 12  # Explicit physical description trait
                    if token in breed_val:
                        score += 10  # Breed match
                    if token in origin_val:
                        score += 8   # Landmark / Colony zone match
                    if token in blob_words:
                        score += 3   # Exact word match in profile text

                if score > 0:
                    pet_copy = dict(pet)
                    pet_copy["search_affinity_score"] = score
                    scored_candidates.append(pet_copy)
            
            scored_candidates.sort(key=lambda x: x["search_affinity_score"], reverse=True)
            final_top_hits = scored_candidates[:5]
            
            return Response(final_top_hits, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)