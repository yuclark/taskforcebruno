from django.urls import path
from .views import RegisterUserView, LoginView, PetDetailAPIView, PetListAPIView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('pets/', PetListAPIView.as_view(), name='pet-list'),
    path('pets/<str:pet_id>/', PetDetailAPIView.as_view(), name='pet-detail'),
]