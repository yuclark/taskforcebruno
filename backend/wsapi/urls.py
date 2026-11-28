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
    ProfileAPIView,
    RegisterUserView,
    SessionView,
    ToggleLikeAPIView,
    UnifiedNewsfeedAPIView,
    VaccinationLogsAPIView,
)
from .views_staff_ops import (
    ForgotPasswordView,
    MedicalRecordDetailAPIView,
    PetRestoreAPIView,
    RefreshTokenView,
    ResetPasswordView,
    StaffSummaryAPIView,
    VaccinationLogDetailAPIView,
)
from .views_volunteers import (
    VolunteerApplicationAPIView,
    VolunteerApplicationDetailAPIView,
)

urlpatterns = [
    # Authentication & session
    path("register/", RegisterUserView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("session/", SessionView.as_view(), name="session"),
    path("profile/", ProfileAPIView.as_view(), name="profile"),
    path("auth/refresh/", RefreshTokenView.as_view(), name="auth-refresh"),
    path("auth/forgot-password/", ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="auth-reset-password"),

    # Staff operations summary & badges
    path("staff/summary/", StaffSummaryAPIView.as_view(), name="staff-summary"),

    # Adoption & volunteer applications
    path("pets/applications/", AdoptionApplicationAPIView.as_view(), name="adoption-applications-list-create"),
    path("pets/applications/<int:application_id>/", AdoptionApplicationDetailAPIView.as_view(), name="adoption-application-detail"),
    path("volunteers/", VolunteerApplicationAPIView.as_view(), name="volunteers-list-create"),
    path("volunteers/<int:application_id>/", VolunteerApplicationDetailAPIView.as_view(), name="volunteer-detail"),

    # Pet directory & trait search
    path("pets/", PetListAPIView.as_view(), name="pet-list"),
    path("pets/ai-search/", PetAISearchAPIView.as_view(), name="pet-ai-search"),
    path("pets/<str:pet_id>/restore/", PetRestoreAPIView.as_view(), name="pet-restore"),
    path("pets/<str:pet_id>/", PetDetailAPIView.as_view(), name="pet-detail"),

    # Medical & vaccination records
    path("medical/record/<int:record_id>/", MedicalRecordDetailAPIView.as_view(), name="medical-record-detail"),
    path("medical/log/", MedicalRecordsAPIView.as_view(), name="medical-log-slash"),
    path("medical/log", MedicalRecordsAPIView.as_view(), name="medical-log"),
    path("medical/<str:pet_id>/", MedicalRecordsAPIView.as_view(), name="medical-logs"),
    path("vaccinations/record/<int:log_id>/", VaccinationLogDetailAPIView.as_view(), name="vaccination-record-detail"),
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
