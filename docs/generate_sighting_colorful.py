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
# 1. COLORFUL CLASS DIAGRAM (MODULE 3.2)
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
    class ReportSightingViewComponent <<React Component>> #DBEAFE {
        - campusZones: string[]
        - selectedZone: string
        - animalType: string
        - locationDetails: string
        - distinctFeatures: string
        - isEmergency: boolean
        - photoFile: File
        - isSubmitting: boolean
        --
        + handleZoneSelect(zone: string): void
        + handlePhotoAttachment(e: ChangeEvent): void
        + handleSubmitReport(e: FormEvent): Promise<void>
        + renderLandmarkDropdown(): JSX.Element
    }

    class SightingTriageComponent <<React Component>> #DBEAFE {
        - reports: SightingReport[]
        - activeFilter: string
        - triageModal: TriageModalState
        - loading: boolean
        --
        + fetchActiveReports(): Promise<void>
        + handleStatusMutation(sightingId: number, status: string): Promise<void>
        + handle1ClickIntakeHandoff(report: SightingReport): void
        + renderTelemetryGrid(): JSX.Element
        + renderEmergencyBanners(): JSX.Element
    }

    class AddNewPetIntakeBridge <<React Form Consumer>> #DBEAFE {
        - preloadedSightingData: StrayHandoff
        - isStrayMode: boolean
        --
        + hydrateFromSightingSession(): void
        + finalizeIntakeRegistration(e: FormEvent): Promise<void>
    }
}

package "Backend REST API Layer (Django REST Framework)" #ECFDF5 {
    class AnimalSightingAPIView <<APIView>> #D1FAE5 {
        + parser_classes: [MultiPartParser, FormParser]
        + permission_classes: [AllowAny]
        --
        + get(request: Request): Response
        + post(request: Request): Response
    }

    class AnimalSightingDetailAPIView <<APIView>> #D1FAE5 {
        + permission_classes: [IsMDCStaffOrAdmin]
        --
        + put(request: Request, sighting_id: int): Response
    }

    class SightingTelemetryHandler <<Python Module / Service>> #FEF08A {
        + validate_sighting_payload(data: dict): dict
        + prepend_emergency_sentinel(features: str, is_urgent: bool): str
        + stream_sighting_photo(file: UploadedFile): str
        + transition_triage_state(sighting_id: int, new_status: str): dict
        + export_to_intake_contract(sighting_id: int): dict
    }
}

package "Persistence Layer (Supabase PostgreSQL & Storage)" #FAF5FF {
    class AnimalSighting <<Database Table / Schema>> #EDE9FE {
        + sighting_id: Serial [PK]
        + animal_type: Varchar(50)
        + location_details: Varchar(200)
        + distinct_features: Text
        + status: Varchar(50)
        + reporter_email: Varchar(254)
        + image_url: Varchar(500)
        + converted_pet_id: Varchar(50) [FK -> pets.pet_id]
        + logged_at: TimestampTz
    }

    class Pet <<Database Table / Schema>> #F3E8FF {
        + pet_id: Varchar(50) [PK]
        + name: Varchar(100)
        + species: Varchar(50)
        + adoption_status: Varchar(50)
        + found_near: Varchar(150)
        + description: Text
        + primary_image: Varchar(500)
        + created_at: TimestampTz
    }

    class SupabaseSightingsBucket <<Supabase Storage>> #FCE7F3 {
        + bucket_name: "sightings"
        + partition: "/sighting_{uuid}.{ext}"
        + public_cdn_url: HTTPS URL
    }
}

ReportSightingViewComponent ..[#2563EB]> AnimalSightingAPIView : "<color:#1D4ED8><b>HTTP POST /api/sightings/ (multipart)</b></color>"
SightingTriageComponent ..[#2563EB]> AnimalSightingAPIView : "<color:#1D4ED8><b>HTTP GET /api/sightings/</b></color>"
SightingTriageComponent ..[#2563EB]> AnimalSightingDetailAPIView : "<color:#1D4ED8><b>HTTP PUT /api/sightings/{id}/</b></color>"
SightingTriageComponent ..[#2563EB]> AddNewPetIntakeBridge : "1-Click Intake Hand-off (sessionStorage)"

AnimalSightingAPIView --[#D97706]> SightingTelemetryHandler : "Delegates payload parsing"
AnimalSightingDetailAPIView --[#D97706]> SightingTelemetryHandler : "Delegates status update"

SightingTelemetryHandler --[#DB2777]> SupabaseSightingsBucket : "Stores photo binary"
SightingTelemetryHandler --[#7C3AED]> AnimalSighting : "Inserts telemetry row (status='Pending')"
SightingTelemetryHandler --[#7C3AED]> AnimalSighting : "Updates status ('Investigated', 'Resolved')"

AddNewPetIntakeBridge --[#059669]> Pet : "Creates official admitted Pet row"
AnimalSighting "0..1" --[#6366F1] "1" Pet : "converted_pet_id (origin traceability)"
@enduml"""

# ==========================================
# 2. COLORFUL SEQUENCE DIAGRAM (MODULE 3.2)
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

actor "Campus Student / Reporter" as Reporter #BFDBFE
actor "MDC Welfare Officer" as Staff #FED7AA

participant "Vite/React Frontend\\n(ReportSightingView)" as ReportUI #DBEAFE
participant "Vite/React Frontend\\n(SightingTriage & AddNewPet)" as TriageUI #DBEAFE
participant "Django REST API\\n(Sightings Endpoints)" as API #D1FAE5
participant "Sighting Telemetry\\nHandler" as Handler #FEF08A
participant "Supabase Storage\\n('sightings' Bucket)" as Storage #FCE7F3
participant "Supabase PostgreSQL\\n(animal_sightings & pets)" as DB #EDE9FE

== <color:#1E40AF><b>Phase 1: Landmark-Assisted Sighting Telemetry Submission</b></color> ==
Reporter -> ReportUI: Open "Report Stray" on mobile web
activate ReportUI #DBEAFE
ReportUI --> Reporter: Display structured CIT-U landmark selector
Reporter -> ReportUI: Select Zone: "[NGE Building 1st Floor]", Animal: "Dog"
Reporter -> ReportUI: Toggle "🚨 Urgent Emergency (Limping/Injured)", Attach Photo
Reporter -> ReportUI: Click "Submit Telemetry Report"

ReportUI -> API: <color:#1D4ED8><b>POST /api/sightings/</b></color>\\n(Multipart: landmark, animal_type, features, image)
activate API #D1FAE5

API -> Handler: <color:#B45309><b>process_sighting_intake(request.data, request.FILES)</b></color>
activate Handler #FEF08A

Handler -> Storage: <color:#DB2777><b>upload("sighting_UUID.jpg", binary_data)</b></color>
activate Storage #FCE7F3
Storage --> Handler: 200 OK (Uploaded to Supabase CDN)
deactivate Storage

Handler -> Handler: Prepend location "[NGE Building]" & emergency sentinel "[🚨 URGENT EMERGENCY]"

group <color:#7C3AED><b>Supabase Telemetry Persist</b></color>
    Handler -> DB: <color:#7C3AED><b>INSERT INTO animal_sightings</b></color>\\n(location="[NGE Building 1st Floor]", status="Pending",\\nfeatures="[🚨 URGENT EMERGENCY] Limping", image_url=CDN_URL)
    activate DB #EDE9FE
    DB --> Handler: 201 Created (Sighting Record #42)
    deactivate DB
end

Handler --> API: SightingCreationResult(sighting_id=42, status="Pending")
deactivate Handler

API --> ReportUI: <color:#16A34A><b>201 Created JSON (Case #42 Logged)</b></color>
deactivate API

ReportUI --> Reporter: Display "Emergency Sighting Broadcasted to MDC Dispatch" toast
deactivate ReportUI

== <color:#C2410C><b>Phase 2: Administrative Triage & Verification</b></color> ==
Staff -> TriageUI: Open Staff Portal -> "Sighting Reports" Triage Center
activate TriageUI #DBEAFE
TriageUI -> API: <color:#1D4ED8><b>GET /api/sightings/</b></color>
activate API #D1FAE5
API -> DB: SELECT * FROM animal_sightings ORDER BY logged_at DESC
activate DB #EDE9FE
DB --> API: Return telemetry list (Case #42 flagged in RED at top)
deactivate DB
API --> TriageUI: 200 OK JSON
deactivate API

TriageUI --> Staff: Render Case #42 with glowing RED Emergency Badge & landmark card
Staff -> TriageUI: Dispatch patrol & click "Mark as Investigated"
TriageUI -> API: <color:#1D4ED8><b>PUT /api/sightings/42/</b></color> { status: "Investigated" }
activate API #D1FAE5
API -> DB: UPDATE animal_sightings SET status = 'Investigated' WHERE sighting_id = 42
activate DB #EDE9FE
DB --> API: 200 OK (Updated row)
deactivate DB
API --> TriageUI: 200 OK JSON (Status: Investigated)
deactivate API
TriageUI --> Staff: Update status pill to Blue 'Investigated'
deactivate TriageUI

== <color:#059669><b>Phase 3: Seamless 1-Click Sighting-to-Intake Hand-off</b></color> ==
Staff -> TriageUI: Animal rescued! Click "Admit & Intake Stray" on Case #42
activate TriageUI #DBEAFE

TriageUI -> TriageUI: Package handoff payload into sessionStorage:\\n{ found_near: "[NGE Building 1st Floor]", species: "Dog",\\ndescription: "Limping stray", sighting_id: 42 }
TriageUI -> TriageUI: Route navigation to "Add New Pet" intake view
TriageUI --> Staff: Auto-populate AddNewPet form with auto-generated ID "STRAY-4289",\\npre-filled landmark origin, and initial medical diagnosis

Staff -> TriageUI: Confirm biometrics & click "Register Companion"
TriageUI -> API: <color:#1D4ED8><b>POST /api/pets/</b></color> (Finalized pet profile)
activate API #D1FAE5
API -> DB: INSERT INTO pets (pet_id="STRAY-4289", name="Stray Dog #4", found_near="[NGE Building]")
activate DB #EDE9FE
DB --> API: 201 Created
deactivate DB
API --> TriageUI: 201 Created
deactivate API

TriageUI -> API: <color:#1D4ED8><b>PUT /api/sightings/42/</b></color> { status: "Resolved" }
activate API #D1FAE5
API -> DB: UPDATE animal_sightings SET status = 'Resolved', converted_pet_id = 'STRAY-4289' WHERE sighting_id = 42
activate DB #EDE9FE
DB --> API: 200 OK
deactivate DB
API --> TriageUI: 200 OK JSON
deactivate API

TriageUI --> Staff: Display "Stray admitted to official Wildcat Registry. Telemetry resolved!"
deactivate TriageUI
@enduml"""

# ==========================================
# 3. COLORFUL ERD DATA DESIGN (MODULE 3.2)
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

entity "animal_sightings" as sightings #EDE9FE {
    * sighting_id : serial <<PK>>
    --
    * animal_type : varchar(50)
    * <color:#7C3AED>location_details : varchar(200)</color>
    distinct_features : text
    * <color:#D97706>status : varchar(50)</color>
    * reporter_email : varchar(254)
    image_url : varchar(500)
    <color:#2563EB>converted_pet_id : varchar(50) <<FK -> pets.pet_id>></color>
    * logged_at : timestamptz
}

entity "pets" as pets #F3E8FF {
    * pet_id : varchar(50) <<PK>>
    --
    * name : varchar(100)
    * species : varchar(50)
    pet_type : varchar(50)
    breed : varchar(100)
    gender : varchar(20)
    age : varchar(50)
    weight : varchar(50)
    * <color:#7C3AED>adoption_status : varchar(50)</color>
    * <color:#7C3AED>found_near : varchar(150)</color>
    rescue_date : date
    current_conditions : text
    primary_image : varchar(500)
    created_at : timestamptz
}

entity "auth_user" as users #DBEAFE {
    * id : uuid <<PK>>
    --
    * email : varchar(254) <<UQ>>
    username : varchar(150)
    <color:#2563EB>is_staff : boolean</color>
    is_active : boolean
}

entity "campus_announcements" as announcements #FCE7F3 {
    * announcement_id : serial <<PK>>
    --
    * title : varchar(200)
    * content : text
    author_email : varchar(254)
    image_url : varchar(500)
    created_at : timestamptz
}

users ||--[#2563EB]o{ sightings : "reporter_email\\n(submits telemetry)"
sightings ||--[#D97706]o| pets : "converted_pet_id\\n(1-click intake linkage)"
users ||--[#2563EB]o{ pets : "admitted_by\\n(triages and rescues)"
sightings ||--[#DB2777]o{ announcements : "sighting_id\\n(urgent broadcast alert)"
@enduml"""

svg_class = render_kroki(class_puml, "docs/sighting_class_diagram_colorful.png", "docs/sighting_class_diagram_colorful.puml")
svg_seq = render_kroki(sequence_puml, "docs/sighting_sequence_diagram_colorful.png", "docs/sighting_sequence_diagram_colorful.puml")
svg_erd = render_kroki(erd_puml, "docs/sighting_erd_diagram_colorful.png", "docs/sighting_erd_diagram_colorful.puml")

print("All Module 3.2 diagrams rendered!")
print("SVG Class:", svg_class)
print("SVG Seq:", svg_seq)
print("SVG ERD:", svg_erd)
