import logging
from datetime import datetime, timezone

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsAuthenticatedUser, IsMDCStaff
from .supabase_client import get_db_client
from .validators import ID_PATTERN, PHONE_PATTERN, clean_text

logger = logging.getLogger(__name__)

ALLOWED_VOLUNTEER_ROLES = frozenset({
    "Feeding Patrol",
    "Clinic Assistant",
    "Rescue Marshal",
    "Media & Photography",
})

ALLOWED_VOLUNTEER_STAFF_STATUSES = frozenset({
    "Pending",
    "Approved",
    "Declined",
    "Active",
    "Inactive",
})


class VolunteerApplicationAPIView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        try:
            db = get_db_client()
            query = db.table("volunteer_applications").select("*")
            if request.user.is_staff:
                status_filter = clean_text(request.query_params.get("status"), 30)
                if status_filter and status_filter.lower() != "all":
                    query = query.eq("status", status_filter)
            else:
                query = query.eq("email", request.user.email)

            rows = query.order("created_at", desc=True).execute().data or []
            return Response(rows, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to load volunteer applications: %s", exc)
            return Response(
                {"error": "Unable to load volunteer applications."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        try:
            d = request.data
            full_name = clean_text(d.get("full_name"), 120) or request.user.full_name
            student_id = clean_text(d.get("student_id"), 20) or request.user.custom_id
            raw_phone = clean_text(d.get("contact_number"), 30)
            cleaned_phone = raw_phone.replace("-", "").replace(" ", "")
            program = clean_text(d.get("program"), 120)
            role = clean_text(d.get("role"), 60) or "Feeding Patrol"
            availability = clean_text(d.get("availability"), 400)
            notes = clean_text(d.get("notes"), 800) or None

            if not full_name or len(full_name) < 2:
                return Response(
                    {"error": "Please provide your full name."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not student_id or not ID_PATTERN.match(student_id):
                return Response(
                    {"error": "Student ID must follow CIT-U format XX-XXXX-XXX."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not cleaned_phone or not PHONE_PATTERN.match(cleaned_phone):
                return Response(
                    {"error": "Please provide a valid Philippine mobile number."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not program or len(program) < 2:
                return Response(
                    {"error": "Please provide your department or degree program."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not availability or len(availability) < 5:
                return Response(
                    {"error": "Please describe your availability schedule."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if role not in ALLOWED_VOLUNTEER_ROLES:
                role = "Feeding Patrol"

            db = get_db_client()
            # Prevent duplicate pending volunteer submissions for the same user & role
            existing = (
                db.table("volunteer_applications")
                .select("application_id, status, role")
                .eq("email", request.user.email)
                .eq("status", "Pending")
                .execute()
                .data
                or []
            )
            if any(row.get("role") == role for row in existing):
                return Response(
                    {"error": f'You already have a pending volunteer application for "{role}".'},
                    status=status.HTTP_409_CONFLICT,
                )

            payload = {
                "full_name": full_name,
                "student_id": student_id,
                "email": request.user.email,
                "contact_number": raw_phone,
                "program": program,
                "role": role,
                "availability": availability,
                "notes": notes,
                "status": "Pending",
            }
            res = db.table("volunteer_applications").insert(payload).execute()
            if not res.data:
                return Response(
                    {"error": "Failed to submit volunteer application."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Failed to submit volunteer application: %s", exc)
            return Response(
                {"error": "Unable to submit volunteer application."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class VolunteerApplicationDetailAPIView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def put(self, request, application_id):
        try:
            db = get_db_client()
            existing_res = (
                db.table("volunteer_applications")
                .select("*")
                .eq("application_id", application_id)
                .execute()
            )
            if not existing_res.data:
                return Response(
                    {"error": "Volunteer application not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            app_row = existing_res.data[0]
            new_status = clean_text(request.data.get("status"), 30)

            if request.user.is_staff:
                if new_status not in ALLOWED_VOLUNTEER_STAFF_STATUSES:
                    return Response(
                        {"error": "Invalid status. Allowed: Pending, Approved, Declined, Active, Inactive."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                update_payload = {
                    "status": new_status,
                    "reviewed_by": request.user.email,
                    "reviewed_at": datetime.now(timezone.utc).isoformat(),
                }
            else:
                owner_email = (app_row.get("email") or "").strip().lower()
                if owner_email != request.user.email:
                    return Response(
                        {"error": "You can only manage your own volunteer application."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                if new_status != "Cancelled":
                    return Response(
                        {"error": "Applicants can only withdraw (cancel) a pending volunteer application."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                if app_row.get("status") != "Pending":
                    return Response(
                        {"error": "Only pending volunteer applications can be withdrawn."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                update_payload = {"status": "Cancelled"}

            res = (
                db.table("volunteer_applications")
                .update(update_payload)
                .eq("application_id", application_id)
                .execute()
            )
            if not res.data:
                return Response(
                    {"error": "Failed to update volunteer application."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(res.data[0], status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to update volunteer application %s: %s", application_id, exc)
            return Response(
                {"error": "Unable to update volunteer application."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request, application_id):
        if not request.user.is_staff:
            return Response(
                {"error": "Only MDC staff can delete volunteer records."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            res = (
                get_db_client()
                .table("volunteer_applications")
                .delete()
                .eq("application_id", application_id)
                .execute()
            )
            if not res.data:
                return Response(
                    {"error": "Volunteer application not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response({"message": "Volunteer application removed."}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to delete volunteer application %s: %s", application_id, exc)
            return Response(
                {"error": "Unable to delete volunteer application."},
                status=status.HTTP_400_BAD_REQUEST,
            )
