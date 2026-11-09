import os
import subprocess
from pathlib import Path
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

# Task Force Bruno - Requirements Inventory & Traceability Matrix Generator
# Cebu Institute of Technology - University (CIT-U)
# IT332 - Capstone Project 2

# ==========================================
# 1. DATA DEFINITIONS
# ==========================================

inventory_data = [
    # G1: Rapid Identification & Public Passport
    ("G1", "Enable rapid lookup of companion identity, vaccination status, and emergency contacts via QR scanner and AI search without mandatory login in ≤ 25s.",
     "REQ-101", "The system shall provide unauthenticated public access to the Emergency Pet Passport upon scanning a physical QR collar tag.",
     "User points camera at QR tag → System captures matrix and resolves pet ID → Browser displays emergency contacts and rabies vaccination badge without requiring authentication.",
     "Functional", "Must", 1.0, "Verified with Bruno PET-001; public passport renders in < 1.0s.", "Mobile / Frontend Lead"),

    ("G1", "Enable rapid lookup of companion identity, vaccination status, and emergency contacts via QR scanner and AI search without mandatory login in ≤ 25s.",
     "REQ-102", "The system shall provide a client-side static image QR decoding fallback when hardware camera permissions are denied or unavailable.",
     "Camera permission denied / user selects file → System accepts static image upload and decodes matrix via canvas jsQR → Pet profile resolved without server roundtrip.",
     "Functional", "Must", 1.0, "Resolved post-MVP (INC-02); tested on Android WebKit and iOS Safari.", "Frontend Lead"),

    ("G1", "Enable rapid lookup of companion identity, vaccination status, and emergency contacts via QR scanner and AI search without mandatory login in ≤ 25s.",
     "REQ-103", "The system shall allow users to search campus pet profiles using natural language physical trait descriptors and location heuristics.",
     "User inputs search query (e.g. 'calico white paws canteen') → PetAISearchAPIView tokenizes descriptors → Grid of matching companion profiles returned.",
     "Functional", "Should", 1.0, "Heuristic search active; filters by coat pattern, color, and landmark.", "Backend Lead"),

    # G2: Structured Sighting Triage & 1-Click Intake
    ("G2", "Digitize 100% of campus animal sightings with photos and landmarks, enabling 1-click administrative intake into the pet registry with zero redundant data entry.",
     "REQ-201", "The system shall capture crowdsourced stray animal sightings with mandatory photo upload and standardized CIT-U campus landmark selection.",
     "Student fills sighting form and selects campus landmark from dropdown → System uploads image to Supabase and saves record → New feed item published.",
     "Functional", "Must", 1.0, "Replaced free text with standardized 8-zone landmark dictionary (INC-05).", "Frontend / Backend Lead"),

    ("G2", "Digitize 100% of campus animal sightings with photos and landmarks, enabling 1-click administrative intake into the pet registry with zero redundant data entry.",
     "REQ-202", "The system shall provide an Emergency Sentinel priority selector for sightings of injured animals, sick strays, or active bite risks.",
     "User toggles 'Emergency: Bite / Scratch Risk' → System displays immediate RA 9482 first-aid guidance and flags post with urgent red banner and clinic hotline → High-priority alert broadcast on campus feed.",
     "Functional", "Must", 1.0, "Provides immediate 15-minute soap/water wash instructions and direct MDC hotline link.", "Full-Stack Lead"),

    ("G2", "Digitize 100% of campus animal sightings with photos and landmarks, enabling 1-click administrative intake into the pet registry with zero redundant data entry.",
     "REQ-203", "The system shall enable authorized staff to admit verified stray sightings into official pet registration via a 1-click state handoff.",
     "Staff clicks 'Admit & Intake Stray' on sighting card → System routes to Add New Pet form auto-populating photo, species, and landmark → Staff verifies and saves pet record without manual re-typing.",
     "Functional", "Must", 1.0, "Eliminates 100% of redundant data entry, saving 4-6 minutes per intake.", "Frontend Lead"),

    # G3: Campus Biosecurity & Quarantine Telemetry
    ("G3", "Enforce compliance with Republic Act No. 9482 through active 14-day observation quarantine alerts for bite/scratch incidents and live vaccination badges.",
     "REQ-301", "The system shall allow authorized MDC clinic staff to log clinical treatment records, routine veterinary visits, and anti-rabies vaccination dates.",
     "Clinic staff submits vaccination record and next due date → System updates pet medical log and refreshes vaccination validity badge → Pet profile displays 'Fully Vaccinated'.",
     "Functional", "Must", 1.0, "Restricted to authenticated MDC personnel; updates live badge chips.", "Clinic Lead / Backend"),

    ("G3", "Enforce compliance with Republic Act No. 9482 through active 14-day observation quarantine alerts for bite/scratch incidents and live vaccination badges.",
     "REQ-302", "The system shall automatically calculate and display an active 14-day observation quarantine countdown badge upon logging an animal bite or scratch incident.",
     "Clinic staff submits bite incident record → System computes statutory expiry date (incident date + 14 days) and sets quarantine flag → Profile displays red quarantine alert banner with live remaining days/hours counter.",
     "Functional", "Must", 1.0, "Statutory compliance with Republic Act No. 9482 Section 5 biosecurity protocols.", "Full-Stack Lead"),

    ("G3", "Enforce compliance with Republic Act No. 9482 through active 14-day observation quarantine alerts for bite/scratch incidents and live vaccination badges.",
     "REQ-303", "The system shall restrict all clinical write endpoints strictly to authenticated users with the MDC_STAFF or ADMIN role.",
     "Incoming API request to /api/medical/* → DRF RBAC permission class verifies caller JWT role claim → Grants write access if MDC staff; otherwise returns HTTP 403 Forbidden.",
     "Functional", "Must", 1.0, "Gated by JWT claims; unauthorized student requests blocked at gateway.", "Security / Backend Lead"),

    # G4: Adoption Pipeline & Supply Logistics
    ("G4", "Provide clear inventory accountability broken down by operational physical units (kg, cans, vials, pieces) and a digitized end-to-end adoption review pipeline.",
     "REQ-401", "The system shall provide a multi-step digital adoption application form capturing applicant background, residence type, and pet care experience.",
     "User completes adoption form and submits application → System validates required fields and sets status to 'Pending' → Application queued in Administrative Review Dashboard.",
     "Functional", "Must", 1.0, "Includes validation on contact numbers, landlord permissions, and residence.", "Frontend Lead"),

    ("G4", "Provide clear inventory accountability broken down by operational physical units (kg, cans, vials, pieces) and a digitized end-to-end adoption review pipeline.",
     "REQ-402", "The system shall allow authorized welfare staff to review, approve, or reject pending adoption applications with automated status mutation on the pet profile.",
     "Staff reviews application in Shelter Dashboard and clicks 'Approve' → System changes application state to 'Approved' and pet status to 'Adopted' → Public adoption gallery updates in real-time.",
     "Functional", "Must", 1.0, "Automates pet status transition upon administrative approval.", "Backend / Staff Lead"),

    ("G4", "Provide clear inventory accountability broken down by operational physical units (kg, cans, vials, pieces) and a digitized end-to-end adoption review pipeline.",
     "REQ-403", "The system shall track supply inventory intake and disbursements strictly categorized by standardized operational physical units (kg, cans, vials, pieces).",
     "Staff logs supply donation with quantity and enum unit → System updates active stock ledger and creates an immutable audit trail transaction record → Real-time stock levels displayed on dashboard.",
     "Functional", "Must", 1.0, "Strict Django TextChoices enum prevents arbitrary unit entries.", "Backend / Inventory Lead"),

    ("G4", "Provide clear inventory accountability broken down by operational physical units (kg, cans, vials, pieces) and a digitized end-to-end adoption review pipeline.",
     "REQ-404", "The system shall enforce boundary checks preventing disbursements from exceeding active on-hand quantities, preventing negative inventory.",
     "Staff attempts to deduct quantity exceeding available stock → System evaluates quantity constraint and blocks deduction → UI displays insufficient stock warning modal.",
     "Functional", "Must", 1.0, "Boundary validation verified in TC-SUP-003; zero negative stock entries.", "Backend Lead"),

    # G5: Usability, Onboarding & Institutional Governance
    ("G5", "Achieve high learnability, low cognitive load, visual coherence with CIT-U branding, and SUS usability benchmark ≥ 80.0 through interactive onboarding and mobile viewport ergonomics.",
     "REQ-501", "The system shall provide an aggregated community newsfeed displaying pet welfare posts, sighting telemetry, likes, comments, and campus companion counts.",
     "User accesses homepage → System fetches newsfeed stream and live telemetry aggregates → Render interactive timeline with like and comment interactions.",
     "Functional", "Must", 1.0, "Includes live telemetry metrics bar and community reaction toggles.", "Frontend Lead"),

    ("G5", "Achieve high learnability, low cognitive load, visual coherence with CIT-U branding, and SUS usability benchmark ≥ 80.0 through interactive onboarding and mobile viewport ergonomics.",
     "REQ-502", "The system shall provide an interactive 4-step onboarding walkthrough (UserGuideModal.jsx) triggered on first login and accessible via the persistent navigation bar.",
     "First-time user opens portal → System checks localStorage flag and launches walkthrough modal explaining QR scanning, search, sightings, and adoption → Dismissal sets completion flag.",
     "Functional", "Must", 1.0, "Directly targets SUS score uplift (raising baseline from 62.32 to ≥ 80.0).", "UI / UX Lead"),

    ("G5", "Achieve high learnability, low cognitive load, visual coherence with CIT-U branding, and SUS usability benchmark ≥ 80.0 through interactive onboarding and mobile viewport ergonomics.",
     "REQ-503", "The system shall enforce institutional account registration restricted exclusively to @cit.edu email addresses and XX-XXXX-XXX ID number format.",
     "User enters email and ID → System validates institutional domain and regex syntax → Creates account with hashed password and returns authenticated JWT session payload.",
     "Functional", "Must", 1.0, "Enforces automatic JWT session handoff post-registration (resolved INC-03).", "Security / Auth Lead"),

    ("G5", "Achieve high learnability, low cognitive load, visual coherence with CIT-U branding, and SUS usability benchmark ≥ 80.0 through interactive onboarding and mobile viewport ergonomics.",
     "REQ-504", "The system shall maintain dynamic mobile viewport layouts (100dvh) with input auto-scrolling to prevent virtual keyboard occlusion of form elements.",
     "Mobile user taps into password input field → Layout dynamically resizes and triggers smooth scroll to center → Password field, eye visibility toggle, and submit button remain fully visible.",
     "Non-functional", "Must", 1.0, "Resolved mobile keyboard overlap on 375px screens (INC-01).", "UI / UX Lead"),

    ("G5", "Achieve high learnability, low cognitive load, visual coherence with CIT-U branding, and SUS usability benchmark ≥ 80.0 through interactive onboarding and mobile viewport ergonomics.",
     "REQ-505", "The system shall automatically terminate user sessions and purge stored tokens after 15 minutes of continuous user inactivity on client terminals.",
     "Inactivity timer detects 15 minutes of zero user interaction → Client removes JWT token from localStorage and revokes session → Redirects to login with timeout notice.",
     "Non-functional", "Must", 1.0, "Protects public campus workstation terminals from session hijacking.", "Security Lead"),

    # G6: Performance, Asset Generation & Availability
    ("G6", "Ensure sub-500ms client asset generation, 99.5% operational uptime, and WCAG 2.1 AA accessibility compliance.",
     "REQ-601", "The system shall render a client-side printable 300 DPI QR collar tag graphic badge in under 500 milliseconds.",
     "User clicks 'Generate Collar Tag QR' on pet profile → HTML5 canvas renders 1200x1200px graphic with CIT-U Maroon border and QR matrix → File downloaded as PNG in < 500ms.",
     "Non-functional", "Must", 1.0, "Canvas generation completed in 185ms (315ms buffer under threshold).", "Frontend Lead"),

    ("G6", "Ensure sub-500ms client asset generation, 99.5% operational uptime, and WCAG 2.1 AA accessibility compliance.",
     "REQ-602", "The system shall comply with WCAG 2.1 AA color contrast standards across all telemetry badges and status chips (Green for vaccinated, Red for quarantine, Amber for pending).",
     "System renders status badges on profiles and tables → Visual contrast ratio meets or exceeds 4.5:1 against card backgrounds → Clear legibility across mobile displays.",
     "Non-functional", "Must", 1.0, "Contrast verified across mobile displays and dark/light backgrounds.", "UI / UX Lead"),

    ("G6", "Ensure sub-500ms client asset generation, 99.5% operational uptime, and WCAG 2.1 AA accessibility compliance.",
     "REQ-603", "The system shall maintain 99.5% operational uptime during university operating hours with automated daily Supabase database backups.",
     "Production instance operates under monitoring watchdog → Supabase automated schedule runs nightly snapshot → Service continuously accessible via HTTPS/TLS 1.3.",
     "Non-functional", "Must", 1.0, "Hosted on Supabase cloud PostgreSQL with SSL/TLS encryption.", "DevOps / Backend Lead")
]

traceability_data = [
    ("REQ-101", "UC-1.1, AD-1.1, WF-1.1", "CD-1.1, SD-1.1, UI-1.1, DB-1.1", "CollarQRScanner.jsx, views.py", "TC-QR-001", "Passed"),
    ("REQ-102", "UC-1.1, AD-1.1, WF-1.1", "CD-1.1, SD-1.1, UI-1.1, DB-1.1", "CollarQRScanner.jsx", "TC-QR-002", "Passed"),
    ("REQ-103", "UC-1.3, AD-1.3, WF-1.3", "CD-1.3, SD-1.3, UI-1.3, DB-1.3", "PetAISearchAPIView, views.py", "TC-REG-003", "Passed"),
    ("REQ-201", "UC-3.2, AD-3.2, WF-3.2", "CD-3.2, SD-3.2, UI-3.2, DB-3.2", "ReportSightingView.jsx, views.py", "TC-SGT-001", "Passed"),
    ("REQ-202", "UC-3.2, AD-3.2, WF-3.2", "CD-3.2, SD-3.2, UI-3.2, DB-3.2", "ReportSightingView.jsx, EmergencyProtocolModal.jsx", "TC-SGT-002", "Passed"),
    ("REQ-203", "UC-1.3, AD-1.3, WF-1.3", "CD-1.3, SD-1.3, UI-1.3, DB-1.3", "AddNewPet.jsx, ReportSightingView.jsx", "TC-SGT-003, TC-REG-001", "Passed"),
    ("REQ-301", "UC-1.2, AD-1.2, WF-1.2", "CD-1.2, SD-1.2, UI-1.2, DB-1.2", "MedicalLogs.jsx, views.py", "TC-MED-001", "Passed"),
    ("REQ-302", "UC-1.2, AD-1.2, WF-1.2", "CD-1.2, SD-1.2, UI-1.2, DB-1.2", "MedicalLogs.jsx, views.py", "TC-MED-002", "Passed"),
    ("REQ-303", "UC-1.2, AD-1.2, WF-1.2", "CD-1.2, SD-1.2, UI-1.2, DB-1.2", "MDCAuthGate.jsx, views.py", "TC-MED-003, TC-SEC-001", "Passed"),
    ("REQ-401", "UC-2.1, AD-2.1, WF-2.1", "CD-2.1, SD-2.1, UI-2.1, DB-2.1", "AdoptionGallery.jsx, views.py", "TC-ADPT-001, TC-ADPT-002", "Passed"),
    ("REQ-402", "UC-2.1, AD-2.1, WF-2.1", "CD-2.1, SD-2.1, UI-2.1, DB-2.1", "StaffDashboard.jsx, views.py", "TC-ADPT-003", "Passed"),
    ("REQ-403", "UC-2.2, AD-2.2, WF-2.2", "CD-2.2, SD-2.2, UI-2.2, DB-2.2", "InventoryView.jsx, models.py, views.py", "TC-SUP-001, TC-SUP-002", "Passed"),
    ("REQ-404", "UC-2.2, AD-2.2, WF-2.2", "CD-2.2, SD-2.2, UI-2.2, DB-2.2", "InventoryView.jsx, views.py", "TC-SUP-003", "Passed"),
    ("REQ-501", "UC-3.1, AD-3.1, WF-3.1", "CD-3.1, SD-3.1, UI-3.1, DB-3.1", "NewsfeedView.jsx, views.py", "TC-FEED-001", "Passed"),
    ("REQ-502", "UC-4.1, AD-4.1, WF-4.1", "CD-4.1, SD-4.1, UI-4.1, DB-4.1", "UserGuideModal.jsx, Navbar.jsx", "TC-ONB-001", "Passed"),
    ("REQ-503", "UC-4.2, AD-4.2, WF-4.2", "CD-4.2, SD-4.2, UI-4.2, DB-4.2", "RegisterUserView.jsx, views.py", "TC-AUTH-001, TC-AUTH-002", "Passed"),
    ("REQ-504", "UC-4.2, AD-4.2, WF-4.2", "CD-4.2, SD-4.2, UI-4.2", "LoginForm.jsx", "TC-AUTH-003", "Passed"),
    ("REQ-505", "UC-4.2, AD-4.2, WF-4.2", "CD-4.2, SD-4.2, DB-4.2", "JWTAuthMiddleware, App.jsx", "TC-AUTH-004", "Passed"),
    ("REQ-601", "UC-1.3, AD-1.3, WF-1.3", "CD-1.3, SD-1.3, UI-1.3", "AddNewPet.jsx, canvasTagGenerator.js", "TC-REG-002, TC-PERF-001", "Passed"),
    ("REQ-602", "Section 3.4 (Usability)", "Section 1.3 (Style Guide)", "Global CSS, StatusChip.jsx", "TC-USA-001", "Passed"),
    ("REQ-603", "Section 3.4 (Reliability)", "Architectural Design", "render.yaml, Supabase Cloud", "TC-SEC-001", "Passed")
]

# ==========================================
# 2. GENERATE EXCEL FILE (.xlsx)
# ==========================================
wb = openpyxl.Workbook()

# Sheet 1: Requirements Inventory
ws1 = wb.active
ws1.title = "Requirements Inventory"

# Styling definitions
font_title = Font(name="Times New Roman", size=14, bold=True, color="800000")
font_subtitle = Font(name="Times New Roman", size=10, italic=True, color="444444")
font_header = Font(name="Times New Roman", size=10, bold=True, color="FFFFFF")
font_data = Font(name="Times New Roman", size=9.5, color="111111")
font_data_bold = Font(name="Times New Roman", size=9.5, bold=True, color="111111")

fill_header = PatternFill(start_color="800000", end_color="800000", fill_type="solid")
fill_zebra = PatternFill(start_color="F9F6F0", end_color="F9F6F0", fill_type="solid")
fill_white = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

thin_border = Border(
    left=Side(style='thin', color='777777'),
    right=Side(style='thin', color='777777'),
    top=Side(style='thin', color='777777'),
    bottom=Side(style='thin', color='777777')
)

align_left = Alignment(horizontal="left", vertical="top", wrap_text=True)
align_center = Alignment(horizontal="center", vertical="top", wrap_text=True)
align_header = Alignment(horizontal="center", vertical="center", wrap_text=True)

# Title Block on WS1
ws1["A1"] = "Task Force Bruno - Requirements Inventory (Catalog)"
ws1["A1"].font = font_title
ws1["A2"] = "Cebu Institute of Technology - University • College of Computer Studies • Capstone 2 (IT332)"
ws1["A2"].font = font_subtitle

headers_inv = [
    "Goal ID", "SMART Goal", "Requirement ID", "Requirement Statement", 
    "Transaction (Input → Process → Output)", "Type", "Priority", 
    "Status Percentage", "Notes / Issues", "Owner"
]

row_num = 4
for col_idx, h in enumerate(headers_inv, 1):
    c = ws1.cell(row=row_num, column=col_idx, value=h)
    c.font = font_header
    c.fill = fill_header
    c.alignment = align_header
    c.border = thin_border
ws1.row_dimensions[row_num].height = 28

for row_idx, r_data in enumerate(inventory_data, start=row_num+1):
    current_fill = fill_zebra if row_idx % 2 == 1 else fill_white
    for col_idx, val in enumerate(r_data, 1):
        c = ws1.cell(row=row_idx, column=col_idx, value=val)
        c.font = font_data_bold if col_idx in [1, 3] else font_data
        c.fill = current_fill
        c.border = thin_border
        if col_idx in [1, 3, 6, 7]:
            c.alignment = align_center
        elif col_idx == 8:
            c.alignment = align_center
            c.number_format = '0%'
        else:
            c.alignment = align_left
    ws1.row_dimensions[row_idx].height = 55

# Set Column Widths for WS1
col_widths_ws1 = [10, 32, 14, 38, 45, 14, 10, 14, 32, 18]
for i, w in enumerate(col_widths_ws1, 1):
    ws1.column_dimensions[get_column_letter(i)].width = w

# Sheet 2: Traceability Matrix
ws2 = wb.create_sheet(title="Traceability Matrix")

ws2["A1"] = "Task Force Bruno - Requirements Traceability Matrix (RTM)"
ws2["A1"].font = font_title
ws2["A2"] = "Updated SRS v2.0 → Updated SDD v3.1 → System Features → Implementation Components → Test Cases (STD v2.0)"
ws2["A2"].font = font_subtitle

headers_trace = [
    "Requirement ID",
    "SRS Reference\n(Use Cases, Activity Diagrams, Wireframes)",
    "SDD Reference\n(Class Diagrams, Sequence Diagrams, User Interfaces, Databases)",
    "Implementation Module(s)/Component(s)",
    "STD Reference\n(Test Case IDs)",
    "Status"
]

row_num = 4
for col_idx, h in enumerate(headers_trace, 1):
    c = ws2.cell(row=row_num, column=col_idx, value=h)
    c.font = font_header
    c.fill = fill_header
    c.alignment = align_header
    c.border = thin_border
ws2.row_dimensions[row_num].height = 32

for row_idx, r_data in enumerate(traceability_data, start=row_num+1):
    current_fill = fill_zebra if row_idx % 2 == 1 else fill_white
    for col_idx, val in enumerate(r_data, 1):
        c = ws2.cell(row=row_idx, column=col_idx, value=val)
        c.font = font_data_bold if col_idx in [1, 6] else font_data
        c.fill = current_fill
        c.border = thin_border
        if col_idx in [1, 6]:
            c.alignment = align_center
        else:
            c.alignment = align_left
    ws2.row_dimensions[row_idx].height = 36

# Set Column Widths for WS2
col_widths_ws2 = [16, 26, 32, 36, 24, 14]
for i, w in enumerate(col_widths_ws2, 1):
    ws2.column_dimensions[get_column_letter(i)].width = w

excel_path = Path("docs/Task_Force_Bruno_Requirements_Inventory_and_Traceability_Matrix.xlsx").resolve()
wb.save(excel_path)
print(f"Successfully generated Excel workbook at: {excel_path}")


# ==========================================
# 3. GENERATE ACADEMIC PDF FILE
# ==========================================

# Format tables for HTML
inv_rows_html = ""
for idx, r in enumerate(inventory_data):
    bg_style = 'style="background-color: #faf6f0;"' if idx % 2 == 1 else ''
    pct_display = f"{int(r[7]*100)}%"
    inv_rows_html += f"""
    <tr {bg_style}>
      <td style="text-align: center; font-weight: bold; color: #800000;">{r[0]}</td>
      <td><strong>{r[1][:50]}...</strong></td>
      <td style="text-align: center; font-weight: bold;">{r[2]}</td>
      <td>{r[3]}</td>
      <td style="font-size: 8pt; color: #333333;">{r[4]}</td>
      <td style="text-align: center;"><span class="badge badge-type">{r[5]}</span></td>
      <td style="text-align: center;"><span class="badge badge-priority">{r[6]}</span></td>
      <td style="text-align: center; font-weight: bold; color: #155724;">{pct_display}</td>
      <td style="font-size: 8pt;">{r[8]}</td>
      <td>{r[9]}</td>
    </tr>
    """

trace_rows_html = ""
for idx, r in enumerate(traceability_data):
    bg_style = 'style="background-color: #faf6f0;"' if idx % 2 == 1 else ''
    trace_rows_html += f"""
    <tr {bg_style}>
      <td style="text-align: center; font-weight: bold; color: #800000;">{r[0]}</td>
      <td>{r[1]}</td>
      <td>{r[2]}</td>
      <td><code>{r[3]}</code></td>
      <td><strong>{r[4]}</strong></td>
      <td style="text-align: center;"><span class="badge badge-pass">{r[5]}</span></td>
    </tr>
    """

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Task Force Bruno - Requirements Inventory and Traceability Matrix</title>
<style>
  @page {{
    size: letter landscape;
    margin: 0.6in 0.65in 0.6in 0.65in;
  }}

  body {{
    font-family: 'Times New Roman', Times, serif;
    color: #111111;
    line-height: 1.28;
    font-size: 9pt;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }}

  /* Title Block */
  .title-block {{
    text-align: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #800000;
  }}

  .inst-name {{
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #800000;
    margin-bottom: 2px;
  }}

  .dept-name {{
    font-size: 9.5pt;
    color: #333333;
    margin-bottom: 6px;
  }}

  .paper-title {{
    font-size: 14pt;
    font-weight: bold;
    margin-bottom: 2px;
    text-transform: uppercase;
    color: #111111;
  }}

  .paper-subtitle {{
    font-size: 9.5pt;
    font-style: italic;
    color: #444444;
    margin-bottom: 6px;
  }}

  .meta-table {{
    width: 100%;
    margin: 2px 0 0 0;
    font-size: 8.5pt;
    border: none;
  }}

  .meta-table td {{
    border: none;
    padding: 1px 4px;
  }}

  h1 {{
    font-size: 11pt;
    font-weight: bold;
    color: #800000;
    text-transform: uppercase;
    margin-top: 14px;
    margin-bottom: 4px;
    border-bottom: 1px solid #800000;
    padding-bottom: 2px;
    page-break-after: avoid;
    break-after: avoid;
  }}

  p {{
    margin: 0 0 4px 0;
    text-align: justify;
    text-indent: 0.2in;
    font-size: 9pt;
  }}

  p.no-indent {{
    text-indent: 0;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 10px 0;
    font-size: 8pt;
    page-break-inside: auto;
  }}

  tr {{
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  th, td {{
    border: 1px solid #555555;
    padding: 4px 5px;
    text-align: left;
    vertical-align: top;
  }}

  th {{
    background-color: #800000;
    color: #ffffff;
    font-weight: bold;
    font-size: 8pt;
    text-align: center;
  }}

  .badge {{
    display: inline-block;
    padding: 1px 4px;
    font-size: 7.5pt;
    font-weight: bold;
    border-radius: 3px;
  }}
  .badge-pass {{ background-color: #d4edda; color: #155724; }}
  .badge-type {{ background-color: #e2e3e5; color: #383d41; }}
  .badge-priority {{ background-color: #fff3cd; color: #856404; }}

  .section-break {{
    page-break-before: always;
    break-before: page;
  }}

  code {{
    font-family: Consolas, monospace;
    font-size: 7.5pt;
    background-color: #f1f1f1;
    padding: 1px 2px;
  }}
</style>
</head>
<body>

  <!-- Title Block -->
  <div class="title-block">
    <div class="inst-name">Cebu Institute of Technology – University</div>
    <div class="dept-name">College of Computer Studies • Department of Information Technology<br>IT332 – Capstone Project 2: Systems Development &amp; Research Validation</div>
    <div class="paper-title">Requirements Inventory &amp; Requirements Traceability Matrix (RTM)</div>
    <div class="paper-subtitle">Formal Specification Derived from Updated SRS v2.0, Updated SDD v3.1, and Software Test Document (STD v2.0)</div>
    
    <table class="meta-table">
      <tr>
        <td style="width: 45%;"><strong>System:</strong> Task Force Bruno (Campus Pet Management Portal)</td>
        <td style="width: 25%; text-align: center;"><strong>Team:</strong> Team 18 (Task Force Bruno)</td>
        <td style="width: 30%; text-align: right;"><strong>Document Version:</strong> 2.0 (Post-Refactoring Release)</td>
      </tr>
      <tr>
        <td><strong>Institutional Scope:</strong> CIT-U Campus Premises &amp; RA 9482 Compliance</td>
        <td style="text-align: center;"><strong>Total Requirements:</strong> 21 Requirements Active</td>
        <td style="text-align: right;"><strong>Verification Status:</strong> 100% Passed (STD v2.0 Verified)</td>
      </tr>
    </table>
  </div>

  <!-- Section 1: Executive Overview -->
  <h1>1. Overview &amp; Traceability Methodology</h1>
  <p>
    This document serves as the formal engineering catalog and verification bridge for <strong>Task Force Bruno: Integrated Campus Pet Management System</strong> at <strong>Cebu Institute of Technology – University (CIT-U)</strong>. Prepared in strict accordance with Capstone 2 standards, this submission couples two fundamental systems engineering artifacts:
  </p>
  <p class="no-indent" style="margin-left: 0.2in;">
    <strong>1. Requirements Inventory (Catalog):</strong> Defines each institutional requirement derived from the project's SMART goals, detailing the exact operational transaction (<em>Input ➔ Process ➔ Output</em>), categorization, priority, status percentage, and subsystem ownership.<br>
    <strong>2. Requirements Traceability Matrix (RTM):</strong> Establishes bidirectional traceability connecting each requirement through the engineering lifecycle: from <em>Updated SRS v2.0</em> specifications (Use Cases, Activity Diagrams, Wireframes) to <em>Updated SDD v3.1</em> architecture (Class Diagrams, Sequence Diagrams, User Interfaces, Database Schemas), software implementation components, and final <em>STD v2.0</em> test verification cases.
  </p>

  <!-- Section 2: Requirements Inventory -->
  <h1>2. Requirements Inventory (Functional &amp; Non-Functional Specifications)</h1>
  <p class="no-indent">
    Table 1 itemizes the 21 active system requirements categorized by primary SMART Goal ID (G1–G6) and transaction lifecycle:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">Goal ID</th>
        <th style="width: 14%;">SMART Goal</th>
        <th style="width: 7%;">Req. ID</th>
        <th style="width: 17%;">Requirement Statement</th>
        <th style="width: 21%;">Transaction (Input ➔ Process ➔ Output)</th>
        <th style="width: 7%;">Type</th>
        <th style="width: 5%;">Priority</th>
        <th style="width: 5%;">Status %</th>
        <th style="width: 11%;">Notes / Issues</th>
        <th style="width: 8%;">Owner</th>
      </tr>
    </thead>
    <tbody>
      {inv_rows_html}
    </tbody>
  </table>

  <!-- Section 3: Traceability Matrix -->
  <div class="section-break"></div>
  <h1>3. Requirements Traceability Matrix (RTM)</h1>
  <p class="no-indent">
    Table 2 maps every active requirement to its formal design artifacts in the Updated SRS v2.0 and SDD v3.1, its physical implementation modules, and its execution outcome in the Software Test Document (STD v2.0):
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 9%;">Requirement ID</th>
        <th style="width: 18%;">SRS Reference<br><span style="font-size: 7pt; font-weight: normal;">(Use Cases, Activity Diagrams, Wireframes)</span></th>
        <th style="width: 22%;">SDD Reference<br><span style="font-size: 7pt; font-weight: normal;">(Class Diagrams, Sequence Diagrams, UIs, DBs)</span></th>
        <th style="width: 27%;">Implementation Module(s) / Component(s)</th>
        <th style="width: 16%;">STD Reference<br><span style="font-size: 7pt; font-weight: normal;">(Test Case IDs)</span></th>
        <th style="width: 8%;">Status</th>
      </tr>
    </thead>
    <tbody>
      {trace_rows_html}
    </tbody>
  </table>

  <!-- Section 4: Sign-off -->
  <h1>4. Traceability Audit &amp; Engineering Sign-Off</h1>
  <p class="no-indent">
    Every requirement listed has been traced to a concrete implementation component and verified via comprehensive test execution documented in the Software Test Document (STD v2.0). All defect incidents identified during MVP validation (INC-01 through INC-05) have been systematically resolved and certified:
  </p>

  <table style="margin-top: 10px;">
    <thead>
      <tr>
        <th style="width: 25%;">Role</th>
        <th style="width: 30%;">Name &amp; Designation</th>
        <th style="width: 20%;">Signature</th>
        <th style="width: 25%;">Date of Audit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Lead Systems Architect</strong></td>
        <td>Task Force Bruno Development Lead</td>
        <td>______________________</td>
        <td>October 10, 2026</td>
      </tr>
      <tr>
        <td><strong>QA &amp; Verification Lead</strong></td>
        <td>Team 18 QA Specialist</td>
        <td>______________________</td>
        <td>October 10, 2026</td>
      </tr>
      <tr>
        <td><strong>Clinical Stakeholder</strong></td>
        <td>CIT-U Medical-Dental Clinic (MDC) Rep</td>
        <td>______________________</td>
        <td>October 10, 2026</td>
      </tr>
      <tr>
        <td><strong>Capstone Project Adviser</strong></td>
        <td>College of Computer Studies Faculty</td>
        <td>______________________</td>
        <td>October 10, 2026</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: center; margin-top: 18px; font-size: 8.5pt; color: #555555; text-indent: 0;">
    — End of Traceability Matrix &amp; Requirements Inventory —<br>
    <strong>Task Force Bruno Capstone Engineering &amp; Research Team</strong><br>
    Department of Information Technology • Cebu Institute of Technology – University
  </p>

</body>
</html>
"""

temp_html = Path("docs/temp_rtm_inventory.html")
temp_html.write_text(html_content, encoding="utf-8")

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
pdf_out = Path("docs/Task_Force_Bruno_Requirements_Inventory_and_Traceability_Matrix.pdf").resolve()

cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    f"--print-to-pdf={pdf_out}",
    "--no-pdf-header-footer",
    str(temp_html.resolve())
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("Edge compile exit code:", res.returncode)

if temp_html.exists():
    temp_html.unlink()

print(f"Successfully generated RTM and Inventory PDF at: {pdf_out}")

