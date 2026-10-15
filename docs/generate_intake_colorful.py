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
# 1. COLORFUL CLASS DIAGRAM (MODULE 1.3)
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
    class AddNewPetComponent <<React Component>> #DBEAFE {
        - newPetForm: PetRegistrationState
        - isStrayMode: boolean
        - imageFile: File
        - imagePreviewUrl: string
        - submitting: boolean
        --
        + handleCreateChange(e: ChangeEvent): void
        + handleFileChange(e: ChangeEvent): void
        + calculateSizeCategory(weight: string): string
        + handleCreateSubmit(e: FormEvent): Promise<void>
        + renderIntakeForm(): JSX.Element
    }

    class PetListingsComponent <<React Component>> #DBEAFE {
        - pets: Pet[]
        - searchFilter: string
        - statusFilter: string
        - selectedPetForTag: Pet
        --
        + fetchPetListings(): Promise<void>
        + handleStatusFilter(status: string): void
        + openTagGeneratorModal(pet: Pet): void
        + renderPetDirectoryGrid(): JSX.Element
    }

    class CollarTagGeneratorComponent <<React Utility / Modal>> #DBEAFE {
        - petId: string
        - petName: string
        - qrMatrixCanvas: HTMLCanvasElement
        --
        + generatePrintableMatrix(petId: string): void
        + exportThermalPrintPDF(): void
        + renderPreviewModal(): JSX.Element
    }
}

package "Backend REST API Layer (Django REST Framework)" #ECFDF5 {
    class PetListAPIView <<APIView>> #D1FAE5 {
        + parser_classes: [MultiPartParser, FormParser]
        + permission_classes: [IsMDCStaffOrAdmin]
        --
        + get(request: Request): Response
        + post(request: Request): Response
    }

    class PetDetailAPIView <<APIView>> #D1FAE5 {
        + permission_classes: [IsAuthenticatedOrReadOnly]
        --
        + get(request: Request, pet_id: str): Response
        + put(request: Request, pet_id: str): Response
        + delete(request: Request, pet_id: str): Response
    }

    class PetAISearchAPIView <<APIView>> #D1FAE5 {
        + permission_classes: [AllowAny]
        --
        + post(request: Request): Response
        - parse_negations(raw_query: str): set
        - normalize_synonyms(tokens: list): list
        - rank_trait_matches(candidates: list): list
    }

    class PetIntakeStorageHandler <<Python Module / Service>> #FEF08A {
        + validate_image_payload(file: UploadedFile): boolean
        + generate_storage_key(pet_id: str, ext: str): str
        + stream_to_supabase_bucket(file_data: bytes, key: str): str
        + scrub_orphaned_assets(pet_id: str): void
    }
}

package "Persistence Layer (Supabase PostgreSQL & Cloud Storage)" #FAF5FF {
    class Pet <<Database Table / Schema>> #F3E8FF {
        + pet_id: Varchar(50) [PK]
        + name: Varchar(100)
        + species: Varchar(50)
        + pet_type: Varchar(50)
        + breed: Varchar(100)
        + gender: Varchar(20)
        + age: Varchar(50)
        + weight: Varchar(50)
        + size: Varchar(20)
        + vaccination_status: Varchar(50)
        + spayed_neutered: Boolean
        + adoption_status: Varchar(50)
        + found_near: Varchar(150)
        + rescue_date: Date
        + current_conditions: Text
        + behavior_notes: Text
        + about_text: Text
        + primary_image: Varchar(500)
        + created_at: TimestampTz
    }

    class PetImage <<Database Table / Schema>> #EDE9FE {
        + id: Serial [PK]
        + pet_id: Varchar(50) [FK -> pets.pet_id]
        + image_url: Varchar(500)
        + is_primary: Boolean
        + uploaded_at: TimestampTz
    }

    class SupabaseStorageBucket <<Supabase Storage>> #FCE7F3 {
        + bucket_name: "petpictures"
        + partition: "/pet_{uuid}.{ext}"
        + public_url_access: HTTPS CDN
    }
}

AddNewPetComponent ..[#2563EB]> PetListAPIView : "<color:#1D4ED8><b>HTTP POST /api/pets/ (multipart)</b></color>"
AddNewPetComponent ..[#2563EB]> CollarTagGeneratorComponent : "Auto-invokes upon registration"
PetListingsComponent ..[#2563EB]> PetListAPIView : "<color:#1D4ED8><b>HTTP GET /api/pets/</b></color>"
PetListingsComponent ..[#2563EB]> PetAISearchAPIView : "<color:#1D4ED8><b>HTTP POST /api/pets/ai-search/</b></color>"
PetListingsComponent ..[#2563EB]> CollarTagGeneratorComponent : "Print Tag Action"

PetListAPIView --[#D97706]> PetIntakeStorageHandler : "Streams image payload"
PetIntakeStorageHandler --[#DB2777]> SupabaseStorageBucket : "Stores binary photo"
PetListAPIView --[#059669]> Pet : "INSERT into pets table"
PetListAPIView --[#059669]> PetImage : "INSERT primary image pointer"
PetAISearchAPIView --[#7C3AED]> Pet : "Semantic token search & negation ranking"

Pet "1" *--[#6366F1] "1..*" PetImage : "pet_id (multi-photo gallery)"
@enduml"""

# ==========================================
# 2. COLORFUL SEQUENCE DIAGRAM (MODULE 1.3)
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

actor "MDC Clinic Staff / Admin" as Staff #BFDBFE
actor "Adopter / Campus Student" as Student #FED7AA

participant "Vite/React Frontend\\n(AddNewPet & PetListings)" as Frontend #DBEAFE
participant "Collar Tag Generator\\n(HTML5 Canvas Utility)" as TagGen #DBEAFE
participant "Django REST API\\n(PetListAPIView & AISearch)" as API #D1FAE5
participant "Pet Intake Storage\\nHandler" as StorageHandler #FEF08A
participant "Supabase Storage\\n('petpictures' Bucket)" as Bucket #FCE7F3
participant "Supabase PostgreSQL\\n('pets' Table)" as DB #EDE9FE

== <color:#1E40AF><b>Phase 1: Animal Admission & Multipart Intake Pipeline</b></color> ==
Staff -> Frontend: Open "Add New Pet" Intake Screen
activate Frontend #DBEAFE
Staff -> Frontend: Fill biometrics (Name: 'Bruno', Species: 'Cat', Age: '2 yrs', Weight: '4.5 kg')
Staff -> Frontend: Select Found Near: 'Wildcat Innovation Labs' & Attach Photo file
Staff -> Frontend: Click "Register Companion"
Frontend -> API: <color:#1D4ED8><b>POST /api/pets/</b></color>\\n(Multipart FormData: fields + image binary)
activate API #D1FAE5

API -> StorageHandler: <color:#B45309><b>process_image_upload(request.FILES['image'])</b></color>
activate StorageHandler #FEF08A

StorageHandler -> StorageHandler: Generate unique key: "pet_UUID.jpg"
StorageHandler -> Bucket: <color:#DB2777><b>upload(path="pet_UUID.jpg", file=binary_data)</b></color>
activate Bucket #FCE7F3
Bucket --> StorageHandler: 200 OK (Uploaded successfully)
StorageHandler -> Bucket: get_public_url("pet_UUID.jpg")
Bucket --> StorageHandler: Return CDN URL: "https://supabase.../petpictures/pet_UUID.jpg"
deactivate Bucket

StorageHandler --> API: Resolved Public Image CDN URL
deactivate StorageHandler

group <color:#7C3AED><b>Supabase Pet Master Registration</b></color>
    API -> DB: <color:#7C3AED><b>INSERT INTO pets</b></color>\\n(pet_id='CIT-CAT-042', name='Bruno', species='Cat',\\nweight='4.5 kg', size='Small', primary_image=CDN_URL, adoption_status='Available')
    activate DB #EDE9FE
    DB --> API: 201 Created (Pet Record UUID & Fields)
    deactivate DB
end

API --> Frontend: <color:#16A34A><b>201 Created JSON (New Pet Master Record)</b></color>
deactivate API

Frontend --> Staff: Display "Bruno registered in Wildcat Welfare Portal!" banner
deactivate Frontend

== <color:#C2410C><b>Phase 2: Automated Waterproof Collar Tag Generation</b></color> ==
Staff -> Frontend: Navigate to "Pet Listings" -> Click "Print Collar Tag" for Bruno
activate Frontend #DBEAFE
Frontend -> TagGen: generatePrintableMatrix(pet_id='CIT-CAT-042', name='Bruno')
activate TagGen #DBEAFE

TagGen -> TagGen: Encode URL: 'https://taskforcebruno.onrender.com/pet/CIT-CAT-042'
TagGen -> TagGen: Render 300 DPI high-contrast optical QR pattern with CIT-U emblem
TagGen --> Frontend: Print-Ready PDF / Canvas Modal Preview
deactivate TagGen

Staff -> Frontend: Send to Zebra Thermal Label / Color Tag Printer
Frontend --> Staff: Waterproof Collar Tag printed for physical collar attachment
deactivate Frontend

== <color:#059669><b>Phase 3: AI Semantic Search for Registered Companions</b></color> ==
Student -> Frontend: Type search query: "friendly ginger cat near innovation labs"
activate Frontend #DBEAFE
Frontend -> API: <color:#1D4ED8><b>POST /api/pets/ai-search/</b></color>\\n{ "description": "friendly ginger cat near innovation labs" }
activate API #D1FAE5

API -> API: Extract negations & synonym map (ginger -> orange, kitty -> cat)
API -> DB: SELECT * FROM pets WHERE adoption_status != 'Adopted'
activate DB #EDE9FE
DB --> API: Return candidate pets with traits & colony origin
deactivate DB

API -> API: Compute weighted token overlap & trait scores
API --> Frontend: <color:#16A34A><b>200 OK JSON (Ranked companion results: Bruno #1 Match)</b></color>
deactivate API

Frontend --> Student: Display Bruno's profile card with 95% AI semantic affinity match
deactivate Frontend
@enduml"""

# ==========================================
# 3. COLORFUL ERD DATA DESIGN (MODULE 1.3)
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
    size : varchar(20)
    * <color:#059669>vaccination_status : varchar(50)</color>
    spayed_neutered : boolean
    * <color:#7C3AED>adoption_status : varchar(50)</color>
    * found_near : varchar(150)
    rescue_date : date
    current_conditions : text
    behavior_notes : text
    about_text : text
    * <color:#DB2777>primary_image : varchar(500)</color>
    created_at : timestamptz
}

entity "pet_images" as images #EDE9FE {
    * id : serial <<PK>>
    --
    * <color:#7C3AED>pet_id : varchar(50) <<FK -> pets.pet_id>></color>
    * image_url : varchar(500)
    is_primary : boolean
    uploaded_at : timestamptz
}

entity "animal_sightings" as sightings #FEF3C7 {
    * sighting_id : serial <<PK>>
    --
    * animal_type : varchar(50)
    location_details : varchar(200)
    distinct_features : text
    * <color:#D97706>status : varchar(50)</color>
    converted_pet_id : varchar(50) <<FK -> pets.pet_id>>
    logged_at : timestamptz
}

entity "medical_records" as medical #D1FAE5 {
    * id : serial <<PK>>
    --
    * <color:#7C3AED>pet_id : varchar(50) <<FK -> pets.pet_id>></color>
    * record_type : varchar(50)
    description : text
    log_date : date
    next_followup_date : date
}

entity "auth_user" as users #DBEAFE {
    * id : uuid <<PK>>
    --
    * email : varchar(254) <<UQ>>
    username : varchar(150)
    <color:#2563EB>is_staff : boolean</color>
}

pets ||--[#7C3AED]o{ images : "pet_id\\n(gallery photo assets)"
pets ||--[#059669]o{ medical : "pet_id\\n(clinical baseline vitals)"
sightings ||--[#D97706]o| pets : "converted_pet_id\\n(1-click intake origin)"
users ||--[#2563EB]o{ pets : "admitted_by\\n(attending staff)"
@enduml"""

svg_class = render_kroki(class_puml, "docs/intake_class_diagram_colorful.png", "docs/intake_class_diagram_colorful.puml")
svg_seq = render_kroki(sequence_puml, "docs/intake_sequence_diagram_colorful.png", "docs/intake_sequence_diagram_colorful.puml")
svg_erd = render_kroki(erd_puml, "docs/intake_erd_diagram_colorful.png", "docs/intake_erd_diagram_colorful.puml")

print("All Module 1.3 diagrams rendered!")
print("SVG Class:", svg_class)
print("SVG Seq:", svg_seq)
print("SVG ERD:", svg_erd)
