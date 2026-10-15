import base64
import zlib
import urllib.request

# =====================================================================
# 1. ADOPTION CLASS DIAGRAM (Module 2.1)
# =====================================================================
adoption_class_puml = """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam classFontSize 12
skinparam classAttributeFontSize 11
skinparam ArrowColor #334155
skinparam ArrowThickness 1.3

class User <<Supabase Auth / Profiles>> #EFF6FF {
    +UUID id
    +String user_id
    +String full_name
    +String email
    +String role
    +login() : SessionToken
    +logout() : void
}

class ProspectiveAdopter <<Client Role>> #F0FDF4 {
    +String housing_type
    +String contact_number
    +Boolean has_secure_fence
    +Boolean household_agreement
    +String pet_care_budget
    +browsePets() : void
    +submitApplication(pet_id, formData) : void
    +trackApplicationStatus() : void
}

class ShelterStaff <<Staff Role>> #FEF2F2 {
    +String employee_id
    +String department
    +reviewApplication(application_id) : void
    +updateApplicationStatus(id, status) : void
    +publishAdoptionAnnouncement() : void
}

class AdoptionGallery <<React UI Component>> #F5F3FF {
    -Array availablePets
    -Object filterCriteria
    -Boolean modalOpen
    +filterBySpecies(species) : void
    +openApplicationModal(pet) : void
    +handleFormSubmit(e) : void
    +render() : JSX
}

class PendingApplications <<React Admin Table>> #FFFBEB {
    -Array applicationsList
    -String filterStatus
    -Boolean isProcessing
    +fetchPendingApplications() : void
    +handleApprove(applicationId, petId) : void
    +handleDeny(applicationId) : void
    +renderTriageGrid() : JSX
}

class AdoptionApplicationAPIView <<Django REST Framework>> #EEF2FF {
    +get(request) : Response
    +post(request) : Response
    -validate_application_payload(data) : dict
}

class AdoptionApplicationDetailAPIView <<Django REST Framework>> #EEF2FF {
    +patch(request, application_id) : Response
    -transition_application_state(id, status) : void
    -sync_pet_adopted_status(pet_id) : void
    -trigger_celebration_announcement(pet_id) : void
}

class AdoptionNotificationMailer <<Django Core Mail / SMTP>> #ECFDF5 {
    +send_approval_email(adopter_email, pet_name) : void
    +send_denial_email(adopter_email, pet_name) : void
}

class AdoptionApplication <<Supabase Entity>> #FFF1F2 {
    +BigInt application_id <<PK>>
    +String pet_id <<FK>>
    +UUID applicant_id <<FK>>
    +String full_name
    +String contact_number
    +String email
    +Text residential_address
    +String experience_level
    +String housing_type
    +Boolean has_secure_fence
    +Boolean household_agreement
    +String pet_care_budget
    +Text plan_if_moving
    +String application_status
    +DateTime submitted_at
}

class Pet <<Supabase Entity>> #F0FDF4 {
    +String pet_id <<PK>>
    +String name
    +String species
    +String breed
    +String adoption_status
    +getProfile() : dict
    +updateStatus(new_status) : void
}

' Inheritance & Role Specialization
User <|-- ProspectiveAdopter
User <|-- ShelterStaff

' UI Navigation & Interactions
ProspectiveAdopter --> AdoptionGallery : Interacts with Catalog
ShelterStaff --> PendingApplications : Operates Triage Queue

AdoptionGallery ..> AdoptionApplicationAPIView : HTTP POST /api/pets/applications/
PendingApplications ..> AdoptionApplicationDetailAPIView : HTTP PATCH /api/pets/applications/{id}/

' Backend Service Flow
AdoptionApplicationAPIView ..> AdoptionApplication : Inserts (Status = 'Pending')
AdoptionApplicationDetailAPIView ..> AdoptionApplication : Updates Status (Approved / Denied)
AdoptionApplicationDetailAPIView ..> Pet : Sets Status = 'Adopted'
AdoptionApplicationDetailAPIView ..> AdoptionNotificationMailer : Dispatches Status Alert

AdoptionApplication "0..*" --> "1" Pet : For Companion
AdoptionApplication "0..*" --> "1" User : Submitted By

@enduml"""

# =====================================================================
# 2. ADOPTION SEQUENCE DIAGRAM (Module 2.1)
# =====================================================================
adoption_seq_puml = """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #334155
skinparam ArrowThickness 1.3

actor "Prospective Adopter\\n(Student / Faculty)" as adopter #800000
participant "AdoptionGallery\\n(React UI)" as gallery #F5F3FF
participant "AdoptionApplicationAPIView\\n(Django REST Framework)" as submit_api #EEF2FF
participant "PendingApplications\\n(React Admin)" as admin_grid #FFFBEB
participant "AdoptionApplicationDetailAPIView\\n(Django REST Framework)" as detail_api #EEF2FF
participant "AdoptionNotificationMailer\\n(Django SMTP)" as mailer #ECFDF5
database "Supabase PostgreSQL\\n(Database)" as db #059669
actor "Shelter Staff / MDC\\n(Evaluator)" as staff #1E3A8A

autonumber 1 "<b>(#)</b>"

== Phase 1: Application Submission Pipeline ==
adopter -> gallery : Browses available pets & clicks "Adopt this Pet"
activate gallery
gallery --> adopter : Renders Multi-Stage Adoption Questionnaire Modal
adopter -> gallery : Fills form (housing, yard fence, care budget, plan if moving) & submits
gallery -> submit_api : POST /api/pets/applications/ {applicant_id, pet_id, ...}
activate submit_api

submit_api -> db : INSERT INTO adoption_applications (status='Pending')
activate db
db --> submit_api : Return created application record (application_id)
deactivate db

submit_api -> db : UPDATE pets SET adoption_status = 'Pending' WHERE pet_id = id
activate db
db --> submit_api : Acknowledge pet availability state mutation
deactivate db

submit_api --> gallery : 201 Created {application_id, status: 'Pending'}
deactivate submit_api
gallery --> adopter : Displays submission confirmation toast & tracking ref
deactivate gallery

== Phase 2: Administrative Review & State Transition ==
staff -> admin_grid : Opens Shelter Admin Portal (Pending Review tab)
activate admin_grid
admin_grid -> detail_api : GET /api/pets/applications/?status=Pending
activate detail_api
detail_api -> db : SELECT * FROM adoption_applications JOIN pets ...
activate db
db --> detail_api : Return populated application rows
deactivate db
detail_api --> admin_grid : 200 OK (List of pending applications)
deactivate detail_api
admin_grid --> staff : Displays candidate dossier (housing, fence, budget)

staff -> admin_grid : Reviews suitability & clicks "Approve Application"
admin_grid -> detail_api : PATCH /api/pets/applications/{id}/ {status: 'Approved'}
activate detail_api

detail_api -> db : UPDATE adoption_applications SET application_status = 'Approved'
activate db
db --> detail_api : Confirm application state updated
deactivate db

detail_api -> db : UPDATE pets SET adoption_status = 'Adopted' WHERE pet_id = id
activate db
db --> detail_api : Companion record permanently locked to 'Adopted'
deactivate db

detail_api -> db : INSERT INTO campus_announcements (category='Adoption Milestone')
activate db
db --> detail_api : Public celebration bulletin published
deactivate db

detail_api -> mailer : trigger_adoption_status_email(applicant_email, 'Approved')
activate mailer
mailer -> adopter : Sends automated congratulatory adoption email [SMTP]
deactivate mailer

detail_api --> admin_grid : 200 OK (State Transition Complete)
deactivate detail_api
admin_grid --> staff : Displays success toast & removes row from triage queue
deactivate admin_grid

@enduml"""

# =====================================================================
# 3. ADOPTION ERD / DATA DESIGN DIAGRAM (Module 2.1)
# =====================================================================
adoption_erd_puml = """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam linetype ortho
skinparam ArrowColor #334155
skinparam ArrowThickness 1.3

skinparam class {
    BackgroundColor #F8FAFC
    BorderColor #64748B
    HeaderBackgroundColor #E2E8F0
}

entity "profiles (USERS)" as users #EFF6FF {
    * id : uuid <<PK, FK auth.users>>
    --
    * user_id : varchar(20) <<CIT-U ID>>
    * first_name : varchar(100)
    * last_name : varchar(100)
    * email : varchar(150) <<@cit.edu>>
    contact_number : varchar(30)
    role : varchar(30) <<STUDENT, FACULTY, MDC_STAFF>>
    is_staff : boolean
    created_at : timestamptz
}

entity "pets" as pets #F0FDF4 {
    * pet_id : varchar(50) <<PK>>
    --
    * name : varchar(100)
    species : varchar(30) <<Cat, Dog>>
    breed : varchar(50)
    gender : varchar(10)
    age : varchar(30)
    adoption_status : varchar(30) <<Available, Pending, Adopted>>
    vaccination_status : varchar(30)
    primary_image : text
    qr_collar_tag_code : varchar(50)
    behavior_notes : text
    about_text : text
}

entity "adoption_applications" as applications #FFF1F2 {
    * application_id : bigint <<PK, identity>>
    --
    * pet_id : varchar(50) <<FK pets.pet_id>>
    applicant_id : uuid <<FK profiles.id>>
    full_name : varchar(150)
    contact_number : varchar(30)
    email : varchar(150)
    residential_address : text
    experience_level : varchar(50)
    housing_type : varchar(50) <<Apartment, Own House, Dorm>>
    has_secure_fence : boolean
    household_agreement : boolean
    pet_care_budget : varchar(50)
    plan_if_moving : text
    application_status : varchar(30) <<Pending, Approved, Denied>>
    submitted_at : timestamptz
    reviewed_by : uuid <<FK profiles.id>>
    reviewed_at : timestamptz
}

entity "pet_images" as images #FDF2F8 {
    * image_id : bigint <<PK, identity>>
    --
    * pet_id : varchar(50) <<FK pets.pet_id>>
    image_url : text
    is_primary : boolean
    uploaded_at : timestamptz
}

entity "campus_announcements" as bulletins #FFFBEB {
    * announcement_id : bigint <<PK, identity>>
    --
    title : varchar(200) <<Happy Rehoming!>>
    content : text
    category : varchar(50) <<Adoption Milestone>>
    image_url : text
    author_id : uuid <<FK profiles.id>>
    created_at : timestamptz
}

' Entity Relationships
users ||--o{ applications : "submits (1:N)"
pets ||--o{ applications : "receives (1:N)"
pets ||--o{ images : "has (1:N)"
users ||--o{ applications : "evaluates / reviews (1:N)"
pets ||--o| bulletins : "celebrated in (1:1)"

@enduml"""

def fetch_kroki(puml, png_dest, puml_dest):
    with open(puml_dest, "w", encoding="utf-8") as f:
        f.write(puml)
    compressed = zlib.compress(puml.encode("utf-8"), 9)
    encoded = base64.urlsafe_b64encode(compressed).decode("ascii")
    url = f"https://kroki.io/plantuml/png/{encoded}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
            with open(png_dest, "wb") as f:
                f.write(data)
        print(f"Generated {png_dest}, size: {len(data)}")
        return f"https://kroki.io/plantuml/svg/{encoded}", url
    except urllib.error.HTTPError as e:
        print(f"Error for {png_dest}: {e.code}")
        print(e.read().decode("utf-8"))
        return None, None

svg_class, _ = fetch_kroki(adoption_class_puml, "docs/adoption_class_diagram.png", "docs/adoption_class_diagram.puml")
svg_seq, _ = fetch_kroki(adoption_seq_puml, "docs/adoption_sequence_diagram.png", "docs/adoption_sequence_diagram.puml")
svg_erd, _ = fetch_kroki(adoption_erd_puml, "docs/adoption_erd_diagram.png", "docs/adoption_erd_diagram.puml")

print("Adoption Class SVG:", svg_class)
print("Adoption Seq SVG:", svg_seq)
print("Adoption ERD SVG:", svg_erd)
