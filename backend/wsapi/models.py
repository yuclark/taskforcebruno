from django.db import models

class Pet(models.Model):
    # Your existing Pet model fields are here...
    pass

class AdoptionApplication(models.Model):
    application_id = models.BigAutoField(primary_key=True)
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, db_column='pet_id')
    full_name = models.CharField(max_length=150)
    contact_number = models.CharField(max_length=30)
    address = models.TextField()
    experience_level = models.CharField(max_length=50)
    housing_type = models.CharField(max_length=50)
    has_secure_fence = models.BooleanField(default=False)
    household_agreement = models.BooleanField(default=False)
    pet_care_budget = models.CharField(max_length=50)
    plan_if_moving = models.TextField()
    application_status = models.CharField(max_length=30, default='Pending')
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'adoption_applications'  
        managed = False  