import zlib
import base64
import requests
import os

def render_kroki(puml_code, out_png, out_puml):
    with open(out_puml, "w", encoding="utf-8") as f:
        f.write(puml_code)
    
    compressed = zlib.compress(puml_code.encode("utf-8"), 9)
    encoded = base64.urlsafe_b64encode(compressed).decode("ascii")
    png_url = f"https://kroki.io/plantuml/png/{encoded}"
    svg_url = f"https://kroki.io/plantuml/svg/{encoded}"
    
    resp = requests.get(png_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    if resp.status_code == 200:
        with open(out_png, "wb") as f:
            f.write(resp.content)
        print(f"Successfully rendered {out_png} ({len(resp.content)} bytes)")
        return svg_url
    else:
        print(f"Failed to render {out_png}: {resp.status_code} - {resp.text}")
        return None

# ==========================================
# 1. COLORFUL CLASS DIAGRAM
# ==========================================
class_puml = """@startuml
skinparam backgroundColor #F8FAFC
skinparam shadowing false
skinparam roundcorner 12
skinparam handwritten false
skinparam defaultFontName "Segoe UI"

skinparam class {
    BackgroundColor white
    ArrowColor #2563EB
    BorderColor #64748B
    BorderThickness 1.5
    FontSize 12
}

skinparam package {
    BackgroundColor #F1F5F9
    BorderColor #64748B
    BorderThickness 1.5
    FontColor #0F172A
    FontStyle bold
}

package "Frontend Presentation Layer (React 19 / Vite)" #EFF6FF {
    class AdoptionGalleryComponent <<React Component>> #DBEAFE {
        - selectedPet: Pet
        - isApplicationModalOpen: boolean
        - formData: AdoptionFormPayload
        - isSubmitting: boolean
        - submitSuccess: boolean
        --
        + handleOpenModal(pet: Pet): void
        + handleInputChange(field: string, val: any): void
        + handleSubmit(e: FormEvent): Promise<void>
        + renderQuestionnaireModal(): JSX.Element
    }

    class PendingApplicationsComponent <<React Component>> #DBEAFE {
        - applications: AdoptionApplication[]
        - selectedApp: AdoptionApplication
        - triageFilter: ApplicationStatus
        - isReviewModalOpen: boolean
        - isProcessing: boolean
        --
        + fetchPendingApplications(): Promise<void>
        + handleApprove(applicationId: string): Promise<void>
        + handleReject(applicationId: string, reason: string): Promise<void>
        + renderTriageTable(): JSX.Element
        + renderApplicantDossierModal(): JSX.Element
    }
}

package "Backend REST API Layer (Django REST Framework)" #ECFDF5 {
    class AdoptionApplicationAPIView <<APIView>> #D1FAE5 {
        + permission_classes: [IsAuthenticatedOrReadOnly]
        --
        + get(request: Request): Response
        + post(request: Request): Response
    }

    class AdoptionApplicationDetailAPIView <<APIView>> #D1FAE5 {
        + permission_classes: [IsMDCStaffOrAdmin]
        --
        + get(request: Request, pk: UUID): Response
        + patch(request: Request, pk: UUID): Response
    }

    class AdoptionApplicationSerializer <<ModelSerializer>> #FEF3C7 {
        + id: UUIDField
        + pet: PrimaryKeyRelatedField
        + applicant_name: CharField
        + applicant_email: EmailField
        + applicant_phone: CharField
        + housing_type: ChoiceField
        + has_secure_fence: BooleanField
        + pet_experience: CharField
        + application_status: ChoiceField
        --
        + validate_housing_type(value: str): str
        + validate_pet_availability(value: UUID): Pet
    }

    class AdoptionWorkflowService <<Service>> #FEF08A {
        + submit_application(payload: dict, user_id: UUID): AdoptionApplication
        + approve_application(app_id: UUID, staff_id: UUID): AdoptionApplication
        + reject_application(app_id: UUID, staff_id: UUID, reason: str): AdoptionApplication
        - send_status_notification(application: AdoptionApplication): void
        - broadcast_adoption_announcement(pet: Pet, applicant_name: str): void
    }
}

package "Persistence Layer (Supabase PostgreSQL / ORM)" #FAF5FF {
    class Pet <<Django Model>> #F3E8FF {
        + id: UUID [PK]
        + name: CharField
        + species: CharField
        + breed: CharField
        + age: CharField
        + gender: CharField
        + adoption_status: CharField
        + is_active: BooleanField
        + qr_code_id: CharField
        + photo_url: URLField
    }

    class AdoptionApplication <<Django Model>> #EDE9FE {
        + id: UUID [PK]
        + pet_id: ForeignKey
        + applicant_user_id: ForeignKey
        + applicant_name: CharField
        + applicant_email: EmailField
        + applicant_phone: CharField
        + housing_type: CharField
        + has_secure_fence: BooleanField
        + household_agreement: BooleanField
        + pet_care_budget: DecimalField
        + pet_experience: TextField
        + plan_if_moving: TextField
        + application_status: CharField
        + review_notes: TextField
        + reviewed_by: ForeignKey
        + reviewed_at: DateTimeField
        + created_at: DateTimeField
    }

    class CampusAnnouncement <<Django Model>> #FCE7F3 {
        + id: UUID [PK]
        + title: CharField
        + content: TextField
        + category: CharField
        + author_id: ForeignKey
        + is_pinned: BooleanField
        + created_at: DateTimeField
    }
}

AdoptionGalleryComponent ..[#2563EB]> AdoptionApplicationAPIView : "<color:#1D4ED8><b>HTTP POST /api/pets/applications/</b></color>"
PendingApplicationsComponent ..[#2563EB]> AdoptionApplicationDetailAPIView : "<color:#1D4ED8><b>HTTP PATCH /api/pets/applications/{id}/</b></color>"

AdoptionApplicationAPIView --[#059669]> AdoptionApplicationSerializer : "Deserializes payload"
AdoptionApplicationDetailAPIView --[#059669]> AdoptionApplicationSerializer : "Validates updates"
AdoptionApplicationAPIView --[#D97706]> AdoptionWorkflowService : "Delegates submission"
AdoptionApplicationDetailAPIView --[#D97706]> AdoptionWorkflowService : "Delegates triage"

AdoptionWorkflowService --[#7C3AED]> AdoptionApplication : "Creates & updates records"
AdoptionWorkflowService --[#7C3AED]> Pet : "Cascades status to 'Adopted'"
AdoptionWorkflowService --[#DB2777]> CampusAnnouncement : "Publishes milestone story"

AdoptionApplication "1" *--[#6366F1] "1" Pet : "references pet_id"
@enduml"""

# ==========================================
# 2. COLORFUL SEQUENCE DIAGRAM
# ==========================================
sequence_puml = """@startuml
autonumber
skinparam backgroundColor #F8FAFC
skinparam shadowing false
skinparam roundcorner 10
skinparam sequenceMessageAlign center
skinparam defaultFontName "Segoe UI"

skinparam sequence {
    ArrowColor #2563EB
    ArrowThickness 1.5
    LifeLineBorderColor #3B82F6
    LifeLineBackgroundColor #EFF6FF
    ParticipantBorderThickness 1.5
    ActorBorderThickness 1.5
    GroupBorderColor #64748B
    GroupBackgroundColor #F1F5F9
    GroupHeaderFontColor #0F172A
    DividerBackgroundColor #E2E8F0
    DividerFontColor #0F172A
    DividerBorderColor #94A3B8
}

actor "Campus Adopter" as Adopter #BFDBFE
actor "MDC Staff Officer" as Staff #FED7AA

participant "Vite/React Frontend\\n(AdoptionGallery & PendingApps)" as Frontend #DBEAFE
participant "Django REST API\\n(Adoption Views & Serializers)" as API #D1FAE5
participant "Adoption Workflow\\nService" as Service #FEF08A
participant "Supabase Database\\n(PostgreSQL ORM)" as DB #EDE9FE
participant "Notification Service\\n(Django Mail / SMTP)" as Mail #FCE7F3

== <color:#1E40AF><b>Phase 1: Application Submission & Validation</b></color> ==
Adopter -> Frontend: Browse pets in Adoption Gallery & click "Apply to Adopt"
activate Frontend #DBEAFE
Frontend --> Adopter: Render multi-step questionnaire modal
Adopter -> Frontend: Fill housing, fence, budget, moving plan & Submit
Frontend -> API: <color:#1D4ED8><b>POST /api/pets/applications/</b></color>\\n(pet_id, applicant_details, answers)
activate API #D1FAE5

API -> API: Validate request payload & CSRF/Auth token
alt <color:#DC2626><b>[Validation Failed] Invalid Form Data</b></color>
    API --> Frontend: <color:#DC2626>400 Bad Request (Validation errors)</color>
    Frontend --> Adopter: Highlight missing or invalid fields with error tooltips
else <color:#16A34A><b>[Validation Passed] Valid Form Data</b></color>
    API -> DB: Query pet status (id = pet_id)
    activate DB #EDE9FE
    DB --> API: Return Pet record (adoption_status = 'Available')
    deactivate DB
    
    API -> DB: <color:#7C3AED><b>INSERT INTO pet_adoption_application</b></color>\\n(pet_id, applicant_user_id, status='Pending', answers)
    activate DB #EDE9FE
    DB --> API: 201 Created (Application record & UUID)
    deactivate DB

    API --> Frontend: <color:#16A34A><b>201 Created JSON response</b></color>
    deactivate API
    Frontend --> Adopter: Display "Application Submitted! MDC will review." toast
end
deactivate Frontend

== <color:#C2410C><b>Phase 2: MDC Staff Review and Automated Approval Cascade</b></color> ==
Staff -> Frontend: Access Staff Portal -> "Pending Applications" queue
activate Frontend #DBEAFE
Frontend -> API: <color:#1D4ED8><b>GET /api/pets/applications/?status=Pending</b></color>
activate API #D1FAE5
API -> DB: SELECT * FROM pet_adoption_application WHERE status = 'Pending'
activate DB #EDE9FE
DB --> API: List of pending applications with Pet details
deactivate DB
API --> Frontend: 200 OK (Array of application dossiers)
deactivate API
Frontend --> Staff: Display triage table with applicant summaries & filters

Staff -> Frontend: Click "Review Dossier" for specific applicant
Frontend --> Staff: Open modal with living condition check & questions
Staff -> Frontend: Click "Approve Adoption" & enter review notes
Frontend -> API: <color:#1D4ED8><b>PATCH /api/pets/applications/{id}/</b></color>\\n{ action: "approve", notes: "Approved after home check" }
activate API #D1FAE5

API -> Service: <color:#B45309><b>approve_application(application_id, staff_id, notes)</b></color>
activate Service #FEF08A

group <color:#7C3AED><b>Database Atomic Transaction (ACID Guaranteed)</b></color>
    Service -> DB: <color:#7C3AED><b>BEGIN TRANSACTION</b></color>
    activate DB #EDE9FE
    Service -> DB: UPDATE pet_adoption_application\\nSET application_status = 'Approved',\\nreviewed_by = staff_id, reviewed_at = NOW()\\nWHERE id = application_id
    Service -> DB: UPDATE pet_pet\\nSET adoption_status = 'Adopted'\\nWHERE id = pet_id
    Service -> DB: INSERT INTO campus_announcement\\n(title="Happy Tails!", category="Adoption", pet_id=pet_id)
    Service -> DB: <color:#7C3AED><b>COMMIT TRANSACTION</b></color>
    deactivate DB
end

Service -> Mail: <color:#DB2777><b>send_adoption_congratulations_email(applicant_email, pet_name)</b></color>
activate Mail #FCE7F3
Mail --> Service: 200 SMTP Delivery Acknowledged
deactivate Mail

Service --> API: ApplicationApprovalResult(status="Approved", pet_status="Adopted")
deactivate Service

API --> Frontend: <color:#16A34A><b>200 OK JSON (Updated application & pet state)</b></color>
deactivate API

Frontend --> Staff: Update table row to "Approved", remove from triage queue
deactivate Frontend
@enduml"""

# ==========================================
# 3. COLORFUL ERD DIAGRAM
# ==========================================
erd_puml = """@startuml
skinparam backgroundColor #F8FAFC
skinparam shadowing false
skinparam roundcorner 10
skinparam defaultFontName "Segoe UI"

skinparam entity {
    BorderColor #64748B
    BorderThickness 1.5
    FontSize 12
    FontStyle bold
    HeaderBackgroundColor #E2E8F0
}

entity "pet_pet" as pets #F3E8FF {
    * id : uuid <<PK>>
    --
    * name : varchar(100)
    * species : varchar(50)
    breed : varchar(100)
    age : varchar(50)
    gender : varchar(20)
    * <color:#7C3AED>adoption_status : varchar(30)</color>
    is_active : boolean
    qr_code_id : varchar(50) <<UQ>>
    photo_url : varchar(500)
    description : text
    created_at : timestamptz
}

entity "auth_user" as users #DBEAFE {
    * id : uuid <<PK>>
    --
    * username : varchar(150) <<UQ>>
    * email : varchar(254)
    first_name : varchar(150)
    last_name : varchar(150)
    <color:#2563EB>is_staff : boolean</color>
    is_active : boolean
}

entity "pet_adoption_application" as applications #FEF3C7 {
    * id : uuid <<PK>>
    --
    * <color:#7C3AED>pet_id : uuid <<FK>></color>
    <color:#2563EB>applicant_user_id : uuid <<FK>></color>
    * applicant_name : varchar(150)
    * applicant_email : varchar(254)
    * applicant_phone : varchar(50)
    * housing_type : varchar(50)
    * has_secure_fence : boolean
    * household_agreement : boolean
    * pet_care_budget : numeric(10,2)
    * pet_experience : text
    * plan_if_moving : text
    * <color:#D97706>application_status : varchar(30)</color>
    review_notes : text
    <color:#2563EB>reviewed_by_id : uuid <<FK>></color>
    reviewed_at : timestamptz
    * created_at : timestamptz
}

entity "campus_announcement" as announcements #FCE7F3 {
    * id : uuid <<PK>>
    --
    * title : varchar(200)
    * content : text
    * <color:#DB2777>category : varchar(50)</color>
    <color:#7C3AED>pet_id : uuid <<FK>></color>
    <color:#2563EB>author_id : uuid <<FK>></color>
    is_pinned : boolean
    * created_at : timestamptz
}

entity "pet_medical_record" as medical #D1FAE5 {
    * id : uuid <<PK>>
    --
    * <color:#7C3AED>pet_id : uuid <<FK>></color>
    * record_type : varchar(50)
    description : text
    administered_date : date
    vet_clinic_name : varchar(150)
    created_at : timestamptz
}

pets ||--[#7C3AED]o{ applications : "pet_id\\n(receives apps)"
users ||--[#2563EB]o{ applications : "applicant_user_id\\n(submits)"
users ||--[#D97706]o{ applications : "reviewed_by_id\\n(triages)"
pets ||--[#059669]o{ medical : "pet_id\\n(health history)"
pets ||--[#DB2777]o{ announcements : "pet_id\\n(happy tails story)"
users ||--[#2563EB]o{ announcements : "author_id\\n(posts)"
@enduml"""

svg_class = render_kroki(class_puml, "docs/adoption_class_diagram_colorful.png", "docs/adoption_class_diagram_colorful.puml")
svg_seq = render_kroki(sequence_puml, "docs/adoption_sequence_diagram_colorful.png", "docs/adoption_sequence_diagram_colorful.puml")
svg_erd = render_kroki(erd_puml, "docs/adoption_erd_diagram_colorful.png", "docs/adoption_erd_diagram_colorful.puml")

print("All rendered!")
print("SVG Class:", svg_class)
print("SVG Seq:", svg_seq)
print("SVG ERD:", svg_erd)
