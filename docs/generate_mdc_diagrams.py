import base64
import zlib
import urllib.request

# =====================================================================
# 1. MDC CLASS DIAGRAM
# =====================================================================
mdc_class_puml = """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam classFontSize 12
skinparam classAttributeFontSize 11
skinparam ArrowColor #334155
skinparam ArrowThickness 1.3

class MDCStaffUser <<Supabase Auth / Profiles>> #EFF6FF {
    -UUID id
    -String employeeId
    -String email
    -String role
    -Boolean isStaff
    +login(credentials) : SessionToken
    +logout() : void
}

class MDCDashboardView <<React UI Component>> #F0FDF4 {
    -Array petRegistry
    -Array activeQuarantines
    -Boolean loading
    -String searchFilter
    +fetchMedicalDashboard() : void
    +filterByLandmark(zone) : void
    +render() : JSX
}

class IncidentReportForm <<React UI Form>> #FFF1F2 {
    -String petId
    -String incidentType
    -Date incidentDate
    -String campusLandmark
    -String victimDetails
    -Boolean autoQuarantineRA9482
    +handleSubmit(e) : void
    +flagForPEP() : void
    +render() : JSX
}

class QuarantineTrackerComponent <<React Biosecurity Widget>> #FEF2F2 {
    -String quarantineId
    -String petId
    -Date incidentDate
    -Integer countdownDaysRemaining
    -String clinicalStatus
    +calculateQuarantineElapsed() : Integer
    +dischargeQuarantine() : void
    +renderCountdownBadge() : JSX
}

class MedicalRecordsAPIView <<Django REST Framework APIView>> #EEF2FF {
    +get(request, pet_id) : Response
    +post(request, pet_id) : Response
    -validate_biosecurity_payload(data) : dict
}

class ClinicalBiosecurityService <<Python / Supabase Handler>> #ECFDF5 {
    -Client supabase_client
    +log_clinical_visit(payload) : dict
    +create_incident_quarantine(payload) : dict
    +update_vaccine_timeline(pet_id, vax_data) : void
    +fetch_patient_history(pet_id) : dict
}

class MedicalRecord <<Supabase Entity>> #F5F3FF {
    +BigInt record_id <<PK>>
    +String pet_id <<FK>>
    +String visit_type
    +Date log_date
    +String attending_staff
    +Numeric weight_kg
    +Text clinical_notes
    +Text diagnosis
    +Boolean is_bite_scratch_incident
    +Boolean quarantine_14day_active
}

class Pet <<Supabase Entity>> #F0FDF4 {
    +String pet_id <<PK>>
    +String name
    +String species
    +String breed
    +String vaccination_status
    +DateTime last_rabies_vaccination
}

' Relationships & Navigation
MDCStaffUser --> MDCDashboardView : Authenticates & Operates
MDCDashboardView --> IncidentReportForm : Triggers on Bite/Scratch
MDCDashboardView --> QuarantineTrackerComponent : Embeds RA 9482 Surveillance

IncidentReportForm ..> MedicalRecordsAPIView : HTTP POST /api/medical/{pet_id}/
MDCDashboardView ..> MedicalRecordsAPIView : HTTP GET /api/medical/{pet_id}/

MedicalRecordsAPIView ..> ClinicalBiosecurityService : Validates & Calls
ClinicalBiosecurityService ..> MedicalRecord : Persists Logs & Quarantine
ClinicalBiosecurityService ..> Pet : Updates Health Status
MedicalRecord --> Pet : Records Treatment for

@enduml"""

# =====================================================================
# 2. MDC SEQUENCE DIAGRAM
# =====================================================================
mdc_seq_puml = """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #334155
skinparam ArrowThickness 1.3

actor "MDC Staff (Clinic)" as staff
participant "LoginView\\n(React UI)" as login_ui #EFF6FF
participant "LoginAPIView\\n(DRF Gate)" as auth_gate #EEF2FF
participant "MDCDashboardView\\n(React UI)" as dash_ui #F0FDF4
participant "IncidentReportForm\\n(React UI)" as incident_ui #FFF1F2
participant "MedicalRecordsAPIView\\n(Django REST Framework)" as med_api #EEF2FF
participant "ClinicalBiosecurityService\\n(Python / Supabase)" as bio_svc #ECFDF5
database "Supabase PostgreSQL\\n(Database)" as db #059669

autonumber 1 "<b>(#)</b>"

staff -> login_ui : Enters institutional credentials (@cit.edu)
activate login_ui
login_ui -> auth_gate : POST /api/login/ {email, password}
activate auth_gate
auth_gate -> db : Verify staff credentials & role = 'MDC_STAFF'
activate db
db --> auth_gate : Return profile & authenticated JWT session
deactivate db
auth_gate --> login_ui : 200 OK {token, role: 'MDC_STAFF'}
deactivate auth_gate
login_ui --> staff : Redirects to MDC Dashboard
deactivate login_ui

staff -> dash_ui : Selects animal & clicks "Log Bite/Scratch Incident"
activate dash_ui
dash_ui -> incident_ui : Mounts Incident Form (petId)
deactivate dash_ui
activate incident_ui

staff -> incident_ui : Submits incident (Victim info, Campus Landmark, Bite severity)
incident_ui -> med_api : POST /api/medical/{pet_id}/ (JWT Bearer Token)
activate med_api

med_api -> med_api : Validate JWT role & sanitize incident payload
med_api -> bio_svc : create_incident_quarantine(payload)
activate bio_svc

bio_svc -> db : INSERT into medical_records (is_incident=True, quarantine_active=True)
activate db
db --> bio_svc : Record inserted (record_id)
deactivate db

bio_svc -> db : UPDATE pets SET vaccination_status = 'Under 14-Day Quarantine'
activate db
db --> bio_svc : Status updated
deactivate db

bio_svc --> med_api : Return confirmed incident & quarantine metadata
deactivate bio_svc
med_api --> incident_ui : 201 Created {quarantine_countdown: 14 days, protocol: "RA 9482"}
deactivate med_api

incident_ui -> dash_ui : Refresh telemetry & mount QuarantineTracker
deactivate incident_ui
activate dash_ui
dash_ui --> staff : Displays active 14-day countdown & PEP clinical alerts
deactivate dash_ui

@enduml"""

# =====================================================================
# 3. MDC ERD / DATA DESIGN DIAGRAM
# =====================================================================
mdc_erd_puml = """@startuml
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

entity "profiles (MDC Staff)" as staff #EFF6FF {
    * id : uuid <<PK, FK auth.users>>
    --
    * user_id : varchar(20) <<Employee ID>>
    * first_name : varchar(100)
    * last_name : varchar(100)
    * email : varchar(150) <<@cit.edu>>
    role : varchar(30) <<MDC_STAFF>>
    is_staff : boolean
    created_at : timestamptz
}

entity "pets" as pets #F0FDF4 {
    * pet_id : varchar(50) <<PK>>
    --
    * name : varchar(100)
    species : varchar(30) <<Cat, Dog>>
    breed : varchar(50)
    vaccination_status : varchar(30) <<Up to Date, Overdue, Quarantined>>
    last_rabies_vaccination : date
    qr_collar_tag_code : varchar(50)
}

entity "medical_records" as med_records #FFF1F2 {
    * record_id : bigint <<PK, identity>>
    --
    * pet_id : varchar(50) <<FK pets.pet_id>>
    visit_type : varchar(50) <<Routine, Emergency, Incident>>
    log_date : date
    attending_staff : varchar(100)
    weight_kg : numeric(5,2)
    clinical_notes : text
    diagnosis : text
    treatment_protocol : text
    created_by : uuid <<FK profiles.id>>
    created_at : timestamptz
}

entity "bite_scratch_incidents" as incidents #FEF2F2 {
    * incident_id : bigint <<PK, identity>>
    --
    * record_id : bigint <<FK medical_records.record_id>>
    * pet_id : varchar(50) <<FK pets.pet_id>>
    incident_type : varchar(50) <<Bite—Human, Scratch—Human>>
    incident_date : date
    campus_landmark : varchar(100) <<NGE, Canteen, Quad>>
    victim_name : varchar(150)
    victim_contact : varchar(50)
    pep_recommended : boolean <<Post-Exposure Prophylaxis>>
    quarantine_start_date : date
    quarantine_end_date : date <<14 Days, RA 9482>>
    quarantine_status : varchar(30) <<Active, Completed, Deceased>>
    investigated_by : uuid <<FK profiles.id>>
}

entity "vaccination_logs" as vax_logs #FDF2F8 {
    * vaccine_id : bigint <<PK, identity>>
    --
    * pet_id : varchar(50) <<FK pets.pet_id>>
    vaccine_name : varchar(100) <<Anti-Rabies, 4-in-1>>
    batch_number : varchar(50)
    administered_date : date
    next_due_date : date
    administered_by : uuid <<FK profiles.id>>
}

' Entity Relationships
pets ||--o{ med_records : "receives (1:N)"
pets ||--o{ vax_logs : "administered (1:N)"
pets ||--o{ incidents : "involved in (1:N)"
med_records ||--o| incidents : "initiates (1:1)"
staff ||--o{ med_records : "records (1:N)"
staff ||--o{ vax_logs : "administers (1:N)"
staff ||--o{ incidents : "investigates (1:N)"

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

svg_class, _ = fetch_kroki(mdc_class_puml, "docs/mdc_class_diagram.png", "docs/mdc_class_diagram.puml")
svg_seq, _ = fetch_kroki(mdc_seq_puml, "docs/mdc_sequence_diagram.png", "docs/mdc_sequence_diagram.puml")
svg_erd, _ = fetch_kroki(mdc_erd_puml, "docs/mdc_erd_diagram.png", "docs/mdc_erd_diagram.puml")

print("MDC Class SVG:", svg_class)
print("MDC Seq SVG:", svg_seq)
print("MDC ERD SVG:", svg_erd)
