from django.urls import path
from .views import (
    HealthCheckAPIView, RegisterUserView, LoginView, PetDetailAPIView, PetListAPIView,
    MedicalRecordsAPIView, VaccinationLogsAPIView, InventoryAPIView, 
    InventoryDetailAPIView, InventoryTransactionAPIView,
    AdoptionApplicationAPIView, AdoptionApplicationDetailAPIView,
    AnimalSightingAPIView, AnimalSightingDetailAPIView,
    CampusAnnouncementAPIView, UnifiedNewsfeedAPIView,
    ToggleLikeAPIView, AddCommentAPIView, CommentActionAPIView,
    NewsfeedItemActionAPIView  
)

urlpatterns = [
    # Core Security Gates
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    
    # Rehoming Application Pipelines
    path('pets/applications/', AdoptionApplicationAPIView.as_view(), name='adoption-applications-list-create'),
    path('pets/applications/<int:application_id>/', AdoptionApplicationDetailAPIView.as_view(), name='adoption-application-triage'),
    
    # Master Animal File Directories
    path('pets/', PetListAPIView.as_view(), name='pet-list'),
    path('pets/<str:pet_id>/', PetDetailAPIView.as_view(), name='pet-detail'), # Added trailing slash to match frontend hydration loops
    
    # Clinical Journals & Medical Timelines
    path('medical/<str:pet_id>/', MedicalRecordsAPIView.as_view(), name='medical-logs'),
    path('vaccinations/<str:pet_id>/', VaccinationLogsAPIView.as_view(), name='vaccination-logs'),
    
    # Warehouse Supply Hub Inventory Nodes
    path('inventory/', InventoryAPIView.as_view(), name='inventory-list-create'),
    path('inventory/<int:item_id>/', InventoryDetailAPIView.as_view(), name='inventory-detail-mutate'),
    path('inventory/transactions/', InventoryTransactionAPIView.as_view(), name='inventory-ledger'),
    
    # Telemetry Sightings Streams & Bulletins
    path('sightings/', AnimalSightingAPIView.as_view(), name='sightings-list-create'),
    path('sightings/<int:sighting_id>/', AnimalSightingDetailAPIView.as_view(), name='sighting-triage-mutate'),
    path('announcements/', CampusAnnouncementAPIView.as_view(), name='announcements-list-create'),
    
    # Consolidated Activity Stream & Social Actions
    path('newsfeed/', UnifiedNewsfeedAPIView.as_view(), name='unified-newsfeed-stream'),
    path('newsfeed/like/', ToggleLikeAPIView.as_view(), name='feed-toggle-like'),
    path('newsfeed/comment/', AddCommentAPIView.as_view(), name='feed-add-comment'),
    path('newsfeed/comment/action/', CommentActionAPIView.as_view(), name='feed-comment-action'),
    path('newsfeed/action/', NewsfeedItemActionAPIView.as_view(), name='newsfeed-item-action'),
    
    # Keep-Alive Health Monitoring Telemetry Node
    path('health/', HealthCheckAPIView.as_view(), name='health-check'),
]