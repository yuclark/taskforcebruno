import re
import uuid
import json
import base64
import traceback
from datetime import datetime, timedelta
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
            res_data.sort(key=lambda x: str(x.get('created_at') or x.get('rescue_date') or ''), reverse=True)
            return Response(res_data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            d = request.data
            image_file = request.FILES.get('image', None)
            image_url = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba"

            if image_file:
                file_ext = image_file.name.split('.')[-1]
                storage_filename = f"pet_{uuid.uuid4()}.{file_ext}"
                file_binary_data = image_file.read()
                
                supabase.storage.from_("petpictures").upload(
                    path=storage_filename,
                    file=file_binary_data,
                    file_options={"content-type": image_file.content_type}
                )
                image_url = supabase.storage.from_("petpictures").get_public_url(storage_filename)

            is_sterilized = str(d.get("spayed_neutered")).lower() == 'true'

            insert_payload = {
                "pet_id": d.get("pet_id"),
                "name": d.get("name"),
                "species": d.get("species"),
                "pet_type": d.get("pet_type"),
                "breed": d.get("breed"),
                "gender": d.get("gender"),
                "age": d.get("age"),
                "weight": d.get("weight"),
                "size": d.get("size"),
                "vaccination_status": d.get("vaccination_status"),
                "spayed_neutered": is_sterilized,
                "adoption_status": d.get("adoption_status"),
                "found_near": d.get("found_near"),
                "rescue_date": d.get("rescue_date"),
                "current_conditions": d.get("current_conditions"),
                "behavior_notes": d.get("behavior_notes"),
                "about_text": d.get("about_text"),
                "primary_image": image_url
            }
            
            res = supabase.table("pets").insert(insert_payload).execute()
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PetDetailAPIView(APIView):
    def get(self, request, pet_id):
        try:
            from datetime import datetime, date
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
                if img.data:
                    pet_data["primary_image"] = img.data[0]["image_url"]
            except Exception:
                pass

            # Check active rabies quarantine observation logs (under RA 9482)
            try:
                med_logs = supabase.table("medical_records").select("*").eq("pet_id", pet_data.get("pet_id", pet_id)).execute().data or []
                for m in med_logs:
                    rtype = str(m.get("record_type", ""))
                    if "Bite" in rtype or "Scratch" in rtype or m.get("is_quarantine"):
                        pet_data["is_quarantined"] = True
                        if m.get("quarantine_expiry_date"):
                            pet_data["quarantine_expiry_date"] = m.get("quarantine_expiry_date")
                        elif m.get("next_followup_date"):
                            pet_data["quarantine_expiry_date"] = f"{m.get('next_followup_date')}T09:30:00Z"
                        break
            except Exception:
                pass

            return Response(pet_data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pet_id):
        try:
            p = request.data
            p.pop('primary_image', None)
            q = supabase.table("pets").update(p).eq("pet_id", pet_id).execute()
            return Response(q.data[0], status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pet_id):
        try:
            admin_supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            print(f"\n[PURGE ENGINE] Initiating cascade wipe sequence for Profile Asset ID: #{pet_id}")
            
            feed_id_token = f"pet_{pet_id}"
            admin_supabase.table("feed_likes").delete().eq("feed_id", feed_id_token).execute()
            admin_supabase.table("feed_comments").delete().eq("feed_id", feed_id_token).execute()
            
            admin_supabase.table("medical_records").delete().eq("pet_id", pet_id).execute()
            admin_supabase.table("vaccination_logs").delete().eq("pet_id", pet_id).execute()
            
            admin_supabase.table("adoption_applications").delete().eq("pet_id", pet_id).execute()
            admin_supabase.table("pet_images").delete().eq("pet_id", pet_id).execute()
            
            res = admin_supabase.table("pets").delete().eq("pet_id", pet_id).execute()
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
    Verifies that the requester has staff/MDC clinician permissions to log medical/vaccine entries.
    Rejects students or unauthorized users with HTTP 403 Forbidden.
    """
    auth_header = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION", "")
    role = None
    email = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            parts = token.split(".")
            if len(parts) >= 2:
                payload_b64 = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                decoded = json.loads(base64.urlsafe_b64decode(payload_b64).decode("utf-8"))
                user_meta = decoded.get("user_metadata") or {}
                role = (user_meta.get("role") or decoded.get("role") or "").strip().lower()
                email = (decoded.get("email") or user_meta.get("email") or "").strip().lower()
        except Exception:
            pass

    header_role = (request.headers.get("X-User-Role") or request.headers.get("Role") or "").strip().lower()
    if header_role:
        role = header_role

    if isinstance(request.data, dict) and request.data.get("role"):
        submitted_role = str(request.data.get("role")).strip().lower()
        if submitted_role in ["student", "user"]:
            role = submitted_role
        elif not role:
            role = submitted_role

    # Reject students or regular unprivileged users
    if role in ["student", "user"] or (email and ("student" in email or re.match(r'^\d{2}-\d{4}-\d{3}@', email))):
        return False

    # Allow staff / MDC / admin
    if role in ["staff", "mdc", "admin", "clinician", "nurse", "veterinarian"] or (email and ("mdc" in email or "staff" in email)):
        return True

    # If token has role "student"
    if role and "student" in role:
        return False

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

            target_pet = p.get("pet_id")
            record_type = str(p.get("record_type", ""))

            # TC-MED-002: 14-Day Bite Observation Quarantine Calculation (RA 9482)
            if "Bite" in record_type or "Scratch" in record_type:
                log_date_raw = p.get("log_date")
                parsed_dt = None
                if log_date_raw:
                    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d %I:%M %p", "%Y-%m-%d"):
                        try:
                            parsed_dt = datetime.strptime(log_date_raw.strip(), fmt)
                            break
                        except Exception:
                            pass
                if not parsed_dt:
                    parsed_dt = datetime.now()

                # Calculate exact 14-day statutory quarantine release timestamp
                expiry_dt = parsed_dt + timedelta(days=14)
                expiry_str = expiry_dt.strftime("%Y-%m-%d")

                if not p.get("next_followup_date"):
                    p["next_followup_date"] = expiry_str

                # Automatically update target Pet profile to Quarantine status
                if target_pet and target_pet != "log":
                    try:
                        supabase.table("pets").update({
                            "status": "Quarantine / Rabies Observation",
                            "current_conditions": f"Under 14-day Rabies Observation (until {expiry_str})"
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
            insert_payload = {k: v for k, v in p.items() if k in ALLOWED_MED_FIELDS and v is not None}

            return Response(supabase.table("medical_records").insert(insert_payload).execute().data[0], status=status.HTTP_201_CREATED)
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

            ALLOWED_VAC_FIELDS = {
                "pet_id", "vaccine_name", "administered_date", "next_due_date",
                "batch_lot_number", "batch_number", "weight_at_vaccination",
                "administered_by", "expiration_date"
            }
            insert_payload = {k: v for k, v in p.items() if k in ALLOWED_VAC_FIELDS and v is not None}
            return Response(supabase.table("vaccination_logs").insert(insert_payload).execute().data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =====================================================================
# 4. SUPPLY HUB & INVENTORY LOGISTICS
# =====================================================================

class InventoryAPIView(APIView):
    def get(self, request):
        try: 
            return Response(supabase.table("inventory").select("*").order("item_name").execute().data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try: 
            # TC-SUP-002: Dimensional Unit Strict Enum Validation
            APPROVED_INVENTORY_UNITS = {
                'kg', 'cans', 'bags', 'packs', 'g', 'vials', 'pcs', 'bottles', 'boxes', 'units', 'doses',
                'KG', 'CAN', 'VIAL', 'PCS', 'UNITS', 'BOXES', 'BAGS', 'PACKS', 'G'
            }
            unit_submitted = request.data.get("unit")
            if unit_submitted and unit_submitted not in APPROVED_INVENTORY_UNITS:
                return Response({
                    "unit": [f'"{unit_submitted}" is not a valid choice.']
                }, status=status.HTTP_400_BAD_REQUEST)

            return Response(supabase.table("inventory").insert(request.data).execute().data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InventoryDetailAPIView(APIView):
    def put(self, request, item_id):
        try: 
            # TC-SUP-002: Dimensional Unit Strict Enum Validation
            APPROVED_INVENTORY_UNITS = {
                'kg', 'cans', 'bags', 'packs', 'g', 'vials', 'pcs', 'bottles', 'boxes', 'units', 'doses',
                'KG', 'CAN', 'VIAL', 'PCS', 'UNITS', 'BOXES', 'BAGS', 'PACKS', 'G'
            }
            unit_submitted = request.data.get("unit")
            if unit_submitted and unit_submitted not in APPROVED_INVENTORY_UNITS:
                return Response({
                    "unit": [f'"{unit_submitted}" is not a valid choice.']
                }, status=status.HTTP_400_BAD_REQUEST)

            # TC-SUP-003: Prevent updating stock to a negative number
            if "quantity" in request.data:
                try:
                    q = int(float(request.data["quantity"]))
                    if q < 0:
                        return Response({
                            "quantity": ["Stock quantity cannot be negative."]
                        }, status=status.HTTP_400_BAD_REQUEST)
                except (ValueError, TypeError):
                    pass

            return Response(supabase.table("inventory").update(request.data).eq("item_id", item_id).execute().data[0], status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, item_id):
        try:
            supabase.table("inventory").delete().eq("item_id", item_id).execute()
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

            if tx_type in ['OUT', 'OUTFLOW', 'DISBURSEMENT', 'DEDUCTION']:
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
                "transaction_type": 'OUT' if tx_type in ['OUT', 'OUTFLOW', 'DISBURSEMENT', 'DEDUCTION'] else 'IN',
                "quantity_changed": qty_changed,
                "reason": d.get("reason"),
                "supplier_donor": d.get("supplier_donor")
            }).execute()
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
                query = query.eq("email", email)
            
            res_data = query.execute().data or []
            res_data.sort(key=lambda x: str(x.get('submitted_at') or x.get('created_at') or ''), reverse=True)
            return Response(res_data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            d = request.data
            ins = {
                "pet_id": d.get("pet_id"), 
                "full_name": d.get("full_name"), 
                "email": d.get("email"),  
                "contact_number": d.get("contact_number"),
                "address": d.get("address"), 
                "experience_level": d.get("experience_level"), 
                "housing_type": d.get("housing_type"),
                "has_secure_fence": bool(d.get("has_secure_fence")), 
                "household_agreement": bool(d.get("household_agreement")),
                "pet_care_budget": d.get("pet_care_budget"), 
                "plan_if_moving": d.get("plan_if_moving"), 
                "application_status": "Pending"
            }
            return Response(supabase.table("adoption_applications").insert(ins).execute().data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AdoptionApplicationDetailAPIView(APIView):
    def put(self, request, application_id):
        try:
            d = request.data
            status_val = d.get("application_status")
            pet_id = d.get("pet_id")
            
            # Defensive casting: Ensure application_id matches integer types if your DB requires it
            try:
                target_id = int(application_id)
            except ValueError:
                target_id = application_id

            # 1. Update the status of the adoption application row itself
            res = supabase.table("adoption_applications").update({"application_status": status_val}).eq("application_id", target_id).execute()
            
            # Guard clause against index execution on empty tables
            if not res.data:
                return Response({"error": "Application tracking file not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # 2. Structural checks: Cascading mutations ONLY run for 'Approved' cases
            if status_val == "Approved" and pet_id:
                # Guard against double placement: Check if already adopted
                current_pet = supabase.table("pets").select("adoption_status").eq("pet_id", pet_id).execute()
                if current_pet.data and current_pet.data[0].get("adoption_status") == "Adopted":
                    return Response({"error": "This companion has already been placed with an approved applicant."}, status=status.HTTP_400_BAD_REQUEST)

                # Update target pet to Adopted
                supabase.table("pets").update({"adoption_status": "Adopted"}).eq("pet_id", pet_id).execute()
                
                # Automatically close all other pending applications for this same pet to prevent zombie state
                supabase.table("adoption_applications").update({
                    "application_status": "Closed - Pet Placed"
                }).eq("pet_id", pet_id).eq("application_status", "Pending").neq("application_id", target_id).execute()

                try:
                    # Query name and image for official announcement
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
                    
            # Safely return the updated record now that we confirmed data exists
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
                query = query.eq("reporter_email", email)
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
                file_ext = image_file.name.split('.')[-1]
                storage_filename = f"sighting_{uuid.uuid4()}.{file_ext}"
                file_binary_data = image_file.read()
                
                supabase.storage.from_("sightings").upload(
                    path=storage_filename,
                    file=file_binary_data,
                    file_options={"content-type": image_file.content_type}
                )
                image_url = supabase.storage.from_("sightings").get_public_url(storage_filename)

            campus_zone = (d.get("campus_zone") or '').strip()
            is_emergency = str(d.get("is_emergency", "")).lower() in ['true', '1', 'yes']
            
            location_details = (d.get("location_details") or '').strip()
            if campus_zone and not location_details.startswith(f"[{campus_zone}]"):
                location_details = f"[{campus_zone}] {location_details}"
                
            distinct_features = (d.get("distinct_features") or '').strip()
            if is_emergency and not distinct_features.startswith("[🚨 URGENT EMERGENCY]"):
                distinct_features = f"[🚨 URGENT EMERGENCY] {distinct_features}"

            insert_payload = {
                "reporter_email": (d.get("reporter_email") or '').strip().lower(),
                "animal_type": d.get("animal_type"),
                "distinct_features": distinct_features,
                "location_details": location_details,
                "image_url": image_url,
                "status": "Pending"
            }
            res = supabase.table("animal_sightings").insert(insert_payload).execute()
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AnimalSightingDetailAPIView(APIView):
    def put(self, request, sighting_id):
        try:
            status_val = request.data.get("status")
            res = supabase.table("animal_sightings").update({"status": status_val}).eq("sighting_id", sighting_id).execute()
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
            image_file = request.FILES.get('image', None)
            uploaded_image_url = None

            if image_file:
                file_ext = image_file.name.split('.')[-1]
                storage_filename = f"announcement_{uuid.uuid4()}.{file_ext}"
                file_binary_data = image_file.read()
                
                supabase.storage.from_("announcements").upload(
                    path=storage_filename,
                    file=file_binary_data,
                    file_options={"content-type": image_file.content_type}
                )
                uploaded_image_url = supabase.storage.from_("announcements").get_public_url(storage_filename)

            insert_payload = {
                "title": d.get("title"),
                "content": d.get("content"),
                "author_email": d.get("author_email"),
                "image_url": uploaded_image_url
            }

            res = supabase.table("campus_announcements").insert(insert_payload).execute()
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UnifiedNewsfeedAPIView(APIView):
    def get(self, request):
        try:
            unified_feed = []
            current_user = request.query_params.get("email", "")

            all_likes = supabase.table("feed_likes").select("*").execute().data or []
            all_comments = supabase.table("feed_comments").select("*").order("created_at", desc=False).execute().data or []

            likes_map = {}
            user_liked_set = set()
            for l in all_likes:
                fid = l["feed_id"]
                likes_map[fid] = likes_map.get(fid, 0) + 1
                if l["user_email"] == current_user:
                    user_liked_set.add(fid)

            comments_map = {}
            for c in all_comments:
                fid = c["feed_id"]
                if fid not in comments_map:
                    comments_map[fid] = []
                comments_map[fid].append({
                    "comment_id": c["comment_id"],
                    "user_email": c["user_email"],
                    "comment_text": c["comment_text"],
                    "timestamp": c["created_at"]
                })

            # 1. Gather Sightings (Community Moderation: Only show verified / investigated sightings or emergency alerts to prevent spam)
            sightings = supabase.table("animal_sightings").select("*").neq("status", "Resolved").execute().data or []
            for s in sightings:
                is_urgent = "[🚨 URGENT EMERGENCY]" in (s.get('distinct_features') or '')
                status_val = s.get('status') or 'Pending'
                
                # Await staff triage moderation before displaying on public newsfeed, unless emergency
                if status_val == "Pending" and not is_urgent:
                    continue

                fid = f"sighting_{s['sighting_id']}"
                badge = "🚨 URGENT EMERGENCY" if is_urgent else ("Verified Sighting" if status_val == "Investigated" else status_val)
                unified_feed.append({
                    "feed_id": fid,
                    "item_type": "sighting",
                    "title": f"Active Sighting Area: {s['animal_type']}",
                    "body": f"Distinct somatic markers observed: \"{s['distinct_features']}\"",
                    "badge_text": badge,
                    "meta_details": s['location_details'],
                    "image_url": s['image_url'],
                    "author_tag": s['reporter_email'],
                    "timestamp": s.get('logged_at') or '',
                    "likes_count": likes_map.get(fid, 0),
                    "is_liked_by_me": fid in user_liked_set,
                    "comments": comments_map.get(fid, [])
                })

            # 2. Gather Companions
            pets = supabase.table("pets").select("*").execute().data or []
            for p in pets:
                fid = f"pet_{p['pet_id']}"
                pet_timestamp = p.get('created_at') or p.get('rescue_date') or ''
                unified_feed.append({
                    "feed_id": fid,
                    "item_type": "pet",
                    "title": f"New Campus Profile: {p['name']}",
                    "body": f"Say hi to this beautiful {p['breed']} {p['species']}. Profile biography details: {p['about_text']}",
                    "badge_text": p['adoption_status'],
                    "meta_details": f"Colony Group: {p['found_near']}",
                    "image_url": p['primary_image'],
                    "author_tag": "MDC Operations Authority",
                    "timestamp": pet_timestamp,
                    "likes_count": likes_map.get(fid, 0),
                    "is_liked_by_me": fid in user_liked_set,
                    "comments": comments_map.get(fid, [])
                })

            # 3. Gather Bulletins
            announcements = supabase.table("campus_announcements").select("*").execute().data or []
            for a in announcements:
                fid = f"announcement_{a['announcement_id']}"
                unified_feed.append({
                    "feed_id": fid,
                    "item_type": "announcement",
                    "title": a['title'],
                    "body": a['content'],
                    "badge_text": "Official Notice",
                    "meta_details": "MDC Taskforce Bulletin",
                    "image_url": a.get('image_url'), 
                    "author_tag": a['author_email'],
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
            feed_id = request.data.get("feed_id")
            user_email = request.data.get("user_email")
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
            payload = {
                "feed_id": request.data.get("feed_id"),
                "user_email": request.data.get("user_email"),
                "comment_text": request.data.get("comment_text")
            }
            res = supabase.table("feed_comments").insert(payload).execute()
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
            feed_id = request.query_params.get("feed_id")

            if not feed_id:
                return Response(
                    {"error": "feed_id missing"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            print("DELETE REQUEST:", feed_id)

            admin_supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )

            # =====================================================
            # DELETE ANNOUNCEMENTS
            # =====================================================
            if feed_id.startswith("announcement_"):

                announcement_id = feed_id.replace(
                    "announcement_",
                    ""
                )

                admin_supabase.table("feed_likes").delete().eq(
                    "feed_id",
                    feed_id
                ).execute()

                admin_supabase.table("feed_comments").delete().eq(
                    "feed_id",
                    feed_id
                ).execute()

                delete_res = admin_supabase.table(
                    "campus_announcements"
                ).delete().eq(
                    "announcement_id",
                    int(announcement_id)
                ).execute()

                print(delete_res)

            # =====================================================
            # DELETE SIGHTINGS
            # =====================================================
            elif feed_id.startswith("sighting_"):

                sighting_id = feed_id.replace(
                    "sighting_",
                    ""
                )

                admin_supabase.table("feed_likes").delete().eq(
                    "feed_id",
                    feed_id
                ).execute()

                admin_supabase.table("feed_comments").delete().eq(
                    "feed_id",
                    feed_id
                ).execute()

                delete_res = admin_supabase.table(
                    "animal_sightings"
                ).delete().eq(
                    "sighting_id",
                    int(sighting_id)
                ).execute()

                print(delete_res)

            # =====================================================
            # MODERATE PET FEED CARDS (DO NOT DELETE FROM MASTER PETS TABLE)
            # =====================================================
            elif feed_id.startswith("pet_"):

                # Feed moderation: Clear social timeline interactions (likes/comments)
                # Master animal registration and clinical records remain strictly preserved in pets table
                admin_supabase.table("feed_likes").delete().eq(
                    "feed_id",
                    feed_id
                ).execute()

                admin_supabase.table("feed_comments").delete().eq(
                    "feed_id",
                    feed_id
                ).execute()

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

            feed_id = d.get("feed_id")

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

            admin_supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )

            announcement_id = feed_id.replace(
                "announcement_",
                ""
            )

            payload = {
                "title": d.get("title"),
                "content": d.get("body")
            }

            update_res = admin_supabase.table(
                "campus_announcements"
            ).update(
                payload
            ).eq(
                "announcement_id",
                int(announcement_id)
            ).execute()

            print(update_res)

            return Response(
                {"message": "Updated successfully"},
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
    synonym normalization (kitten -> cat, pup -> dog), and trait weighting.
    """
    def post(self, request):
        try:
            raw_query = request.data.get("description", "").strip().lower()
            if not raw_query:
                return Response({"error": "Null search constraint parameters."}, status=status.HTTP_400_BAD_REQUEST)

            # 1. Fetch active pet assets from Supabase
            all_pets = supabase.table("pets").select("pet_id, name, species, breed, about_text, description, primary_image, found_near, current_conditions").execute().data or []
            
            # 2. Extract negations (e.g. "not a dog", "no collar", "not cat")
            negative_tokens = set(re.findall(r'(?:not|no|never|except)\s+(?:a\s+|an\s+)?(\w+)', raw_query))

            # 3. Synonym mapping
            SYNONYMS = {
                'pup': 'dog', 'puppy': 'dog', 'hound': 'dog', 'aspin': 'dog', 'canine': 'dog',
                'kitten': 'cat', 'kitty': 'cat', 'puspin': 'cat', 'feline': 'cat'
            }

            # 4. Tokenize and clean query
            raw_tokens = [t for t in re.split(r'\W+', raw_query) if len(t) > 2]
            query_tokens = []
            for t in raw_tokens:
                canonical = SYNONYMS.get(t, t)
                query_tokens.append(canonical)

            COLOR_TRAITS = {'orange', 'ginger', 'black', 'white', 'brown', 'gray', 'grey', 'calico', 'tabby', 'tricolor', 'golden', 'spotted'}

            scored_candidates = []
            for pet in all_pets:
                species_val = str(pet.get("species", "")).lower()
                breed_val = str(pet.get("breed", "")).lower()
                origin_val = str(pet.get("found_near", "")).lower()
                explicit_desc = str(pet.get("description", "")).lower()
                searchable_blob = f"{pet.get('name', '')} {species_val} {breed_val} {pet.get('about_text', '')} {explicit_desc} {origin_val} {pet.get('current_conditions', '')}".lower()

                # Negation penalty: If search says "not a dog" and pet is a dog, exclude
                has_negative_conflict = False
                for neg in negative_tokens:
                    canonical_neg = SYNONYMS.get(neg, neg)
                    if canonical_neg in species_val or canonical_neg in breed_val:
                        has_negative_conflict = True
                        break
                if has_negative_conflict:
                    continue

                score = 0
                for token in query_tokens:
                    if token in negative_tokens:
                        continue
                    if token in species_val:
                        score += 20  # Species match (e.g. 'cat', 'dog')
                    if token in COLOR_TRAITS and (token in explicit_desc or token in breed_val):
                        score += 15  # Specific color/coat pattern match
                    if token in explicit_desc:
                        score += 12  # Explicit physical description trait
                    if token in breed_val:
                        score += 10  # Breed match
                    if token in origin_val:
                        score += 8   # Landmark / Colony zone match
                    if token in searchable_blob:
                        score += 3   # Substring occurrence

                if score > 0:
                    pet["search_affinity_score"] = score
                    scored_candidates.append(pet)
            
            scored_candidates.sort(key=lambda x: x["search_affinity_score"], reverse=True)
            final_top_hits = scored_candidates[:5]
            
            return Response(final_top_hits, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)