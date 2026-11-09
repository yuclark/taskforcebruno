# 📋 Task Force Bruno: Requirements Inventory & Requirements Traceability Matrix (RTM)
**Document Version:** 2.0 (Post-Refactoring System Release)  
**System:** Task Force Bruno – Integrated Campus Pet Management System (Wildcat Welfare Portal)  
**Institutional Affiliation:** Cebu Institute of Technology – University (CIT-U)  
**Department:** College of Computer Studies • Department of Information Technology  
**Course:** IT332 – Capstone Project 2: Systems Development & Research Validation  
**Baseline Documents:** Updated SRS v2.0 & Updated SDD v3.1  
**Verification Benchmark:** Software Test Document (STD v2.0)  

---

## 📑 Table of Contents
1. [Overview & Traceability Methodology](#1-overview--traceability-methodology)
2. [Requirements Inventory (Catalog)](#2-requirements-inventory-catalog)
3. [Requirements Traceability Matrix (RTM)](#3-requirements-traceability-matrix-rtm)
4. [Traceability Audit & Engineering Sign-Off](#4-traceability-audit--engineering-sign-off)

---

## 1. Overview & Traceability Methodology

This document couples the **Requirements Inventory** and the **Requirements Traceability Matrix (RTM)** for Task Force Bruno, operationalizing the bidirectional linkage between project goals, formal software specifications, implementation modules, and verification test cases:

\\text{SMART Goals} \\longrightarrow \\text{Requirements Catalog} \\longrightarrow \\text{SRS v2.0 / SDD v3.1} \\longrightarrow \\text{Implementation Components} \\longrightarrow \\text{STD v2.0 Test Cases} \\longrightarrow \\text{Verification Pass}

---

## 2. Requirements Inventory (Catalog)

| Goal ID | SMART Goal | Requirement ID | Requirement Statement | Transaction (Input → Process → Output) | Type | Priority | Status % | Notes / Issues | Owner |
| :---: | :--- | :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **G1** | Enable rapid lookup of companion identity, vaccination status, and emergency contacts via QR scanner and AI search without mandatory login in ≤ 25s. | **REQ-101** | The system shall provide unauthenticated public access to the Emergency Pet Passport upon scanning a physical QR collar tag. | User points camera at QR tag → System captures matrix and resolves pet ID → Browser displays emergency contacts and rabies vaccination badge without requiring authentication. | Functional | Must | 100% | Verified with Bruno PET-001; public passport renders in < 1.0s. | Mobile / Frontend Lead |
| **G1** | Enable rapid lookup of companion identity, vaccination status, and emergency contacts via QR scanner and AI search without mandatory login in ≤ 25s. | **REQ-102** | The system shall provide a client-side static image QR decoding fallback when hardware camera permissions are denied or unavailable. | Camera permission denied / user selects file → System accepts static image upload and decodes matrix via canvas jsQR → Pet profile resolved without server roundtrip. | Functional | Must | 100% | Resolved post-MVP (INC-02); tested on Android WebKit and iOS Safari. | Frontend Lead |
| **G1** | Enable rapid lookup of companion identity, vaccination status, and emergency contacts via QR scanner and AI search without mandatory login in ≤ 25s. | **REQ-103** | The system shall allow users to search campus pet profiles using natural language physical trait descriptors and location heuristics. | User inputs search query (e.g. 'calico white paws canteen') → PetAISearchAPIView tokenizes descriptors → Grid of matching companion profiles returned. | Functional | Should | 100% | Heuristic search active; filters by coat pattern, color, and landmark. | Backend Lead |
| **G2** | Digitize 100% of campus animal sightings with photos and landmarks, enabling 1-click administrative intake into the pet registry with zero redundant data entry. | **REQ-201** | The system shall capture crowdsourced stray animal sightings with mandatory photo upload and standardized CIT-U campus landmark selection. | Student fills sighting form and selects campus landmark from dropdown → System uploads image to Supabase and saves record → New feed item published. | Functional | Must | 100% | Replaced free text with standardized 8-zone landmark dictionary (INC-05). | Frontend / Backend Lead |
| **G2** | Digitize 100% of campus animal sightings with photos and landmarks, enabling 1-click administrative intake into the pet registry with zero redundant data entry. | **REQ-202** | The system shall provide an Emergency Sentinel priority selector for sightings of injured animals, sick strays, or active bite risks. | User toggles 'Emergency: Bite / Scratch Risk' → System displays immediate RA 9482 first-aid guidance and flags post with urgent red banner and clinic hotline → High-priority alert broadcast on campus feed. | Functional | Must | 100% | Provides immediate 15-minute soap/water wash instructions and direct MDC hotline link. | Full-Stack Lead |
| **G2** | Digitize 100% of campus animal sightings with photos and landmarks, enabling 1-click administrative intake into the pet registry with zero redundant data entry. | **REQ-203** | The system shall enable authorized staff to admit verified stray sightings into official pet registration via a 1-click state handoff. | Staff clicks 'Admit & Intake Stray' on sighting card → System routes to Add New Pet form auto-populating photo, species, and landmark → Staff verifies and saves pet record without manual re-typing. | Functional | Must | 100% | Eliminates 100% of redundant data entry, saving 4-6 minutes per intake. | Frontend Lead |
| **G3** | Enforce compliance with Republic Act No. 9482 through active 14-day observation quarantine alerts for bite/scratch incidents and live vaccination badges. | **REQ-301** | The system shall allow authorized MDC clinic staff to log clinical treatment records, routine veterinary visits, and anti-rabies vaccination dates. | Clinic staff submits vaccination record and next due date → System updates pet medical log and refreshes vaccination validity badge → Pet profile displays 'Fully Vaccinated'. | Functional | Must | 100% | Restricted to authenticated MDC personnel; updates live badge chips. | Clinic Lead / Backend |
| **G3** | Enforce compliance with Republic Act No. 9482 through active 14-day observation quarantine alerts for bite/scratch incidents and live vaccination badges. | **REQ-302** | The system shall automatically calculate and display an active 14-day observation quarantine countdown badge upon logging an animal bite or scratch incident. | Clinic staff submits bite incident record → System computes statutory expiry date (incident date + 14 days) and sets quarantine flag → Profile displays red quarantine alert banner with live remaining days/hours counter. | Functional | Must | 100% | Statutory compliance with Republic Act No. 9482 Section 5 biosecurity protocols. | Full-Stack Lead |
| **G3** | Enforce compliance with Republic Act No. 9482 through active 14-day observation quarantine alerts for bite/scratch incidents and live vaccination badges. | **REQ-303** | The system shall restrict all clinical write endpoints strictly to authenticated users with the MDC_STAFF or ADMIN role. | Incoming API request to /api/medical/* → DRF RBAC permission class verifies caller JWT role claim → Grants write access if MDC staff; otherwise returns HTTP 403 Forbidden. | Functional | Must | 100% | Gated by JWT claims; unauthorized student requests blocked at gateway. | Security / Backend Lead |
| **G4** | Provide clear inventory accountability broken down by operational physical units (kg, cans, vials, pieces) and a digitized end-to-end adoption review pipeline. | **REQ-401** | The system shall provide a multi-step digital adoption application form capturing applicant background, residence type, and pet care experience. | User completes adoption form and submits application → System validates required fields and sets status to 'Pending' → Application queued in Administrative Review Dashboard. | Functional | Must | 100% | Includes validation on contact numbers, landlord permissions, and residence. | Frontend Lead |
| **G4** | Provide clear inventory accountability broken down by operational physical units (kg, cans, vials, pieces) and a digitized end-to-end adoption review pipeline. | **REQ-402** | The system shall allow authorized welfare staff to review, approve, or reject pending adoption applications with automated status mutation on the pet profile. | Staff reviews application in Shelter Dashboard and clicks 'Approve' → System changes application state to 'Approved' and pet status to 'Adopted' → Public adoption gallery updates in real-time. | Functional | Must | 100% | Automates pet status transition upon administrative approval. | Backend / Staff Lead |
| **G4** | Provide clear inventory accountability broken down by operational physical units (kg, cans, vials, pieces) and a digitized end-to-end adoption review pipeline. | **REQ-403** | The system shall track supply inventory intake and disbursements strictly categorized by standardized operational physical units (kg, cans, vials, pieces). | Staff logs supply donation with quantity and enum unit → System updates active stock ledger and creates an immutable audit trail transaction record → Real-time stock levels displayed on dashboard. | Functional | Must | 100% | Strict Django TextChoices enum prevents arbitrary unit entries. | Backend / Inventory Lead |
| **G4** | Provide clear inventory accountability broken down by operational physical units (kg, cans, vials, pieces) and a digitized end-to-end adoption review pipeline. | **REQ-404** | The system shall enforce boundary checks preventing disbursements from exceeding active on-hand quantities, preventing negative inventory. | Staff attempts to deduct quantity exceeding available stock → System evaluates quantity constraint and blocks deduction → UI displays insufficient stock warning modal. | Functional | Must | 100% | Boundary validation verified in TC-SUP-003; zero negative stock entries. | Backend Lead |
| **G5** | Achieve high learnability, low cognitive load, visual coherence with CIT-U branding, and SUS usability benchmark ≥ 80.0 through interactive onboarding and mobile viewport ergonomics. | **REQ-501** | The system shall provide an aggregated community newsfeed displaying pet welfare posts, sighting telemetry, likes, comments, and campus companion counts. | User accesses homepage → System fetches newsfeed stream and live telemetry aggregates → Render interactive timeline with like and comment interactions. | Functional | Must | 100% | Includes live telemetry metrics bar and community reaction toggles. | Frontend Lead |
| **G5** | Achieve high learnability, low cognitive load, visual coherence with CIT-U branding, and SUS usability benchmark ≥ 80.0 through interactive onboarding and mobile viewport ergonomics. | **REQ-502** | The system shall provide an interactive 4-step onboarding walkthrough (UserGuideModal.jsx) triggered on first login and accessible via the persistent navigation bar. | First-time user opens portal → System checks localStorage flag and launches walkthrough modal explaining QR scanning, search, sightings, and adoption → Dismissal sets completion flag. | Functional | Must | 100% | Directly targets SUS score uplift (raising baseline from 62.32 to ≥ 80.0). | UI / UX Lead |
| **G5** | Achieve high learnability, low cognitive load, visual coherence with CIT-U branding, and SUS usability benchmark ≥ 80.0 through interactive onboarding and mobile viewport ergonomics. | **REQ-503** | The system shall enforce institutional account registration restricted exclusively to @cit.edu email addresses and XX-XXXX-XXX ID number format. | User enters email and ID → System validates institutional domain and regex syntax → Creates account with hashed password and returns authenticated JWT session payload. | Functional | Must | 100% | Enforces automatic JWT session handoff post-registration (resolved INC-03). | Security / Auth Lead |
| **G5** | Achieve high learnability, low cognitive load, visual coherence with CIT-U branding, and SUS usability benchmark ≥ 80.0 through interactive onboarding and mobile viewport ergonomics. | **REQ-504** | The system shall maintain dynamic mobile viewport layouts (100dvh) with input auto-scrolling to prevent virtual keyboard occlusion of form elements. | Mobile user taps into password input field → Layout dynamically resizes and triggers smooth scroll to center → Password field, eye visibility toggle, and submit button remain fully visible. | Non-functional | Must | 100% | Resolved mobile keyboard overlap on 375px screens (INC-01). | UI / UX Lead |
| **G5** | Achieve high learnability, low cognitive load, visual coherence with CIT-U branding, and SUS usability benchmark ≥ 80.0 through interactive onboarding and mobile viewport ergonomics. | **REQ-505** | The system shall automatically terminate user sessions and purge stored tokens after 15 minutes of continuous user inactivity on client terminals. | Inactivity timer detects 15 minutes of zero user interaction → Client removes JWT token from localStorage and revokes session → Redirects to login with timeout notice. | Non-functional | Must | 100% | Protects public campus workstation terminals from session hijacking. | Security Lead |
| **G6** | Ensure sub-500ms client asset generation, 99.5% operational uptime, and WCAG 2.1 AA accessibility compliance. | **REQ-601** | The system shall render a client-side printable 300 DPI QR collar tag graphic badge in under 500 milliseconds. | User clicks 'Generate Collar Tag QR' on pet profile → HTML5 canvas renders 1200x1200px graphic with CIT-U Maroon border and QR matrix → File downloaded as PNG in < 500ms. | Non-functional | Must | 100% | Canvas generation completed in 185ms (315ms buffer under threshold). | Frontend Lead |
| **G6** | Ensure sub-500ms client asset generation, 99.5% operational uptime, and WCAG 2.1 AA accessibility compliance. | **REQ-602** | The system shall comply with WCAG 2.1 AA color contrast standards across all telemetry badges and status chips (Green for vaccinated, Red for quarantine, Amber for pending). | System renders status badges on profiles and tables → Visual contrast ratio meets or exceeds 4.5:1 against card backgrounds → Clear legibility across mobile displays. | Non-functional | Must | 100% | Contrast verified across mobile displays and dark/light backgrounds. | UI / UX Lead |
| **G6** | Ensure sub-500ms client asset generation, 99.5% operational uptime, and WCAG 2.1 AA accessibility compliance. | **REQ-603** | The system shall maintain 99.5% operational uptime during university operating hours with automated daily Supabase database backups. | Production instance operates under monitoring watchdog → Supabase automated schedule runs nightly snapshot → Service continuously accessible via HTTPS/TLS 1.3. | Non-functional | Must | 100% | Hosted on Supabase cloud PostgreSQL with SSL/TLS encryption. | DevOps / Backend Lead |

---

## 3. Requirements Traceability Matrix (RTM)

| Requirement ID | SRS Reference<br>(Use Cases, Activity Diagrams, Wireframes) | SDD Reference<br>(Class Diagrams, Sequence Diagrams, UIs, DBs) | Implementation Module(s) / Component(s) | STD Reference<br>(Test Case IDs) | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **REQ-101** | UC-1.1, AD-1.1, WF-1.1 | CD-1.1, SD-1.1, UI-1.1, DB-1.1 | CollarQRScanner.jsx, views.py | **TC-QR-001** | **Passed** |
| **REQ-102** | UC-1.1, AD-1.1, WF-1.1 | CD-1.1, SD-1.1, UI-1.1, DB-1.1 | CollarQRScanner.jsx | **TC-QR-002** | **Passed** |
| **REQ-103** | UC-1.3, AD-1.3, WF-1.3 | CD-1.3, SD-1.3, UI-1.3, DB-1.3 | PetAISearchAPIView, views.py | **TC-REG-003** | **Passed** |
| **REQ-201** | UC-3.2, AD-3.2, WF-3.2 | CD-3.2, SD-3.2, UI-3.2, DB-3.2 | ReportSightingView.jsx, views.py | **TC-SGT-001** | **Passed** |
| **REQ-202** | UC-3.2, AD-3.2, WF-3.2 | CD-3.2, SD-3.2, UI-3.2, DB-3.2 | ReportSightingView.jsx, EmergencyProtocolModal.jsx | **TC-SGT-002** | **Passed** |
| **REQ-203** | UC-1.3, AD-1.3, WF-1.3 | CD-1.3, SD-1.3, UI-1.3, DB-1.3 | AddNewPet.jsx, ReportSightingView.jsx | **TC-SGT-003, TC-REG-001** | **Passed** |
| **REQ-301** | UC-1.2, AD-1.2, WF-1.2 | CD-1.2, SD-1.2, UI-1.2, DB-1.2 | MedicalLogs.jsx, views.py | **TC-MED-001** | **Passed** |
| **REQ-302** | UC-1.2, AD-1.2, WF-1.2 | CD-1.2, SD-1.2, UI-1.2, DB-1.2 | MedicalLogs.jsx, views.py | **TC-MED-002** | **Passed** |
| **REQ-303** | UC-1.2, AD-1.2, WF-1.2 | CD-1.2, SD-1.2, UI-1.2, DB-1.2 | MDCAuthGate.jsx, views.py | **TC-MED-003, TC-SEC-001** | **Passed** |
| **REQ-401** | UC-2.1, AD-2.1, WF-2.1 | CD-2.1, SD-2.1, UI-2.1, DB-2.1 | AdoptionGallery.jsx, views.py | **TC-ADPT-001, TC-ADPT-002** | **Passed** |
| **REQ-402** | UC-2.1, AD-2.1, WF-2.1 | CD-2.1, SD-2.1, UI-2.1, DB-2.1 | StaffDashboard.jsx, views.py | **TC-ADPT-003** | **Passed** |
| **REQ-403** | UC-2.2, AD-2.2, WF-2.2 | CD-2.2, SD-2.2, UI-2.2, DB-2.2 | InventoryView.jsx, models.py, views.py | **TC-SUP-001, TC-SUP-002** | **Passed** |
| **REQ-404** | UC-2.2, AD-2.2, WF-2.2 | CD-2.2, SD-2.2, UI-2.2, DB-2.2 | InventoryView.jsx, views.py | **TC-SUP-003** | **Passed** |
| **REQ-501** | UC-3.1, AD-3.1, WF-3.1 | CD-3.1, SD-3.1, UI-3.1, DB-3.1 | NewsfeedView.jsx, views.py | **TC-FEED-001** | **Passed** |
| **REQ-502** | UC-4.1, AD-4.1, WF-4.1 | CD-4.1, SD-4.1, UI-4.1, DB-4.1 | UserGuideModal.jsx, Navbar.jsx | **TC-ONB-001** | **Passed** |
| **REQ-503** | UC-4.2, AD-4.2, WF-4.2 | CD-4.2, SD-4.2, UI-4.2, DB-4.2 | RegisterUserView.jsx, views.py | **TC-AUTH-001, TC-AUTH-002** | **Passed** |
| **REQ-504** | UC-4.2, AD-4.2, WF-4.2 | CD-4.2, SD-4.2, UI-4.2 | LoginForm.jsx | **TC-AUTH-003** | **Passed** |
| **REQ-505** | UC-4.2, AD-4.2, WF-4.2 | CD-4.2, SD-4.2, DB-4.2 | JWTAuthMiddleware, App.jsx | **TC-AUTH-004** | **Passed** |
| **REQ-601** | UC-1.3, AD-1.3, WF-1.3 | CD-1.3, SD-1.3, UI-1.3 | AddNewPet.jsx, canvasTagGenerator.js | **TC-REG-002, TC-PERF-001** | **Passed** |
| **REQ-602** | Section 3.4 (Usability) | Section 1.3 (Style Guide) | Global CSS, StatusChip.jsx | **TC-USA-001** | **Passed** |
| **REQ-603** | Section 3.4 (Reliability) | Architectural Design | render.yaml, Supabase Cloud | **TC-SEC-001** | **Passed** |

---

## 4. Traceability Audit & Engineering Sign-Off

| Stakeholder Role | Name & Designation | Signature | Date of Audit |
| :--- | :--- | :--- | :--- |
| **Lead Systems Architect** | Task Force Bruno Development Lead | ______________________ | October 10, 2026 |
| **QA & Verification Lead** | Team 18 QA Specialist | ______________________ | October 10, 2026 |
| **Clinical Coordinator** | CIT-U Medical-Dental Clinic (MDC) Rep | ______________________ | October 10, 2026 |
| **Capstone Project Adviser** | College of Computer Studies Faculty | ______________________ | October 10, 2026 |

---
*End of Requirements Inventory & Traceability Matrix (v2.0)*  
**Task Force Bruno Capstone Engineering & Research Team**  
*College of Computer Studies • Department of Information Technology • Cebu Institute of Technology – University*
