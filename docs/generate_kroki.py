import base64
import zlib
import urllib.request

plantuml_code = """@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_LEFT_RIGHT()

skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #334155
skinparam ArrowThickness 1.3

' Professional Color Palette
AddElementTag("user", $bgColor="#800000", $fontColor="#ffffff", $borderColor="#4a0000")
AddElementTag("spa", $bgColor="#0284c7", $fontColor="#ffffff", $borderColor="#0369a1")
AddElementTag("core", $bgColor="#4338ca", $fontColor="#ffffff", $borderColor="#312e81")
AddElementTag("adoption", $bgColor="#7c3aed", $fontColor="#ffffff", $borderColor="#5b21b6")
AddElementTag("db", $bgColor="#059669", $fontColor="#ffffff", $borderColor="#047857")
AddElementTag("smtp", $bgColor="#d97706", $fontColor="#ffffff", $borderColor="#b45309")

title C4 Container Diagram - Wildcat Welfare Portal (Post-MVP Architecture)

Person(user, "Campus Stakeholders & Public", "CIT-U Students, Faculty, MDC Clinic Staff, Adopters, and Public Visitors", $tags="user")

System_Boundary(c1, "Wildcat Welfare Portal System Boundary") {
    Container(spa, "Single-Page Application", "React.js 19, Vite, Tailwind CSS", "Provides user interfaces for QR Scanner, Public Pet Passport, Sighting Triage, Clinical Journals, and Adoption Gallery.", $tags="spa")
    Container(core_api, "Core API Service\\n(Medical, QR & Biosecurity)", "Django REST Framework / Python", "Processes QR collar lookups, Public Pet Passport, clinical timelines, and active 14-day bite observation quarantine alerts (RA 9482).", $tags="core")
    Container(adoption_api, "Adoption & Sighting Service\\n(Pipelines)", "Django REST Framework / Python", "Coordinates 1-click sighting intake handoffs, landmark-assisted reports, and adoption application workflow states.", $tags="adoption")
    ContainerDb(db, "Database & Cloud Storage", "Supabase [PostgreSQL & Storage Buckets]", "Stores transactional records (users, pets, medical logs, inventory) and image assets (sighting photos, companion pictures).", $tags="db")
}

System_Ext(smtp, "SMTP Notification Service", "External campus mailer for automated adoption updates and emergency triage alerts.", $tags="smtp")

Rel(user, spa, "Interacts with", "HTTPS")
Rel(spa, core_api, "Forwards Profile, Clinical & Passport Requests", "HTTPS/JSON")
Rel(spa, adoption_api, "Forwards Sighting & Adoption Payloads", "HTTPS/JSON")
Rel(core_api, db, "Queries / Mutates", "SQL")
Rel(adoption_api, db, "Queries / Mutates", "SQL")
Rel(adoption_api, smtp, "Dispatches status alerts", "SMTP")
Rel_Back(user, smtp, "Sends automated notification emails", "Email")

@enduml"""

compressed = zlib.compress(plantuml_code.encode("utf-8"), 9)
encoded = base64.urlsafe_b64encode(compressed).decode("ascii")

png_url = f"https://kroki.io/plantuml/png/{encoded}"
svg_url = f"https://kroki.io/plantuml/svg/{encoded}"

req = urllib.request.Request(png_url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
        with open("docs/c4_container_diagram.png", "wb") as f:
            f.write(data)
    with open("docs/c4_container_diagram.puml", "w", encoding="utf-8") as f:
        f.write(plantuml_code)
    print("Downloaded C4 PNG! Size:", len(data))
    print("Kroki SVG URL:", svg_url)
    print("Kroki PNG URL:", png_url)
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Error response:", e.read().decode("utf-8"))
