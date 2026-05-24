from django.urls import path
from .views import (
    RegisterUserView, LoginView, PetDetailAPIView, PetListAPIView,
    MedicalRecordsAPIView, VaccinationLogsAPIView, InventoryAPIView, 
    InventoryDetailAPIView, InventoryTransactionAPIView,
    AdoptionApplicationAPIView, AdoptionApplicationDetailAPIView 
)

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    
    # CRITICAL ORDER FIX: Place absolute sub-routes BEFORE generic parameter patterns
    path('pets/applications/', AdoptionApplicationAPIView.as_view(), name='adoption-applications-list-create'),
    path('pets/applications/<int:application_id>/', AdoptionApplicationDetailAPIView.as_view(), name='adoption-application-triage'),
    
    # Generic Pet routes
    path('pets/', PetListAPIView.as_view(), name='pet-list'),
    path('pets/<str:pet_id>/', PetDetailAPIView.as_view(), name='pet-detail'),
    
    # Supporting sub-logs
    path('medical/<str:pet_id>/', MedicalRecordsAPIView.as_view(), name='medical-logs'),
    path('vaccinations/<str:pet_id>/', VaccinationLogsAPIView.as_view(), name='vaccination-logs'),
    
    # Logistics Hub
    path('inventory/', InventoryAPIView.as_view(), name='inventory-list-create'),
    path('inventory/<int:item_id>/', InventoryDetailAPIView.as_view(), name='inventory-detail-mutate'),
    path('inventory/transactions/', InventoryTransactionAPIView.as_view(), name='inventory-ledger'),
]