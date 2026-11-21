from django.db import models


class Pet(models.Model):
    pet_id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=120)
    species = models.CharField(max_length=30)
    pet_type = models.CharField(max_length=40, default="Campus Pet")
    breed = models.CharField(max_length=100, blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    age = models.CharField(max_length=50, blank=True, null=True)
    weight = models.CharField(max_length=30, blank=True, null=True)
    size = models.CharField(max_length=20, blank=True, null=True)
    vaccination_status = models.CharField(max_length=50, default="Not Vaccinated")
    spayed_neutered = models.BooleanField(default=False)
    adoption_status = models.CharField(max_length=40, default="Campus Pet")
    found_near = models.CharField(max_length=150, blank=True, null=True)
    rescue_date = models.DateField(blank=True, null=True)
    current_conditions = models.TextField(blank=True, null=True)
    behavior_notes = models.TextField(blank=True, null=True)
    about_text = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    primary_image = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=60, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "pets"
        managed = False


class AdoptionApplication(models.Model):
    application_id = models.BigAutoField(primary_key=True)
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, db_column="pet_id")
    full_name = models.CharField(max_length=150)
    email = models.EmailField(max_length=150)
    contact_number = models.CharField(max_length=30)
    address = models.TextField()
    experience_level = models.CharField(max_length=50)
    housing_type = models.CharField(max_length=50)
    has_secure_fence = models.BooleanField(default=False)
    household_agreement = models.BooleanField(default=False)
    pet_care_budget = models.CharField(max_length=50)
    plan_if_moving = models.TextField()
    application_status = models.CharField(max_length=30, default="Pending")
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "adoption_applications"
        managed = False
