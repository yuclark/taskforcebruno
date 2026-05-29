import re
import uuid
import traceback
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from supabase import create_client, Client

# Initialize Database Target Router Client Connections
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

ID_PATTERN = re.compile(r'^\d{2}-\d{4}-\d{3}$')
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@cit\.edu$')


# =====================================================================
# 1. CORE AUTHENTICATION VIEWS
# =====================================================================

class RegisterUserView(APIView):
    def post(self, request):
        data = request.data
        user_id, first_name, last_name, email, password = data.get('id'), data.get('first_name'), data.get('last_name'), data.get('email'), data.get('password')
        if not user_id or not ID_PATTERN.match(user_id): 
            return Response({"error": "Format mismatch."}, status=status.HTTP_400_BAD_REQUEST)
        if not email or not EMAIL_PATTERN.match(email): 
            return Response({"error": "Domain mismatch."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            auth_response = supabase.auth.sign_up({"email": email, "password": password, "options": {"data": {"custom_id": user_id, "first_name": first_name, "last_name": last_name, "role": 'user'}}})
            supabase.table("profiles").insert({"id": auth_response.user.id, "custom_id": user_id, "first_name": first_name, "last_name": last_name, "email": email, "role": 'user'}).execute()
            return Response({"message": "Account initialized."}, status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        try:
            response = supabase.auth.sign_in_with_password({"email": request.data.get('email'), "password": request.data.get('password')})
            role = response.user.user_metadata.get("role", "user")
            return Response({"session": {"access_token": response.session.access_token, "role": role, "email": response.user.email}}, status=status.HTTP_200_OK)
        except Exception: 
            return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)


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
            pet_query = supabase.table("pets").select("*").eq("pet_id", pet_id).execute()
            if not pet_query.data: 
                return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
            pet_data = pet_query.data[0]
            img = supabase.table("pet_images").select("image_url").eq("pet_id", pet_id).eq("is_primary", True).execute()
            pet_data["primary_image"] = img.data[0]["image_url"] if img.data else pet_data.get("primary_image")
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

class MedicalRecordsAPIView(APIView):
    def get(self, request, pet_id):
        try: 
            return Response(supabase.table("medical_records").select("*").eq("pet_id", pet_id).order("log_date", desc=True).execute().data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, pet_id):
        try:
            p = request.data
            p["pet_id"] = pet_id
            return Response(supabase.table("medical_records").insert(p).execute().data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VaccinationLogsAPIView(APIView):
    def get(self, request, pet_id):
        try: 
            return Response(supabase.table("vaccination_logs").select("*").eq("pet_id", pet_id).order("administered_date", desc=True).execute().data, status=status.HTTP_200_OK)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, pet_id):
        try:
            p = request.data
            p["pet_id"] = pet_id
            return Response(supabase.table("vaccination_logs").insert(p).execute().data[0], status=status.HTTP_201_CREATED)
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
            return Response(supabase.table("inventory").insert(request.data).execute().data[0], status=status.HTTP_201_CREATED)
        except Exception as e: 
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InventoryDetailAPIView(APIView):
    def put(self, request, item_id):
        try: 
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
            i_q = supabase.table("inventory").select("quantity").eq("item_id", d.get("item_id")).execute()
            q = i_q.data[0]["quantity"]
            new_q = (q + d.get("quantity_changed")) if d.get("transaction_type") == 'IN' else max(0, q - d.get("quantity_changed"))
            supabase.table("inventory").update({"quantity": new_q}).eq("item_id", d.get("item_id")).execute()
            tx = supabase.table("inventory_transactions").insert({"item_id": d.get("item_id"), "transaction_type": d.get("transaction_type"), "quantity_changed": d.get("quantity_changed"), "reason": d.get("reason"), "supplier_donor": d.get("supplier_donor")}).execute()
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
                supabase.table("pets").update({"adoption_status": "Adopted"}).eq("pet_id", pet_id).execute()
                
                try:
                    # Query BOTH the name and the visual photo link out of the pets table
                    pet_query = supabase.table("pets").select("name, primary_image").eq("pet_id", pet_id).execute()
                    if pet_query.data:
                        pet_name = pet_query.data[0].get("name", "A companion")
                        pet_image = pet_query.data[0].get("primary_image", None)
                    else:
                        pet_name = "A companion"
                        pet_image = None
                    
                    # Inject the extracted pet image URL straight into the bulletin record payload
                    celebration_payload = {
                        "title": f"🎉 Companion Adopted: {pet_name} has a Forever Home!",
                        "content": f"Wonderful news community! The adoption application clearance for {pet_name} (File ID: #{pet_id}) has passed all official vetting filters.",
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

            # 1. Gather Sightings
            sightings = supabase.table("animal_sightings").select("*").neq("status", "Resolved").execute().data or []
            for s in sightings:
                fid = f"sighting_{s['sighting_id']}"
                unified_feed.append({
                    "feed_id": fid,
                    "item_type": "sighting",
                    "title": f"Active Sighting Area: {s['animal_type']}",
                    "body": f"Distinct somatic markers observed: \"{s['distinct_features']}\"",
                    "badge_text": s['status'],
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
            # DELETE PETS
            # =====================================================
            elif feed_id.startswith("pet_"):

                pet_id = feed_id.replace(
                    "pet_",
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
                    "pets"
                ).delete().eq(
                    "pet_id",
                    pet_id
                ).execute()

                print(delete_res)

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

# Add this endpoint view class near your other Adoption/Pet views in views.py
class PetAISearchAPIView(APIView):
    def post(self, request):
        try:
            description_query = request.data.get("description", "").strip().lower()
            if not description_query:
                return Response({"error": "Null search constraint parameters."}, status=status.HTTP_400_BAD_REQUEST)

            # 1. Fetch all active pet assets out of the Supabase register database
            all_pets = supabase.table("pets").select("pet_id, name, species, breed, about_text, primary_image, found_near, current_conditions").execute().data or []
            
            # 2. Tokenize user natural description text input parameters
            query_tokens = [t for t in re.split(r'\W+', description_query) if len(t) > 2] # filters out filler small words

            scored_candidates = []
            for pet in all_pets:
                score = 0
                
                # Combine lookup text anchors
                searchable_blob = f"{pet.get('name', '')} {pet.get('species', '')} {pet.get('breed', '')} {pet.get('about_text', '')} {pet.get('found_near', '')} {pet.get('current_conditions', '')}".lower()
                
                # High-weight strict category matching anchors
                species_val = str(pet.get("species", "")).lower()
                breed_val = str(pet.get("breed", "")).lower()
                origin_val = str(pet.get("found_near", "")).lower()

                for token in query_tokens:
                    # Specific high-weight bonuses
                    if token in species_val:
                        score += 15  # Heavy structural weight for matching species ('cat', 'dog')
                    if token in breed_val:
                        score += 10  # Weight anchor for matching breeds ('tabby', 'husky')
                    if token in origin_val:
                        score += 8   # Weight anchor for campus geographical match indicators
                    
                    # Baseline substring scan match tracking accumulation loop
                    if token in searchable_blob:
                        score += 3
                        
                if score > 0:
                    pet["search_affinity_score"] = score
                    scored_candidates.append(pet)
            
            # 3. Sort structural matches descending by high matching priority metrics
            scored_candidates.sort(key=lambda x: x["search_affinity_score"], reverse=True)
            
            # Limit array scale matrix return parameters to top 5 candidates
            final_top_hits = scored_candidates[:5]
            
            return Response(final_top_hits, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)