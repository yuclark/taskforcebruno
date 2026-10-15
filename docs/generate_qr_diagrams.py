import base64
import zlib
import urllib.request

# =====================================================================
# 1. CLASS DIAGRAM (QR Profile Tracking & Public Pet Passport)
# Matches the user's uploaded class diagram, upgraded to Django & MVP features!
# =====================================================================
class_diagram_puml = """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam classFontSize 12
skinparam classAttributeFontSize 11
skinparam ArrowColor #334155
skinparam ArrowThickness 1.3

class ProfileRouter <<React Logic>> #EFF6FF {
    -String currentPath
    +parsePetID(path) : String
    +routeTo(view) : void
}

class QRScannerView <<React UI Component>> #F0FDF4 {
    -String manualId
    -Boolean isProcessing
    -String statusMessage
    -String errorMessage
    +onProfileIdentified(id) : void
    +handleManualSubmit(e) : void
    +simulateCameraScan() : void
    +handleFileUpload(e) : void
    +render() : JSX
}

class PetProfileView <<React UI Component>> #F5F3FF {
    -String petId
    -Object petData
    -Boolean loading
    -Boolean showApplyForm
    -Object applicationForm
    -String successMessage
    +onBackToScanner() : void
    +useEffect() : void
    +handleApplySubmit(e) : void
    +render() : JSX
}

class PetPassportView <<React Emergency UI>> #FFF1F2 {
    -String petId
    -Object passportData
    -Boolean isEmergencyMode
    -String clinicHotline
    +onDialClinic() : void
    +renderRabiesBadge() : JSX
    +render() : JSX
}

class PetDetailAPIView <<Django REST Framework APIView>> #EEF2FF {
    +get(request, pet_id) : Response
    +get_passport(request, pet_id) : Response
    -sanitize_public_payload(record) : dict
}

class PetProfileQueryHandler <<Python / Supabase Handler>> #ECFDF5 {
    -Client supabase_client
    +fetch_pet_record(pet_id) : dict
    +verify_rabies_status(pet_id) : dict
    +resolve_media_bucket_url(path) : str
}

class PetEntity <<Supabase / Relational Model>> #FFFBEB {
    +String pet_id
    +String name
    +String species
    +String breed
    +String gender
    +String age
    +String pet_type
    +String adoption_status
    +String vaccination_status
    +Boolean spayed_neutered
    +DateTime last_rabies_vaccination
    +String qr_collar_tag_code
}

' Navigation & Dependency Flow
ProfileRouter --> QRScannerView : Renders Initially
QRScannerView --> ProfileRouter : Triggers with ID
ProfileRouter --> PetProfileView : Mounts with petId prop (Detailed)
ProfileRouter --> PetPassportView : Routes Unauthenticated Scanners (Emergency Passport)

PetProfileView ..> PetDetailAPIView : HTTP GET /api/pets/{id}
PetPassportView ..> PetDetailAPIView : HTTP GET /api/pets/{id}/ (Sanitized)
PetDetailAPIView ..> PetProfileQueryHandler : Validates & Invokes
PetProfileQueryHandler ..> PetEntity : Queries Supabase 'pets' Table

@enduml"""

# =====================================================================
# 2. SEQUENCE DIAGRAM (QR Profile Tracking & Public Pet Passport)
# Matches the sequence diagram flow, upgraded to Django & MVP features!
# =====================================================================
sequence_diagram_puml = """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #334155
skinparam ArrowThickness 1.3

actor "Campus User / Adopter" as user
participant "QRScannerView\\n(React)" as scanner #F0FDF4
participant "ProfileRouter\\n(React)" as router #EFF6FF
participant "PetPassportView\\n(React Emergency)" as passport #FFF1F2
participant "PetProfileView\\n(React Detailed)" as profile #F5F3FF
participant "PetDetailAPIView\\n(Django REST Framework)" as drf_view #EEF2FF
participant "PetProfileQueryHandler\\n(Python / Supabase)" as handler #ECFDF5
database "Supabase PostgreSQL\\n(Database & Buckets)" as db #059669

autonumber 1 "<b>(#)</b>"

user -> scanner : Interacts with Interface
activate scanner

alt Method A: Optic Scan Stream (Hardware Camera)
    scanner -> scanner : scanFrame() via jsQR decoder
else Method B: Matrix Upload (Gallery File Fallback)
    scanner -> scanner : handleFileUpload() + decode via jsQR
else Method C: Console Override Terminal
    scanner -> scanner : handleManualSubmit(e)
end

scanner -> router : onProfileIdentified(petId)
deactivate scanner
activate router

alt Unauthenticated / Emergency Scan (Public User)
    router -> passport : Mounts component with petId prop
    activate passport
    passport -> drf_view : HTTP GET /api/pets/{pet_id}/ (Public Passport)
    activate drf_view
    drf_view -> handler : fetch_pet_record(pet_id)
    activate handler
    handler -> db : Query profile & rabies metrics where pet_id = id
    activate db
    db --> handler : Return relational datasets
    deactivate db
    handler --> drf_view : Return structured pet record
    deactivate handler
    drf_view -> drf_view : sanitize_public_payload() (Strip internal clinic logs)
    drf_view --> passport : 200 OK (Rabies Status, Vaccine Badges, Hotline)
    deactivate drf_view
    passport --> user : Renders Emergency Pet Passport (Verified Rabies Badge, Hotline)
    deactivate passport

else Authenticated / Detailed Profile View (Adoption & Clinical)
    router -> profile : Mounts component with petId prop
    activate profile
    profile -> drf_view : HTTP GET /api/pets/{pet_id}/ (Full Details)
    activate drf_view
    drf_view -> handler : fetch_pet_record(pet_id)
    activate handler
    handler -> db : Query comprehensive profile metrics
    activate db
    db --> handler : Return full relational dataset
    deactivate db
    handler --> drf_view : Return complete pet entity object
    deactivate handler
    drf_view --> profile : Deliver verified JSON response payload
    deactivate drf_view
    profile -> profile : setPetData(data) & toggle loading false
    profile --> user : Renders full Mobile UI Layout (Vitals, Diagnostics, Bio, Adoption)
    deactivate profile
end

deactivate router

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

svg_class, png_class = fetch_kroki(class_diagram_puml, "docs/qr_class_diagram.png", "docs/qr_class_diagram.puml")
svg_seq, png_seq = fetch_kroki(sequence_diagram_puml, "docs/qr_sequence_diagram.png", "docs/qr_sequence_diagram.puml")

print("Class SVG:", svg_class)
print("Seq SVG:", svg_seq)
