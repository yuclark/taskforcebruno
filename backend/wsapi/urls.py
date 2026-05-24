from django.urls import path
from .views import (
    RegisterUserView, LoginView, PetDetailAPIView, PetListAPIView,
    MedicalRecordsAPIView, VaccinationLogsAPIView, InventoryAPIView, 
    InventoryDetailAPIView, InventoryTransactionAPIView,
    AdoptionApplicationAPIView, AdoptionApplicationDetailAPIView,
    AnimalSightingAPIView, AnimalSightingDetailAPIView
)

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    
    path('pets/applications/', AdoptionApplicationAPIView.as_view(), name='adoption-applications-list-create'),
    path('pets/applications/<int:application_id>/', AdoptionApplicationDetailAPIView.as_view(), name='adoption-application-triage'),
    
    path('pets/', PetListAPIView.as_view(), name='pet-list'),
    path('pets/<str:pet_id>/', PetDetailAPIView.as_view(), name='pet-detail'),
    
    path('medical/<str:pet_id>/', MedicalRecordsAPIView.as_view(), name='medical-logs'),
    path('vaccinations/<str:pet_id>/', VaccinationLogsAPIView.as_view(), name='vaccination-logs'),
    
    path('inventory/', InventoryAPIView.as_view(), name='inventory-list-create'),
    path('inventory/<int:item_id>/', InventoryDetailAPIView.as_view(), name='inventory-detail-mutate'),
    path('inventory/transactions/', InventoryTransactionAPIView.as_view(), name='inventory-ledger'),
    
    path('sightings/', AnimalSightingAPIView.as_view(), name='sightings-list-create'),
    path('sightings/<int:sighting_id>/', AnimalSightingDetailAPIView.as_view(), name='sighting-triage-mutate'),
]