import json
import logging
import re
import urllib.error
import urllib.request
from datetime import datetime, timedelta

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .clinical import (
    SPAY_NEUTER_KEYWORDS,
    compute_active_quarantine,
    compute_spayed_neutered,
    compute_vaccination_status,
    safe_sync_pet_vaccination_status,
    validate_species_vaccine_compatibility,
)
from .permissions import IsMDCStaff
from .supabase_client import create_auth_client, get_db_client
from .validators import EMAIL_PATTERN, clean_text, normalize_date_str, parse_datetime_safe

logger = logging.getLogger(__name__)


def _is_urgent_sighting(row: dict) -> bool:
    if row.get("is_emergency"):
        return True
    features = str(row.get("distinct_features") or "")
    return "[URGENT EMERGENCY]" in features or "[🚨 URGENT EMERGENCY]" in features


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        refresh_token = clean_text(request.data.get("refresh_token"), 2000)
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            auth_client = create_auth_client()
            response = auth_client.auth.refresh_session(refresh_token)
            supa_session = getattr(response, "session", None)
            supa_user = getattr(response, "user", None) or getattr(supa_session, "user", None)
            new_access_token = getattr(supa_session, "access_token", None)
            new_refresh_token = getattr(supa_session, "refresh_token", None) or refresh_token

            if not new_access_token or not supa_user:
                return Response(
                    {"error": "Session could not be refreshed. Please sign in again."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            profile_rec = {}
            try:
                p = (
                    get_db_client()
                    .table("profiles")
                    .select("*")
                    .eq("id", supa_user.id)
                    .execute()
                )
                if p.data:
                    profile_rec = p.data[0] or {}
            except Exception as exc:
                logger.warning("Profile lookup during token refresh failed: %s", exc)

            from .views import _build_session_payload

            session_payload = _build_session_payload(
                new_access_token,
                supa_user,
                profile_rec,
                refresh_token=new_refresh_token,
            )
            return Response({"session": session_payload}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.info("Token refresh failed: %s", exc)
            return Response(
                {"error": "Your session has expired. Please sign in again."},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        email = clean_text(request.data.get("email"), 150).lower()
        if not email or not EMAIL_PATTERN.match(email):
            return Response(
                {"error": "Please enter a valid CIT-U email address ending in @cit.edu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        frontend_origin = (
            getattr(settings, "FRONTEND_VERCEL_URL", "")
            or next(
                (o for o in getattr(settings, "CORS_ALLOWED_ORIGINS", []) if o.startswith("https://")),
                "https://taskforcebruno.vercel.app",
            )
        ).rstrip("/")
        redirect_to = f"{frontend_origin}/reset-password"

        try:
            auth_client = create_auth_client()
            auth_client.auth.reset_password_for_email(email, {"redirect_to": redirect_to})
        except Exception as exc:
            # Never disclose whether an account exists; log internally and return generic success.
            logger.info("Password reset request error for %s: %s", email, exc)

        return Response(
            {
                "message": (
                    "If an account exists for that @cit.edu address, a password reset link "
                    "has been sent to your inbox."
                )
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        access_token = clean_text(request.data.get("access_token"), 4000)
        new_password = str(request.data.get("password") or "")

        if not access_token or access_token.count(".") != 2:
            return Response(
                {"error": "Invalid or missing password reset token. Please request a new reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8 or not re.search(r"[A-Za-z]", new_password) or not re.search(r"\d", new_password):
            return Response(
                {"error": "New password must be at least 8 characters and include both letters and numbers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        supabase_url = (settings.SUPABASE_URL or "").rstrip("/")
        api_key = settings.SUPABASE_ANON_KEY or settings.SUPABASE_KEY
        if not supabase_url or not api_key:
            return Response(
                {"error": "Password reset service is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        req_body = json.dumps({"password": new_password}).encode("utf-8")
        req = urllib.request.Request(
            f"{supabase_url}/auth/v1/user",
            data=req_body,
            method="PUT",
            headers={
                "Content-Type": "application/json",
                "apikey": api_key,
                "Authorization": f"Bearer {access_token}",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if 200 <= resp.status < 300:
                    return Response(
                        {"message": "Your password has been updated. You can now sign in with your new password."},
                        status=status.HTTP_200_OK,
                    )
        except urllib.error.HTTPError as http_err:
            logger.info("Password reset rejected by GoTrue (%s)", http_err.code)
            return Response(
                {"error": "This password reset link is invalid or has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.warning("Password reset failed: %s", exc)
            return Response(
                {"error": "Unable to reset password right now. Please try again shortly."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {"error": "Unable to update password. Please request a fresh reset link."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class StaffSummaryAPIView(APIView):
    """
    Aggregated MDC Staff operational counters for sidebar notification badges,
    executive KPI cards, and RA 9482 compliance readiness.
    """
    permission_classes = [IsMDCStaff]

    def get(self, request):
        try:
            db = get_db_client()
            pets = db.table("pets").select("*").execute().data or []
            med_logs = db.table("medical_records").select("*").execute().data or []
            vac_logs = db.table("vaccination_logs").select("*").execute().data or []
            adoptions = db.table("adoption_applications").select("application_id, application_status").execute().data or []
            sightings = db.table("animal_sightings").select("*").execute().data or []
            inventory = db.table("inventory").select("item_id, quantity, min_threshold").execute().data or []

            try:
                volunteers = (
                    db.table("volunteer_applications")
                    .select("application_id, status")
                    .execute()
                    .data
                    or []
                )
            except Exception:
                volunteers = []

            logs_by_pet = {}
            for m in med_logs:
                pid = m.get("pet_id")
                if pid:
                    logs_by_pet.setdefault(pid, []).append(m)

            vacs_by_pet = {}
            for v in vac_logs:
                pid = v.get("pet_id")
                if pid:
                    vacs_by_pet.setdefault(pid, []).append(v)

            active_pets = [p for p in pets if not p.get("archived_at")]
            archived_pets = len(pets) - len(active_pets)

            fully_vaccinated = 0
            overdue_vaccines = 0
            tnr_certified = 0
            active_quarantines = 0
            adopted_pets = 0
            adoptable_pets = 0

            for pet in active_pets:
                pid = pet.get("pet_id")
                p_med = logs_by_pet.get(pid, [])
                p_vac = vacs_by_pet.get(pid, [])
                v_status = compute_vaccination_status(p_vac)

                if v_status == "Fully Vaccinated":
                    fully_vaccinated += 1
                elif v_status == "Booster Overdue":
                    overdue_vaccines += 1

                if compute_spayed_neutered(p_med) or pet.get("spayed_neutered"):
                    tnr_certified += 1

                is_q, _, _ = compute_active_quarantine(pet, p_med)
                if is_q:
                    active_quarantines += 1

                a_status = str(pet.get("adoption_status") or "").lower()
                p_type = str(pet.get("pet_type") or "").lower()
                if a_status == "adopted":
                    adopted_pets += 1
                elif "campus" not in p_type and "campus" not in a_status:
                    adoptable_pets += 1

            pending_adoptions = sum(
                1 for a in adoptions if str(a.get("application_status") or "") == "Pending"
            )
            pending_volunteers = sum(
                1 for v in volunteers if str(v.get("status") or "Pending") == "Pending"
            )
            pending_sightings = sum(
                1 for s in sightings if str(s.get("status") or "Pending") == "Pending"
            )
            urgent_sightings = sum(
                1
                for s in sightings
                if str(s.get("status") or "Pending") != "Resolved" and _is_urgent_sighting(s)
            )
            low_stock_items = sum(
                1
                for item in inventory
                if int(item.get("quantity") or 0) <= int(item.get("min_threshold") or 10)
            )

            return Response(
                {
                    "total_active_pets": len(active_pets),
                    "archived_pets": archived_pets,
                    "fully_vaccinated_pets": fully_vaccinated,
                    "overdue_vaccines": overdue_vaccines,
                    "tnr_certified_pets": tnr_certified,
                    "active_quarantines": active_quarantines,
                    "adopted_pets": adopted_pets,
                    "adoptable_pets": adoptable_pets,
                    "pending_adoptions": pending_adoptions,
                    "pending_volunteers": pending_volunteers,
                    "pending_applications_total": pending_adoptions + pending_volunteers,
                    "pending_sightings": pending_sightings,
                    "urgent_sightings": urgent_sightings,
                    "low_stock_items": low_stock_items,
                    "total_inventory_items": len(inventory),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            logger.exception("Failed to compute staff summary: %s", exc)
            return Response(
                {"error": "Unable to load operational summary."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MedicalRecordDetailAPIView(APIView):
    permission_classes = [IsMDCStaff]

    def put(self, request, record_id):
        try:
            db = get_db_client()
            existing = (
                db.table("medical_records")
                .select("*")
                .eq("record_id", record_id)
                .execute()
            )
            if not existing.data:
                return Response(
                    {"error": "Medical record not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            current = existing.data[0]
            d = request.data
            update_payload = {}

            if "notes" in d:
                update_payload["notes"] = clean_text(d.get("notes"), 3000)
            if "medication_prescribed" in d:
                update_payload["medication_prescribed"] = clean_text(d.get("medication_prescribed"), 500) or "None"
            if "weight_at_log" in d:
                update_payload["weight_at_log"] = clean_text(d.get("weight_at_log"), 40) or "N/A"
            if "veterinarian" in d:
                update_payload["veterinarian"] = clean_text(d.get("veterinarian"), 120) or request.user.full_name or request.user.email
            if "log_date" in d:
                normalized_date = normalize_date_str(d.get("log_date"))
                if normalized_date:
                    update_payload["log_date"] = normalized_date
            if "next_followup_date" in d:
                update_payload["next_followup_date"] = normalize_date_str(d.get("next_followup_date"))

            if "record_type" in d:
                raw_rtype = clean_text(d.get("record_type"), 80)
                if raw_rtype:
                    is_spay = any(kw in raw_rtype.lower() for kw in SPAY_NEUTER_KEYWORDS)
                    if is_spay:
                        update_payload["record_type"] = "Clinical Treatment"
                        notes_now = update_payload.get("notes", current.get("notes") or "")
                        if "[spay / neuter" not in notes_now.lower():
                            update_payload["notes"] = f"[SPAY / NEUTER — TNR STERILIZATION]\n{notes_now}".strip()
                    elif "Bite" in raw_rtype:
                        update_payload["record_type"] = "Bite Incident"
                    elif "Scratch" in raw_rtype:
                        update_payload["record_type"] = "Scratch Incident"
                    elif "Treatment" in raw_rtype or "Clinical" in raw_rtype:
                        update_payload["record_type"] = "Clinical Treatment"
                    else:
                        update_payload["record_type"] = "Check-up"

            if not update_payload:
                return Response(
                    {"error": "No valid medical record fields provided."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Recompute 14-day quarantine expiry if editing a bite/scratch record date
            effective_rtype = update_payload.get("record_type") or current.get("record_type") or ""
            if ("Bite" in effective_rtype or "Scratch" in effective_rtype) and "log_date" in update_payload and not update_payload.get("next_followup_date"):
                parsed_dt = parse_datetime_safe(update_payload["log_date"])
                if parsed_dt:
                    update_payload["next_followup_date"] = (parsed_dt + timedelta(days=14)).strftime("%Y-%m-%d")

            res = (
                db.table("medical_records")
                .update(update_payload)
                .eq("record_id", record_id)
                .execute()
            )
            if not res.data:
                return Response({"error": "Unable to update medical record."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(res.data[0], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to update medical record %s: %s", record_id, exc)
            return Response(
                {"error": "Unable to update medical record."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class VaccinationLogDetailAPIView(APIView):
    permission_classes = [IsMDCStaff]

    def put(self, request, log_id):
        try:
            db = get_db_client()
            existing = (
                db.table("vaccination_logs")
                .select("*")
                .eq("log_id", log_id)
                .execute()
            )
            if not existing.data:
                return Response(
                    {"error": "Vaccination log not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            current = existing.data[0]
            target_pet = current.get("pet_id")
            d = request.data
            update_payload = {}

            if "vaccine_name" in d:
                vac_name = clean_text(d.get("vaccine_name"), 150)
                if not vac_name:
                    return Response({"error": "Vaccine name cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    pet_row = db.table("pets").select("species").eq("pet_id", target_pet).execute()
                    if pet_row.data:
                        species_err = validate_species_vaccine_compatibility(
                            pet_row.data[0].get("species"), vac_name
                        )
                        if species_err:
                            return Response({"error": species_err}, status=status.HTTP_400_BAD_REQUEST)
                except Exception as exc:
                    logger.warning("Species check skipped while editing vaccination %s: %s", log_id, exc)
                update_payload["vaccine_name"] = vac_name

            for date_key in ("administered_date", "next_due_date"):
                if date_key in d:
                    update_payload[date_key] = normalize_date_str(d.get(date_key))

            if "batch_lot_number" in d:
                update_payload["batch_lot_number"] = clean_text(d.get("batch_lot_number"), 60) or "N/A"
            if "weight_at_vaccination" in d:
                update_payload["weight_at_vaccination"] = clean_text(d.get("weight_at_vaccination"), 40) or "N/A"
            if "administered_by" in d:
                update_payload["administered_by"] = clean_text(d.get("administered_by"), 120) or request.user.full_name or request.user.email

            if not update_payload:
                return Response(
                    {"error": "No valid vaccination fields provided."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            res = (
                db.table("vaccination_logs")
                .update(update_payload)
                .eq("log_id", log_id)
                .execute()
            )
            if not res.data:
                return Response({"error": "Unable to update vaccination log."}, status=status.HTTP_400_BAD_REQUEST)

            if target_pet:
                try:
                    all_pet_vacs = db.table("vaccination_logs").select("*").eq("pet_id", target_pet).execute().data or []
                    safe_sync_pet_vaccination_status(target_pet, compute_vaccination_status(all_pet_vacs))
                except Exception as exc:
                    logger.warning("Post-edit vaccine status sync failed for %s: %s", target_pet, exc)

            return Response(res.data[0], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to update vaccination log %s: %s", log_id, exc)
            return Response(
                {"error": "Unable to update vaccination log."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PetRestoreAPIView(APIView):
    permission_classes = [IsMDCStaff]

    def post(self, request, pet_id):
        try:
            db = get_db_client()
            res = (
                db.table("pets")
                .update({"archived_at": None, "archived_by": None})
                .eq("pet_id", pet_id)
                .execute()
            )
            if not res.data:
                return Response({"error": f'Animal "{pet_id}" not found.'}, status=status.HTTP_404_NOT_FOUND)
            return Response(res.data[0], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to restore archived pet %s: %s", pet_id, exc)
            return Response(
                {"error": "Unable to restore animal profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )
