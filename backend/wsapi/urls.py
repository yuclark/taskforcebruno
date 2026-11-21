from django.urls import path
from .views import (
    AddCommentAPIView,
    AdoptionApplicationAPIView,
    AdoptionApplicationDetailAPIView,
    AnimalSightingAPIView,
    AnimalSightingDetailAPIView,
    CampusAnnouncementAPIView,
    CommentActionAPIView,
    HealthCheckAPIView,
    InventoryAPIView,
    InventoryDetailAPIView,
    InventoryTransactionAPIView,
    LoginView,
    LogoutView,
    MedicalRecordsAPIView,
    NewsfeedItemActionAPIView,
    PetAISearchAPIView,
    PetDetailAPIView,
    PetListAPIView,
    RegisterUserView,
    SessionView,
    ToggleLikeAPIView,
    UnifiedNewsfeedAPIView,
    VaccinationLogsAPIView,
)

urlpatterns = [
    # Authentication & session
    path("register/", RegisterUserView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("session/", SessionView.as_view(), name="session"),

    # Adoption applications
    path("pets/applications/", AdoptionApplicationAPIView.as_view(), name="adoption-applications-list-create"),
    path("pets/applications/<int:application_id>/", AdoptionApplicationDetailAPIView.as_view(), name="adoption-application-detail"),

    # Pet directory & trait search
    path("pets/", PetListAPIView.as_view(), name="pet-list"),
    path("pets/ai-search/", PetAISearchAPIView.as_view(), name="pet-ai-search"),
    path("pets/<str:pet_id>/", PetDetailAPIView.as_view(), name="pet-detail"),

    # Medical & vaccination records
    path("medical/log/", MedicalRecordsAPIView.as_view(), name="medical-log-slash"),
    path("medical/log", MedicalRecordsAPIView.as_view(), name="medical-log"),
    path("medical/<str:pet_id>/", MedicalRecordsAPIView.as_view(), name="medical-logs"),
    path("vaccinations/<str:pet_id>/", VaccinationLogsAPIView.as_view(), name="vaccination-logs"),

    # Supply inventory & transaction ledger
    path("inventory/", InventoryAPIView.as_view(), name="inventory-list-create"),
    path("inventory/<int:item_id>/", InventoryDetailAPIView.as_view(), name="inventory-detail"),
    path("inventory/transactions/", InventoryTransactionAPIView.as_view(), name="inventory-transactions"),

    # Animal sightings & announcements
    path("sightings/", AnimalSightingAPIView.as_view(), name="sightings-list-create"),
    path("sightings/<int:sighting_id>/", AnimalSightingDetailAPIView.as_view(), name="sighting-detail"),
    path("announcements/", CampusAnnouncementAPIView.as_view(), name="announcements-list-create"),

    # Community newsfeed & engagement
    path("newsfeed/", UnifiedNewsfeedAPIView.as_view(), name="newsfeed"),
    path("newsfeed/like/", ToggleLikeAPIView.as_view(), name="feed-toggle-like"),
    path("newsfeed/comment/", AddCommentAPIView.as_view(), name="feed-add-comment"),
    path("newsfeed/comment/action/", CommentActionAPIView.as_view(), name="feed-comment-action"),
    path("newsfeed/action/", NewsfeedItemActionAPIView.as_view(), name="newsfeed-item-action"),

    # Health check
    path("health/", HealthCheckAPIView.as_view(), name="health-check"),
]
