import base64
import zlib
import urllib.request
import os

os.makedirs('docs/srs_diagrams', exist_ok=True)

def render_puml(name, puml_content):
    compressed = zlib.compress(puml_content.encode('utf-8'), 9)
    encoded = base64.urlsafe_b64encode(compressed).decode('ascii')
    url = f"https://kroki.io/plantuml/png/{encoded}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            out_path = os.path.join('docs/srs_diagrams', f"{name}.png")
            with open(out_path, 'wb') as f:
                f.write(data)
            print(f"Generated {out_path} ({len(data)} bytes)")
            return out_path
    except Exception as e:
        print(f"Failed {name}: {e}")
        return None

diagrams = {
    # Module 1.3 Use Case Diagram
    "uc_1_3_usecase": """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam packageBorderColor #800000
skinparam actorBorderColor #800000
skinparam actorBackgroundColor #FFF5F5
skinparam usecaseBackgroundColor #F8FAFC
skinparam usecaseBorderColor #4338CA

left to right direction

actor "Animal Welfare Officer / Staff" as Staff

rectangle "Module 1.3: Animal Intake, Baseline Registry & Tag Generation" {
    usecase "Submit Animal Intake Dossier" as UC1
    usecase "Upload Profile Photo to Supabase" as UC2
    usecase "Record Clinical Baseline (Species, Breed, Gender)" as UC3
    usecase "Generate 300 DPI HTML5 Canvas QR Tag" as UC4
    usecase "Export Printable High-Res Tag Graphic" as UC5
    usecase "Heuristic Semantic Search (PetAISearchAPIView)" as UC6
}

Staff --> UC1
Staff --> UC2
Staff --> UC3
Staff --> UC4
Staff --> UC5
Staff --> UC6

UC1 ..> UC2 : <<include>>
UC1 ..> UC3 : <<include>>
UC4 ..> UC5 : <<extend>>
@enduml""",

    # Module 1.3 Activity Diagram
    "uc_1_3_activity": """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam activityBackgroundColor #EEF2FF
skinparam activityBorderColor #4338CA
skinparam activityDiamondBackgroundColor #FEF3C7
skinparam activityDiamondBorderColor #D97706

start
:Staff accesses AddNewPet.jsx Intake Form;
if (Handoff from Sighting Session?) then (yes)
    :Prefill Landmark, Description & Image from sessionStorage;
else (no)
    :Enter Raw Companion Identification & Baseline;
endif

:Fill mandatory fields (Name, Species, Gender, Age, Collar Tag ID);
:Upload High-Resolution Companion Photo;

if (Validate Form Fields?) then (invalid)
    :Display validation error (Missing fields / invalid tag);
    stop
else (valid)
    :Dispatch POST /api/pets/ to Django API;
    :Django commits record to Supabase PostgreSQL;
    :Supabase Storage persists companion photo;
    :Render 300 DPI Canvas Collar Tag with Pet URL QR;
    :Display Download & Print Collar Tag Options;
    :Animal is listed on PetListings.jsx with active status;
endif
stop
@enduml""",

    # Module 2.2 Use Case Diagram (Replaces outdated payment gateway)
    "uc_2_2_usecase": """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam packageBorderColor #800000
skinparam actorBorderColor #800000
skinparam actorBackgroundColor #FFF5F5
skinparam usecaseBackgroundColor #F8FAFC
skinparam usecaseBorderColor #059669

left to right direction

actor "Donor / Community Member" as Donor
actor "Shelter Inventory Custodian" as Custodian

rectangle "Module 2.2: Supply Logistics & Physical Inventory Control" {
    usecase "View Warehouse Inventory & Deficit Board" as UC_View
    usecase "Log In-Kind Physical Supply Donation" as UC_Donate
    usecase "Issue Stock for Shelter Medical/Feeding Use" as UC_Issue
    usecase "Manage Reorder Thresholds & Units (kg, cans, vials)" as UC_Manage
    usecase "Audit Ledger Transactions (inventory_transactions)" as UC_Audit
    usecase "Trigger Low-Stock Deficit Alert" as UC_Alert
}

Donor --> UC_View
Donor --> UC_Donate
Custodian --> UC_View
Custodian --> UC_Issue
Custodian --> UC_Manage
Custodian --> UC_Audit
UC_Issue ..> UC_Alert : <<extend>>
@enduml""",

    # Module 2.2 Activity Diagram
    "uc_2_2_activity": """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam activityBackgroundColor #ECFDF5
skinparam activityBorderColor #059669
skinparam activityDiamondBackgroundColor #FEF3C7
skinparam activityDiamondBorderColor #D97706

start
:Donor/Staff opens Logistics Dashboard;
:System renders real-time supply gauges (kg, cans, vials, pieces);
if (Action Type?) then (Physical Supply Donation)
    :Enter donor name, item category, quantity & physical unit;
    :Dispatch POST /api/inventory/donation/;
    :Backend increments stock_quantity in inventory table;
    :Append 'DONATION_IN' event to inventory_transactions ledger;
    :Display donation confirmation receipt;
else (Supply Consumption / Medical Dispense)
    :Custodian logs stock disbursement for shelter ward;
    :Backend decrements stock_quantity in inventory table;
    :Append 'DISBURSEMENT_OUT' event to ledger;
    if (stock_quantity <= reorder_threshold?) then (yes)
        :Trigger automated LOW-STOCK DEFICIT banner;
        :Publish deficit item to Needs Bulletin;
    else (no)
    endif
endif
:Update logistics UI view in real time;
stop
@enduml""",

    # Module 3.2 Use Case Diagram
    "uc_3_2_usecase": """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam packageBorderColor #800000
skinparam actorBorderColor #800000
skinparam actorBackgroundColor #FFF5F5
skinparam usecaseBackgroundColor #F8FAFC
skinparam usecaseBorderColor #D97706

left to right direction

actor "Campus Spotter (Student / Faculty)" as Spotter
actor "TFB Rescue Team / Staff" as Staff

rectangle "Module 3.2: Landmark-Assisted Sighting Telemetry & 1-Click Intake" {
    usecase "Report Sighting via CIT-U Campus Landmarks" as UC_Report
    usecase "Select Fixed Landmark (NGE, Canteen, Library, etc.)" as UC_Landmark
    usecase "Flag Emergency Triage [🚨 URGENT EMERGENCY]" as UC_Emergency
    usecase "Upload Sighting Scene Photo" as UC_Photo
    usecase "Triage Pending Sighting Queue" as UC_Triage
    usecase "Execute 1-Click Sighting-to-Intake Hand-off" as UC_Handoff
}

Spotter --> UC_Report
UC_Report ..> UC_Landmark : <<include>>
UC_Report ..> UC_Photo : <<include>>
UC_Report ..> UC_Emergency : <<extend>>

Staff --> UC_Triage
Staff --> UC_Handoff
UC_Handoff ..> UC_Triage : <<extend>>
@enduml""",

    # Module 3.2 Activity Diagram
    "uc_3_2_activity": """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam activityBackgroundColor #FFFBEB
skinparam activityBorderColor #D97706
skinparam activityDiamondBackgroundColor #FEF3C7
skinparam activityDiamondBorderColor #D97706

start
:Spotter navigates to Report Sighting screen;
:Select standardized CIT-U Landmark (e.g. NGE Building, Canteen);
:Input physical description, health condition & approximate time;
if (Animal in immediate danger / injured?) then (yes)
    :Check 'URGENT EMERGENCY' checkbox;
    :System prefixes description with [🚨 URGENT EMERGENCY];
else (no)
endif
:Capture or upload scene photo;
:Submit sighting payload to POST /api/sightings/;
:Backend persists record in Supabase with status 'PENDING';
:Staff reviews triage queue on StaffDashboard;
if (Animal captured & brought to shelter?) then (yes)
    :Staff clicks 'Convert to Official Intake' (1-Click Handoff);
    :System transfers landmark, notes & photo to sessionStorage;
    :Redirect to AddNewPet.jsx pre-populated;
    :Staff finalizes official registration & tag issuance;
    :Mark original sighting as 'RESOLVED_INTAKE';
else (no)
    :Mark as 'MONITORING' or 'SPOTTED';
endif
stop
@enduml""",

    # Module 4.1 Use Case Diagram
    "uc_4_1_usecase": """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam packageBorderColor #800000
skinparam actorBorderColor #800000
skinparam actorBackgroundColor #FFF5F5
skinparam usecaseBackgroundColor #F8FAFC
skinparam usecaseBorderColor #0284C7

left to right direction

actor "First-Time Visitor / Student" as User
actor "Volunteer Coordinator" as Coord

rectangle "Module 4.1: Interactive User Onboarding Walkthrough" {
    usecase "Trigger User Guide Tour (UserGuideModal.jsx)" as UC_Tour
    usecase "Navigate 4-Step Interactive Walkthrough" as UC_Steps
    usecase "Review QR Biosecurity & Passport Guidelines" as UC_QRGuide
    usecase "Review Sighting Reporting & Rescue SOPs" as UC_SightingGuide
    usecase "Dismiss Tour & Persist Preferences (localStorage)" as UC_Dismiss
    usecase "Access Volunteer Onboarding & FAQs" as UC_Volunteer
}

User --> UC_Tour
UC_Tour ..> UC_Steps : <<include>>
UC_Steps ..> UC_QRGuide : <<include>>
UC_Steps ..> UC_SightingGuide : <<include>>
User --> UC_Dismiss
User --> UC_Volunteer
Coord --> UC_Volunteer
@enduml""",

    # Module 4.1 Activity Diagram
    "uc_4_1_activity": """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam activityBackgroundColor #F0F9FF
skinparam activityBorderColor #0284C7
skinparam activityDiamondBackgroundColor #FEF3C7
skinparam activityDiamondBorderColor #D97706

start
:User visits Wildcat Welfare Portal;
:System checks localStorage key 'hasSeenGuide';
if (hasSeenGuide == 'true'?) then (yes)
    :Render standard Homepage / Newsfeed;
    :Keep 'User Guide' quick-launch button accessible in navbar;
else (no)
    :Auto-trigger UserGuideModal.jsx walkthrough overlay;
    :Step 1: Welcome & Mission Overview;
    :Step 2: Scanning QR Collar Tags & RA 9482 Biosecurity;
    :Step 3: Landmark Sighting Telemetry & Emergency SOPs;
    :Step 4: Adoption Pipeline & Donation Logistics;
    if (User clicks 'Get Started' or 'Dismiss'?) then (yes)
        :Set localStorage['hasSeenGuide'] = 'true';
        :Close modal with smooth fade animation;
    endif
endif
stop
@enduml""",

    # Module 4.2 Use Case Diagram
    "uc_4_2_usecase": """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam packageBorderColor #800000
skinparam actorBorderColor #800000
skinparam actorBackgroundColor #FFF5F5
skinparam usecaseBackgroundColor #F8FAFC
skinparam usecaseBorderColor #7C3AED

left to right direction

actor "CIT-U Student / Faculty" as Member
actor "MDC Medical Officer" as Clinic
actor "Shelter Staff / Admin" as Admin

rectangle "Module 4.2: Role-Based Access Control & Institutional Authentication" {
    usecase "Register Account (Validate XX-XXXX-XXX & @cit.edu)" as UC_Reg
    usecase "Authenticate & Obtain JWT Tokens" as UC_Login
    usecase "Access Role-Specific Dashboard (<StaffDashboard /> vs <DashboardContainer />)" as UC_Route
    usecase "Monitor Sliding 15-Minute Inactivity Session" as UC_Timeout
    usecase "Auto-Terminate Session & Flush Tokens" as UC_Logout
    usecase "Cold-Start Heartbeat Monitor (HealthCheckAPIView)" as UC_Health
}

Member --> UC_Reg
Member --> UC_Login
Member --> UC_Route
Member --> UC_Timeout

Clinic --> UC_Login
Clinic --> UC_Route
Admin --> UC_Login
Admin --> UC_Route
Admin --> UC_Health

UC_Timeout ..> UC_Logout : <<extend>>
@enduml""",

    # Module 4.2 Activity Diagram
    "uc_4_2_activity": """@startuml
skinparam defaultFontName "Segoe UI"
skinparam roundCorner 8
skinparam shadowing false
skinparam activityBackgroundColor #F5F3FF
skinparam activityBorderColor #7C3AED
skinparam activityDiamondBackgroundColor #FEF3C7
skinparam activityDiamondBorderColor #D97706

start
:User accesses Login / Register Portal;
if (Action?) then (Registration)
    :Enter Institutional ID, Email, Name, and Password;
    if (Regex Match XX-XXXX-XXX and Domain @cit.edu?) then (valid)
        :Hash password via PBKDF2/bcrypt;
        :Create user record in Supabase PostgreSQL;
    else (invalid)
        :Display 'Institutional credentials required (@cit.edu)';
        stop
    endif
else (Login)
endif

:Dispatch credentials to POST /api/token/;
:Django issues JWT access and refresh token pair;
:Store JWT in encrypted browser storage;
:Inspect role claim in token payload;

if (Role is STAFF or CLINIC?) then (Staff/Clinic)
    :Route to <StaffDashboard /> with privileged controls;
else (Community)
    :Route to <DashboardContainer /> with personal applications;
endif

:Initialize 15-minute sliding inactivity watchdog;
while (Session Active?) is (yes)
    if (User interaction detected?) then (yes)
        :Reset 15-minute countdown timer;
    else (idle for 15 minutes)
        :Trigger session timeout modal;
        :Purge JWT tokens from storage;
        :Redirect to login screen with inactivity notice;
        stop
    endif
endwhile
stop
@enduml"""
}

if __name__ == "__main__":
    for name, puml in diagrams.items():
        render_puml(name, puml)
