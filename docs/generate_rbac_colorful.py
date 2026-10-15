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

# =========================================================================
# COLORFUL SEQUENCE DIAGRAM: MODULE 4.2 RBAC & INSTITUTIONAL AUTHENTICATION
# =========================================================================
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

actor "CIT-U Student / Faculty / Staff" as User #BFDBFE

participant "Vite/React Client\\n(Register / Login / App.jsx)" as Client #DBEAFE
participant "Django REST API\\n(RegisterUserView & LoginView)" as API #D1FAE5
participant "Supabase Auth Engine\\n(GoTrue Identity Service)" as Auth #FEF08A
participant "Supabase Database\\n(public.profiles & auth.users)" as DB #EDE9FE

== <color:#1E40AF><b>Phase 1: Institutional Registration & Identity Gate</b></color> ==
User -> Client: Enter ID (format: "21-1234-567"), Name, Email ("student@cit.edu"), Password
activate Client #DBEAFE

Client -> Client: Client-side regex check: XX-XXXX-XXX & @cit.edu domain
Client -> API: <color:#1D4ED8><b>POST /api/register/</b></color>\\n{ id: "21-1234-567", email: "student@cit.edu", password: "...", ... }
activate API #D1FAE5

API -> API: Enforce ID_PATTERN & EMAIL_PATTERN regex validation

alt <color:#DC2626><b>[Validation Failed] Non-Institutional Email or Invalid ID</b></color>
    API --> Client: <color:#DC2626>400 Bad Request ("Must be a valid @cit.edu institutional address")</color>
    Client --> User: Display error alert banner: "Institutional email domain required"
else <color:#16A34A><b>[Validation Passed] Valid CIT-U Institutional Member</b></color>
    API -> Auth: <color:#B45309><b>supabase.auth.sign_up(email, password, metadata)</b></color>
    activate Auth #FEF08A
    Auth -> DB: INSERT INTO auth.users (email, encrypted_password, role='authenticated')
    activate DB #EDE9FE
    DB --> Auth: User record created (UUID)
    deactivate DB
    Auth --> API: AuthResponse(user_id=UUID)
    deactivate Auth

    API -> DB: <color:#7C3AED><b>UPSERT INTO public.profiles</b></color>\\n(id=UUID, custom_id="21-1234-567", role="user", email="student@cit.edu")
    activate DB #EDE9FE
    DB --> API: 201 Created (Profile synchronized)
    deactivate DB

    API --> Client: <color:#16A34A><b>201 Created ("Account initialized successfully. You may now log in.")</b></color>
    deactivate API
    Client --> User: Switch to Login view with success toast
end
deactivate Client

== <color:#C2410C><b>Phase 2: Authentication & Role Resolution (RBAC Routing)</b></color> ==
User -> Client: Submit institutional credentials (email, password)
activate Client #DBEAFE
Client -> API: <color:#1D4ED8><b>POST /api/login/</b></color>\\n{ email: "officer@cit.edu", password: "..." }
activate API #D1FAE5

API -> Auth: <color:#B45309><b>supabase.auth.sign_in_with_password(email, password)</b></color>
activate Auth #FEF08A

alt <color:#DC2626><b>[Auth Failed] Invalid Credentials or Unconfirmed Email</b></color>
    Auth --> API: 401 Unauthorized / Error
    API --> Client: <color:#DC2626>401 Unauthorized ("Invalid institutional credentials")</color>
    Client --> User: Display red credential failure banner
else <color:#16A34A><b>[Auth Success] Valid Credentials & Session Token Issued</b></color>
    Auth --> API: AuthResponse(session: { access_token: JWT, user: { id: UUID } })
    deactivate Auth

    API -> DB: <color:#7C3AED><b>SELECT role, custom_id, first_name, last_name FROM public.profiles WHERE id = UUID</b></color>
    activate DB #EDE9FE
    DB --> API: Return profile: { role: "staff", custom_id: "19-4501-112", ... }
    deactivate DB

    API --> Client: <color:#16A34A><b>200 OK JSON</b></color>\\n{ session: { access_token: JWT, role: "staff", email: "...", student_id: "..." } }
    deactivate API

    Client -> Client: Cache normalized session in localStorage ('tfb_session')\\nStart 15-minute sliding inactivity timer

    alt <color:#7C3AED><b>Role == 'staff' (MDC Welfare Officer / Admin)</b></color>
        Client -> Client: Route to <color:#7C3AED><b><StaffDashboard /></b></color>\\n(Access: Sighting Triage, Pending Apps, Medical Logs, Inventory Control)
        Client --> User: Render full administrative management portal
    else <color:#2563EB><b>Role == 'user' (CIT-U Student / Faculty / Public)</b></color>
        Client -> Client: Route to <color:#2563EB><b><DashboardContainer /></b></color>\\n(Access: Newsfeed, Adoption Gallery, QR Profile Lookup, Sighting Reporter)
        Client --> User: Render community social feed & companion catalog
    end
end
deactivate Client

== <color:#059669><b>Phase 3: Sliding Session Security & Inactivity Timeout</b></color> ==
loop Active interaction (mouse, keypress, touch, scroll)
    User -> Client: Interact with application interface
    Client -> Client: Throttle refresh lastActiveAt in localStorage; reset 15m idle countdown
end

alt Zero interaction detected for 15 minutes (Sliding window expired)
    Client -> Client: Clear 'tfb_session', 'tfb_staff_tab', 'tfb_user_tab' & sessionStorage
    Client --> User: Alert: "Session expired due to 15m inactivity"; redirect to Login screen
end
@enduml"""

svg_seq = render_kroki(sequence_puml, "docs/rbac_sequence_diagram_colorful.png", "docs/rbac_sequence_diagram_colorful.puml")
print("Module 4.2 Sequence Diagram rendered!")
print("SVG URL:", svg_seq)
