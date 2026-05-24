import re
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from supabase import create_client, Client

# Initialize the third-party Supabase client connection wrapper
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Institutional structural string pattern verification rules
ID_PATTERN = re.compile(r'^\d{2}-\d{4}-\d{3}$')
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@cit\.edu$')

class RegisterUserView(APIView):
    def post(self, request):
        data = request.data
        user_id = data.get('id')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        password = data.get('password')
        role = 'user'

        if not user_id or not ID_PATTERN.match(user_id):
            return Response({"error": "Format mismatch. ID structure must follow standard template: 12-3456-789."}, status=status.HTTP_400_BAD_REQUEST)

        if not email or not EMAIL_PATTERN.match(email):
            return Response({"error": "Domain mismatch. Provided address must be explicitly registered to @cit.edu."}, status=status.HTTP_400_BAD_REQUEST)

        if not first_name or not last_name:
            return Response({"error": "Incomplete request body. First name and last name parameters are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            auth_response = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "custom_id": user_id,
                        "first_name": first_name,
                        "last_name": last_name,
                        "role": role
                    }
                }
            })
            
            profile_data = {
                "id": auth_response.user.id,
                "custom_id": user_id,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "role": role
            }
            supabase.table("profiles").insert(profile_data).execute()

            return Response({"message": "Wildcat Welfare account initialized successfully!"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')

        try:
            response = supabase.auth.sign_in_with_password({"email": email, "password": password})
            user_metadata = response.user.user_metadata
            role = user_metadata.get("role", "user")

            return Response({
                "message": "Institutional clearance confirmed.",
                "session": {
                    "access_token": response.session.access_token,
                    "role": role,
                    "email": response.user.email
                }
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Invalid login parameters. Confirm institutional credentials match."}, status=status.HTTP_401_UNAUTHORIZED)


class PetListAPIView(APIView):
    def get(self, request):
        try:
            query = supabase.table("pets").select("*").order("created_at", desc=True).execute()
            return Response(query.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to retrieve pet registry data models: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            # CREATE operation endpoint mapping
            pet_data = request.data
            query = supabase.table("pets").insert(pet_data).execute()
            return Response(query.data[0], status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"Failed to insert animal database record: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class PetDetailAPIView(APIView):
    def get(self, request, pet_id):
        try:
            pet_query = supabase.table("pets").select("*").eq("pet_id", pet_id).execute()
            if not pet_query.data:
                return Response({"error": "Profile object key signature not found inside system registers."}, status=status.HTTP_404_NOT_FOUND)
            
            pet_data = pet_query.data[0]
            image_query = supabase.table("pet_images").select("image_url").eq("pet_id", pet_id).eq("is_primary", True).execute()
            
            if image_query.data:
                pet_data["primary_image"] = image_query.data[0]["image_url"]
            else:
                pet_data["primary_image"] = None

            return Response(pet_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Internal mapping error encountered: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pet_id):
        try:
            # UPDATE operation endpoint mapping
            update_payload = request.data
            update_payload.pop('primary_image', None)  # Scrub derived media fields
            
            query = supabase.table("pets").update(update_payload).eq("pet_id", pet_id).execute()
            if not query.data:
                return Response({"error": "Target pet record not cataloged or mutation rejected."}, status=status.HTTP_404_NOT_FOUND)
            
            return Response(query.data[0], status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to mutate database transaction record: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pet_id):
        try:
            # DELETE operation endpoint mapping
            supabase.table("pet_images").delete().eq("pet_id", pet_id).execute()
            query = supabase.table("pets").delete().eq("pet_id", pet_id).execute()
            
            if not query.data:
                return Response({"error": "Target pet record not cataloged or purge sequence failed."}, status=status.HTTP_404_NOT_FOUND)
            
            return Response({"message": "Asset successfully deleted from active registers."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Purge routine execution exception: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)