# 📋 Task Force Bruno: Requirements Traceability Matrix (RTM)
**Document Version:** 2.0 (Post-Refactoring System Release)  
**System:** Task Force Bruno – Integrated Campus Pet Management System (Wildcat Welfare Portal)  
**Institutional Affiliation:** Cebu Institute of Technology – University (CIT-U)  
**Department:** College of Computer Studies • Department of Information Technology  
**Course:** IT332 – Capstone Project 2: Systems Development & Research Validation  
**Baseline Documents:** Updated SRS v2.0 & Updated SDD v3.1  
**Verification Benchmark:** Software Test Document (STD v2.0)  

---

## Requirements Traceability Matrix

| Requirement ID | SRS Reference<br>(Use Cases, Activity Diagrams, Wireframes) | SDD Reference<br>(Class Diagrams, Sequence Diagrams, UIs, DBs) | Implementation Module(s) / Component(s) | STD Reference<br>(Test Case IDs) | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **REQ-101** | UC-1.1, AD-1.1, WF-1.1 | CD-1.1, SD-1.1, UI-1.1, DB-1.1 | `CollarQRScanner.jsx, views.py` | **TC-QR-001** | **Passed** |
| **REQ-102** | UC-1.1, AD-1.1, WF-1.1 | CD-1.1, SD-1.1, UI-1.1, DB-1.1 | `CollarQRScanner.jsx` | **TC-QR-002** | **Passed** |
| **REQ-103** | UC-1.3, AD-1.3, WF-1.3 | CD-1.3, SD-1.3, UI-1.3, DB-1.3 | `PetAISearchAPIView, views.py` | **TC-REG-003** | **Passed** |
| **REQ-201** | UC-3.2, AD-3.2, WF-3.2 | CD-3.2, SD-3.2, UI-3.2, DB-3.2 | `ReportSightingView.jsx, views.py` | **TC-SGT-001** | **Passed** |
| **REQ-202** | UC-3.2, AD-3.2, WF-3.2 | CD-3.2, SD-3.2, UI-3.2, DB-3.2 | `ReportSightingView.jsx, EmergencyProtocolModal.jsx` | **TC-SGT-002** | **Passed** |
| **REQ-203** | UC-1.3, AD-1.3, WF-1.3 | CD-1.3, SD-1.3, UI-1.3, DB-1.3 | `AddNewPet.jsx, ReportSightingView.jsx` | **TC-SGT-003, TC-REG-001** | **Passed** |
| **REQ-301** | UC-1.2, AD-1.2, WF-1.2 | CD-1.2, SD-1.2, UI-1.2, DB-1.2 | `MedicalLogs.jsx, views.py` | **TC-MED-001** | **Passed** |
| **REQ-302** | UC-1.2, AD-1.2, WF-1.2 | CD-1.2, SD-1.2, UI-1.2, DB-1.2 | `MedicalLogs.jsx, views.py` | **TC-MED-002** | **Passed** |
| **REQ-303** | UC-1.2, AD-1.2, WF-1.2 | CD-1.2, SD-1.2, UI-1.2, DB-1.2 | `MDCAuthGate.jsx, views.py` | **TC-MED-003, TC-SEC-001** | **Passed** |
| **REQ-401** | UC-2.1, AD-2.1, WF-2.1 | CD-2.1, SD-2.1, UI-2.1, DB-2.1 | `AdoptionGallery.jsx, views.py` | **TC-ADPT-001, TC-ADPT-002** | **Passed** |
| **REQ-402** | UC-2.1, AD-2.1, WF-2.1 | CD-2.1, SD-2.1, UI-2.1, DB-2.1 | `StaffDashboard.jsx, views.py` | **TC-ADPT-003** | **Passed** |
| **REQ-403** | UC-2.2, AD-2.2, WF-2.2 | CD-2.2, SD-2.2, UI-2.2, DB-2.2 | `InventoryView.jsx, models.py, views.py` | **TC-SUP-001, TC-SUP-002** | **Passed** |
| **REQ-404** | UC-2.2, AD-2.2, WF-2.2 | CD-2.2, SD-2.2, UI-2.2, DB-2.2 | `InventoryView.jsx, views.py` | **TC-SUP-003** | **Passed** |
| **REQ-501** | UC-3.1, AD-3.1, WF-3.1 | CD-3.1, SD-3.1, UI-3.1, DB-3.1 | `NewsfeedView.jsx, views.py` | **TC-FEED-001** | **Passed** |
| **REQ-502** | UC-4.1, AD-4.1, WF-4.1 | CD-4.1, SD-4.1, UI-4.1, DB-4.1 | `UserGuideModal.jsx, Navbar.jsx` | **TC-ONB-001** | **Passed** |
| **REQ-503** | UC-4.2, AD-4.2, WF-4.2 | CD-4.2, SD-4.2, UI-4.2, DB-4.2 | `RegisterUserView.jsx, views.py` | **TC-AUTH-001, TC-AUTH-002** | **Passed** |
| **REQ-504** | UC-4.2, AD-4.2, WF-4.2 | CD-4.2, SD-4.2, UI-4.2 | `LoginForm.jsx` | **TC-AUTH-003** | **Passed** |
| **REQ-505** | UC-4.2, AD-4.2, WF-4.2 | CD-4.2, SD-4.2, DB-4.2 | `JWTAuthMiddleware, App.jsx` | **TC-AUTH-004** | **Passed** |
| **REQ-601** | UC-1.3, AD-1.3, WF-1.3 | CD-1.3, SD-1.3, UI-1.3 | `AddNewPet.jsx, canvasTagGenerator.js` | **TC-REG-002, TC-PERF-001** | **Passed** |
| **REQ-602** | Section 3.4 (Usability) | Section 1.3 (Style Guide) | `Global CSS, StatusChip.jsx` | **TC-USA-001** | **Passed** |
| **REQ-603** | Section 3.4 (Reliability) | Architectural Design | `render.yaml, Supabase Cloud` | **TC-SEC-001** | **Passed** |

---
*End of Requirements Traceability Matrix (RTM)*  
**Task Force Bruno Capstone Engineering & Research Team**  
*Department of Information Technology • Cebu Institute of Technology – University*
