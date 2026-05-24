import re
import uuid
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from supabase import create_client, Client

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

ID_PATTERN = re.compile(r'^\d{2}-\d{4}-\d{3}$')
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@cit\.edu$')

# --- AUTH VIEWS ---

class RegisterUserView(APIView):
    def post(self, request):
        data = request.data
        user_id, first_name, last_name, email, password = data.get('id'), data.get('first_name'), data.get('last_name'), data.get('email'), data.get('password')
        if not user_id or not ID_PATTERN.match(user_id): return Response({"error": "Format mismatch."}, status=status.HTTP_400_BAD_REQUEST)
        if not email or not EMAIL_PATTERN.match(email): return Response({"error": "Domain mismatch."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            auth_response = supabase.auth.sign_up({"email": email, "password": password, "options": {"data": {"custom_id": user_id, "first_name": first_name, "last_name": last_name, "role": 'user'}}})
            supabase.table("profiles").insert({"id": auth_response.user.id, "custom_id": user_id, "first_name": first_name, "last_name": last_name, "email": email, "role": 'user'}).execute()
            return Response({"message": "Account initialized."}, status=status.HTTP_201_CREATED)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        try:
            response = supabase.auth.sign_in_with_password({"email": request.data.get('email'), "password": request.data.get('password')})
            role = response.user.user_metadata.get("role", "user")
            return Response({"session": {"access_token": response.session.access_token, "role": role, "email": response.user.email}}, status=status.HTTP_200_OK)
        except Exception: return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

# --- PET & INVENTORY LOGISTICS VIEWS ---

class PetListAPIView(APIView):
    def get(self, request):
        try: return Response(supabase.table("pets").select("*").order("created_at", desc=True).execute().data, status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try: return Response(supabase.table("pets").insert(request.data).execute().data[0], status=status.HTTP_201_CREATED)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PetDetailAPIView(APIView):
    def get(self, request, pet_id):
        try:
            pet_query = supabase.table("pets").select("*").eq("pet_id", pet_id).execute()
            if not pet_query.data: return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
            pet_data = pet_query.data[0]
            img = supabase.table("pet_images").select("image_url").eq("pet_id", pet_id).eq("is_primary", True).execute()
            pet_data["primary_image"] = img.data[0]["image_url"] if img.data else None
            return Response(pet_data, status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pet_id):
        try:
            p = request.data
            p.pop('primary_image', None)
            q = supabase.table("pets").update(p).eq("pet_id", pet_id).execute()
            return Response(q.data[0], status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pet_id):
        try:
            supabase.table("pet_images").delete().eq("pet_id", pet_id).execute()
            supabase.table("pets").delete().eq("pet_id", pet_id).execute()
            return Response({"message": "Scrubbed."}, status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class MedicalRecordsAPIView(APIView):
    def get(self, request, pet_id):
        try: return Response(supabase.table("medical_records").select("*").eq("pet_id", pet_id).order("log_date", desc=True).execute().data, status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, pet_id):
        try:
            p = request.data
            p["pet_id"] = pet_id
            return Response(supabase.table("medical_records").insert(p).execute().data[0], status=status.HTTP_201_CREATED)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class VaccinationLogsAPIView(APIView):
    def get(self, request, pet_id):
        try: return Response(supabase.table("vaccination_logs").select("*").eq("pet_id", pet_id).order("administered_date", desc=True).execute().data, status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, pet_id):
        try:
            p = request.data
            p["pet_id"] = pet_id
            return Response(supabase.table("vaccination_logs").insert(p).execute().data[0], status=status.HTTP_201_CREATED)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- INVENTORY VIEWS ---

class InventoryAPIView(APIView):
    def get(self, request):
        try: return Response(supabase.table("inventory").select("*").order("item_name").execute().data, status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try: return Response(supabase.table("inventory").insert(request.data).execute().data[0], status=status.HTTP_201_CREATED)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class InventoryDetailAPIView(APIView):
    def put(self, request, item_id):
        try: return Response(supabase.table("inventory").update(request.data).eq("item_id", item_id).execute().data[0], status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, item_id):
        try:
            supabase.table("inventory").delete().eq("item_id", item_id).execute()
            return Response({"message": "Scrubbed."}, status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class InventoryTransactionAPIView(APIView):
    def get(self, request):
        try: return Response(supabase.table("inventory_transactions").select("*, inventory(item_name, unit)").order("logged_at", desc=True).execute().data, status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            d = request.data
            i_q = supabase.table("inventory").select("quantity").eq("item_id", d.get("item_id")).execute()
            q = i_q.data[0]["quantity"]
            new_q = (q + d.get("quantity_changed")) if d.get("transaction_type") == 'IN' else max(0, q - d.get("quantity_changed"))
            supabase.table("inventory").update({"quantity": new_q}).eq("item_id", d.get("item_id")).execute()
            tx = supabase.table("inventory_transactions").insert({"item_id": d.get("item_id"), "transaction_type": d.get("transaction_type"), "quantity_changed": d.get("quantity_changed"), "reason": d.get("reason"), "supplier_donor": d.get("supplier_donor")}).execute()
            return Response(tx.data[0], status=status.HTTP_201_CREATED)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- ADOPTION APPLICATION VIEWS ---

class AdoptionApplicationAPIView(APIView):
    def get(self, request):
        try:
            email = request.query_params.get('email', None)
            q = supabase.table("adoption_applications").select("*")
            if email: q = q.eq("email", email) # Fixed mapping to scan the email attribute column
            return Response(q.order("submitted_at", desc=True).execute().data, status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            d = request.data
            ins = {
                "pet_id": d.get("pet_id"), 
                "full_name": d.get("full_name"), 
                "email": d.get("email"), # Integrated tracking node value link
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
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AdoptionApplicationDetailAPIView(APIView):
    def put(self, request, application_id):
        try:
            d = request.data
            status_val, pet_id = d.get("application_status"), d.get("pet_id")
            res = supabase.table("adoption_applications").update({"application_status": status_val}).eq("application_id", application_id).execute()
            if status_val == "Approved" and pet_id:
                supabase.table("pets").update({"adoption_status": "Adopted"}).eq("pet_id", pet_id).execute()
            return Response(res.data[0], status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
# --- ANIMAL SIGHTINGS VIEWS ---

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

            insert_payload = {
                "reporter_email": d.get("reporter_email"),
                "animal_type": d.get("animal_type"),
                "distinct_features": d.get("distinct_features"),
                "location_details": d.get("location_details"),
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