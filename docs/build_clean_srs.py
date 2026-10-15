"""
Build script for Clean, Authentic, Non-AI Styled Software Requirements Specification (SRS v2.0)
Task Force Bruno - Wildcat Welfare Portal
Cebu Institute of Technology - University
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_clean_table_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="D0D0D0"/>'
        f'<w:left w:val="none"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="D0D0D0"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def set_box_table_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>'
        f'<w:left w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>'
        f'<w:right w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E5E5"/>'
        f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="E5E5E5"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_clean_heading_1(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
    return h

def add_clean_heading_2(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(11)
    h.paragraph_format.space_after = Pt(3)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
    return h

def add_clean_heading_3(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(8)
    h.paragraph_format.space_after = Pt(2)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
    return h

def add_clean_body(doc, text, bold_prefix=None, space_after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Arial"
        r_pre.font.size = Pt(10.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
    r = p.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(10.5)
    r.font.color.rgb = RGBColor(0x11, 0x11, 0x11)
    return p

def add_clean_bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    
    r_bullet = p.add_run("●  ")
    r_bullet.font.name = "Arial"
    r_bullet.font.size = Pt(8.5)
    r_bullet.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Arial"
        r_pre.font.size = Pt(10.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
        
    r = p.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(10.5)
    r.font.color.rgb = RGBColor(0x11, 0x11, 0x11)
    return p

def add_subbullet_heading(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(f"●  {text}")
    r.font.name = "Arial"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
    return p

def add_diagram_image(doc, img_path, width_inches=5.2):
    if not os.path.exists(img_path):
        p_err = doc.add_paragraph(f"[Image not found: {img_path}]")
        p_err.alignment = WD_ALIGN_PARAGRAPH.CENTER
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    r = p.add_run()
    r.add_picture(img_path, width=Inches(width_inches))

def add_clean_table(doc, headers, rows_data, col_widths=None):
    tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    set_clean_table_borders(tbl)
    
    # Header
    for c_idx, h_text in enumerate(headers):
        cell = tbl.rows[0].cells[c_idx]
        set_cell_background(cell, "F2F2F2")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h_text)
        r.font.name = "Arial"
        r.font.size = Pt(9.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
        
    # Body
    for r_idx, r_data in enumerate(rows_data):
        row_cells = tbl.rows[r_idx + 1].cells
        for c_idx, val in enumerate(r_data):
            cell = row_cells[c_idx]
            set_cell_background(cell, "FFFFFF")
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(str(val))
            r.font.name = "Arial"
            r.font.size = Pt(9.0)
            r.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
            
    if col_widths:
        for row in tbl.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Inches(w)
                
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(4)
    return tbl

def add_usecase_table(doc, uc_fields):
    tbl = doc.add_table(rows=len(uc_fields), cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    set_box_table_borders(tbl)
    
    for idx, (label, val) in enumerate(uc_fields):
        c0 = tbl.rows[idx].cells[0]
        c1 = tbl.rows[idx].cells[1]
        c0.width = Inches(1.8)
        c1.width = Inches(4.7)
        
        set_cell_background(c0, "F8F9FA")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=70, bottom=70, left=100, right=100)
        set_cell_margins(c1, top=70, bottom=70, left=100, right=100)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(0)
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(label)
        r0.font.name = "Arial"
        r0.font.size = Pt(9.0)
        r0.font.bold = True
        r0.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(0)
        p1.paragraph_format.line_spacing = 1.15
        r1 = p1.add_run(val)
        r1.font.name = "Arial"
        r1.font.size = Pt(9.0)
        r1.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
        
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(4)
    return tbl

def build_clean_srs():
    doc = docx.Document()
    
    # 1 inch margins
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        s.different_first_page_header_footer = True
        
        # Setup Header on pages 2+
        hdr = s.header
        hdr_tbl = hdr.add_table(rows=1, cols=2, width=Inches(6.5))
        hdr_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        c0 = hdr_tbl.cell(0, 0)
        c1 = hdr_tbl.cell(0, 1)
        c0.width = Inches(4.2)
        c1.width = Inches(2.3)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(0)
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run("Software Requirements Specifications\nWildcatWelfare")
        r0.font.name = "Arial"
        r0.font.size = Pt(8.5)
        r0.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
        
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run("Document Version: 2.0\nPublished Date: 09 19 2026")
        r1.font.name = "Arial"
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
        
    # ==================== PAGE 1: COVER PAGE ====================
    # Exactly matching the original PDF layout
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(72)
    p.paragraph_format.space_after = Pt(8)
    r = p.add_run("CEBU INSTITUTE OF TECHNOLOGY UNIVERSITY")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(120)
    r = p.add_run("COLLEGE OF COMPUTER STUDIES")
    r.font.name = "Arial"
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run("Software Requirements Specifications\nfor")
    r.font.name = "Arial"
    r.font.size = Pt(14)
    r.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("WILDCAT WELFARE")
    r.font.name = "Arial"
    r.font.size = Pt(18)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x00, 0x00, 0x00)
    
    doc.add_page_break()
    
    # ==================== PAGE 2: CHANGE HISTORY ====================
    add_clean_heading_1(doc, "Change History")
    
    hist_headers = ["Date", "Revision", "Description"]
    hist_data = [
        ["05/06/2026", "1.0", "Initial Draft."],
        ["09/19/2026", "2.0", 
         "Post-MVP System Update:\n"
         "• Added Module 1.3: Animal Intake, Registry & Tag Generation (AddNewPet.jsx, 300 DPI HTML5 canvas QR collar tag generation, PetAISearchAPIView heuristic search).\n"
         "• Added Module 3.2: Landmark-Assisted Sighting Telemetry & 1-Click Intake (ReportSightingView.jsx with standardized CIT-U campus landmarks, emergency sentinel, and 1-Click Sighting-to-Intake handoff into AddNewPet).\n"
         "• Added Module 4.1: Interactive User Onboarding Walkthrough (UserGuideModal.jsx addressing SUS benchmark validation feedback).\n"
         "• Added Module 4.2: Role-Based Access Control & Institutional Authentication (RegisterUserView enforcing @cit.edu domain and ID format XX-XXXX-XXX, LoginView session JWT issuance, 15-minute sliding inactivity timeout, role-based dashboard routing).\n"
         "• Overhauled Module 2.2 to physical supply donation intake and warehouse inventory control across standardized units (kg, cans, vials, pieces).\n"
         "• Aligned clinical records with Republic Act No. 9482 rabies biosecurity protocols and mandatory 14-day bite observation quarantine.\n"
         "• Updated technical stack specifications to Django REST Framework (Python 3.12), React 19, Supabase PostgreSQL, Supabase Cloud Storage, and Render keep-alive watchdog."]
    ]
    add_clean_table(doc, hist_headers, hist_data, col_widths=[1.1, 0.9, 4.5])
    
    doc.add_page_break()
    
    # ==================== PAGE 3: TABLE OF CONTENTS ====================
    add_clean_heading_1(doc, "Table of Contents")
    
    toc_data = [
        ["Change History", "2"],
        ["Table of Contents", "3"],
        ["1. Introduction", "4"],
        ["    1.1. Purpose", "4"],
        ["    1.2. Scope", "4"],
        ["    1.3. Definitions, Acronyms and Abbreviations", "4"],
        ["    1.4. References", "5"],
        ["2. Overall Description", "6"],
        ["    2.1. Product perspective", "6"],
        ["    2.2. User characteristics", "6"],
        ["    2.4. Constraints", "6"],
        ["    2.5. Assumptions and dependencies", "7"],
        ["3. Specific Requirements", "8"],
        ["    3.1. External interface requirements", "8"],
        ["        3.1.1. Hardware interfaces", "8"],
        ["        3.1.2. Software interfaces", "8"],
        ["        3.1.3. Communications interfaces", "8"],
        ["    3.2. Functional requirements", "9"],
        ["        Module 1", "9"],
        ["            1.1: QR-Coded Profile Access", "9"],
        ["            1.2: MDC Medical Dashboard", "14"],
        ["            1.3: Animal Intake, Registry & Tag Generation", "17"],
        ["        Module 2", "20"],
        ["            2.1: Submit and Process Adoption Application", "20"],
        ["            2.2: Supply Logistics & Inventory Control", "25"],
        ["        Module 3", "27"],
        ["            3.1: Homepage/Newsfeed", "27"],
        ["            3.2: Landmark-Assisted Sighting Telemetry & 1-Click Intake", "31"],
        ["        Module 4", "34"],
        ["            4.1: Interactive User Onboarding Walkthrough", "34"],
        ["            4.2: Role-Based Access Control & Institutional Authentication", "36"],
        ["    3.4 Non-functional requirements", "39"],
        ["        Performance", "39"],
        ["        Security", "39"],
        ["        Reliability", "40"],
        ["        Usability", "40"]
    ]
    
    tbl_toc = doc.add_table(rows=len(toc_data), cols=2)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_toc.autofit = False
    set_clean_table_borders(tbl_toc)
    for idx, (title, pnum) in enumerate(toc_data):
        c0 = tbl_toc.rows[idx].cells[0]
        c1 = tbl_toc.rows[idx].cells[1]
        c0.width = Inches(5.6)
        c1.width = Inches(0.9)
        set_cell_background(c0, "FFFFFF")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=30, bottom=30, left=60, right=60)
        set_cell_margins(c1, top=30, bottom=30, left=60, right=60)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(0)
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(title)
        r0.font.name = "Arial"
        r0.font.size = Pt(9.5)
        if not title.startswith("    "):
            r0.font.bold = True
            
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(pnum)
        r1.font.name = "Arial"
        r1.font.size = Pt(9.5)
        
    doc.add_page_break()
    
    # ==================== SECTION 1: INTRODUCTION ====================
    add_clean_heading_1(doc, "1. Introduction")
    
    add_clean_heading_2(doc, "1.1. Purpose")
    add_clean_body(doc, "The purpose of the Wildcat Welfare Portal is to digitally operate the current Animal Welfare Program needed at Cebu Institute of Technology - University (CIT-U). This system is a web-based initiative to connect the program's fragmented paper record keeping into one consolidated system under one governance structure. The purpose of this document is to provide all stakeholders (Development Team, Task Force Bruno, Medical-Dental Clinic Personnel, Academic Evaluators) with an easily understandable description of the portal's complete software requirements, system features, and operational constraints.")
    
    add_clean_heading_2(doc, "1.2. Scope")
    add_clean_body(doc, "The Wildcat Welfare Portal is a web-based platform created specifically to manage campus animal welfare and population health within the grounds of CIT-U. This system will be used by Task Force Bruno, the Medical and Dental Clinic (MDC), student volunteers, faculty, campus visitors, and prospective adopters.")
    add_clean_body(doc, "The system encompasses four primary modules:")
    add_clean_bullet(doc, "Provides public QR collar tag scanning, digital Pet Passport views, medical treatment journaling, vaccination batch tracking, and mandatory 14-day bite observation quarantine monitoring under Republic Act No. 9482, as well as baseline animal intake with 300 DPI canvas collar tag generation.", "Module 1 (Veterinary & Animal Identity Core): ")
    add_clean_bullet(doc, "Enables prospective adopters to submit structured digital applications for eligible pets, provides administrative review workflows, and manages warehouse supply donations and inventory without monetary payment processing.", "Module 2 (Community Engagement & Welfare Operations): ")
    add_clean_bullet(doc, "Features an aggregated community newsfeed and landmark-assisted sighting reporting (without GPS reliance) with emergency triage flags and a 1-Click handoff into official animal intake.", "Module 3 (Campus Surveillance & Telemetry): ")
    add_clean_bullet(doc, "Provides an interactive 4-step onboarding guide (UserGuideModal.jsx) addressing SUS usability feedback, strict institutional authentication (@cit.edu and XX-XXXX-XXX ID format), role routing, and 15-minute sliding session inactivity termination.", "Module 4 (Institutional Security, Governance & Onboarding): ")

    add_clean_heading_2(doc, "1.3. Definitions, Acronyms and Abbreviations")
    def_headers = ["Term/Acronym", "Definition"]
    def_data = [
        ["CIT-U", "Cebu Institute of Technology - University; the host academic institution."],
        ["Task Force Bruno", "The official CIT-U committee responsible for the welfare, monitoring, and humane management of campus animals."],
        ["MDC", "Medical-Dental Clinic; the university clinic responsible for treating campus animal bite/scratch incidents and logging veterinary treatments."],
        ["PCO", "Property and Campus Operations office; involved in campus animal monitoring and facility coordination."],
        ["SSD", "Student Services Division; stakeholder unit involved in campus pet welfare advocacy."],
        ["Stray", "An unregistered or uncataloged animal that has entered campus premises and has not yet been formally assessed by Task Force Bruno."],
        ["RA 9482", "Republic Act No. 9482 (Anti-Rabies Act of 2007); mandates pet immunization, registration, and strict 14-day observation quarantine for biting animals."],
        ["Pet Passport", "A responsive public web view rendered upon scanning a pet's QR collar tag, displaying verified vaccination credentials, quarantine status, and emergency contact details."],
        ["300 DPI Canvas QR", "High-resolution collar tag graphic rendered client-side on an HTML5 canvas at 300 dots per inch for direct printing onto physical waterproof collar tags."],
        ["Landmark Telemetry", "Campus location reporting using predefined CIT-U physical landmarks (NGE Building, Canteen, Main Building, Library, etc.) to eliminate mobile GPS inaccuracies."],
        ["1-Click Intake", "Automated handoff mechanism transferring unverified sighting data directly into the official intake form via sessionStorage."],
        ["SUS", "System Usability Scale; standardized 10-item usability evaluation benchmarked at 62.32 during MVP testing and addressed via Module 4.1."],
        ["RBAC", "Role-Based Access Control; separates user privileges across Community Members, MDC Clinic Staff, Shelter Staff, and Administrators."],
        ["JWT", "JSON Web Token; used for authenticated API sessions, paired with a client-side 15-minute sliding inactivity watchdog."],
        ["Supabase", "Managed backend platform providing relational PostgreSQL 15 database storage and S3-compatible cloud storage buckets for photos."],
        ["Render", "Containerized cloud host running the Django REST Framework API, paired with a keep-alive health check to eliminate cold starts."]
    ]
    add_clean_table(doc, def_headers, def_data, col_widths=[1.6, 4.9])

    add_clean_heading_2(doc, "1.4. References")
    add_clean_bullet(doc, "International Organization for Standardization. (2018). ISO/IEC/IEEE 29148:2018 Systems and software engineering - Life cycle processes - Requirements engineering.")
    add_clean_bullet(doc, "Republic of the Philippines. (2007). Republic Act No. 9482: Anti-Rabies Act of 2007.")
    add_clean_bullet(doc, "Cebu Institute of Technology - University. (2024). Institutional Animal Welfare & Safety Guidelines.")
    add_clean_bullet(doc, "Task Force Bruno Team. (2026). Software Design Document for Wildcat Welfare Portal (SDD v2.0).")
    add_clean_bullet(doc, "Brooke, J. (1996). SUS: A 'quick and dirty' usability scale. Usability Evaluation in Industry, Taylor & Francis.")

    doc.add_page_break()

    # ==================== SECTION 2: OVERALL DESCRIPTION ====================
    add_clean_heading_1(doc, "2. Overall Description")
    
    add_clean_heading_2(doc, "2.1. Product perspective")
    add_clean_body(doc, "The Wildcat Welfare Portal is a web-based management system designed to replace the fragmented paper-based record-keeping currently used by CIT-U’s Task Force Bruno. The system operates as a centralized digital governance layer that interfaces with the daily operations of the Medical-Dental Clinic (MDC) and campus welfare volunteers.")
    add_clean_body(doc, "The system follows a modern decoupled client-server architecture:")
    add_clean_bullet(doc, "A mobile-responsive Single-Page Application (SPA) built with React 19 and Vite. It provides touch-friendly interfaces for optical QR code scanning, public pet passports, community sighting submissions, adoption forms, and administrative dashboards.", "Frontend: ")
    add_clean_bullet(doc, "A RESTful API service built with Django 5.x and Django REST Framework running on Python 3.12 within a Linux container on Render. It handles business logic, permission verification, medical logs, and adoption processing.", "Backend API: ")
    add_clean_bullet(doc, "A managed PostgreSQL 15 database hosted on Supabase storing relational records, paired with Supabase Object Storage buckets for companion profile photos, sighting images, and medical documents.", "Database & Storage: ")
    add_clean_bullet(doc, "Automated SMTP mail transport for sending transactional status updates for adoption applications and emergency triage notifications.", "Notification Service: ")

    add_clean_heading_2(doc, "2.2. User characteristics")
    add_clean_body(doc, "The system serves five primary user classes with varying levels of technical expertise and access rights:")
    add_clean_bullet(doc, "The primary decision-makers who require full administrative access to animal intake, adoption vetting, supply inventory, and campus bulletins. They possess moderate to high technical proficiency.", "Task Force Admins & Welfare Officers: ")
    add_clean_bullet(doc, "Healthcare personnel responsible for logging clinical treatments, updating vaccine batch records, recording bite/scratch incidents, and overseeing the mandatory 14-day rabies observation quarantine.", "MDC Clinic Staff: ")
    add_clean_bullet(doc, "Active students who assist in monitoring campus animals, verifying sightings, reporting stray animals, and managing community newsfeed updates.", "Student Volunteers / Moderators: ")
    add_clean_bullet(doc, "Students, faculty, and staff with official @cit.edu accounts who use the portal to scan collar tags, view health passports, submit sightings, and interact on the community newsfeed.", "University Community (Students/Faculty/Staff): ")
    add_clean_bullet(doc, "Campus community members or approved public visitors who browse adoptable pets, submit digital adoption applications, and track application status.", "Potential Adopters: ")

    add_clean_heading_2(doc, "2.4. Constraints")
    add_clean_body(doc, "The development and operation of the Wildcat Welfare Portal are subject to the following constraints:")
    add_clean_bullet(doc, "The system depends on stable campus Wi-Fi or mobile data (4G/5G) for real-time QR code scanning, medical updates, and incident reporting.", "Connectivity: ")
    add_clean_bullet(doc, "The system's operational scope is strictly limited to CIT-U campus premises. To avoid indoor GPS signal loss and high battery drain, the system relies strictly on predefined CIT-U structural landmarks (e.g., NGE Building, Canteen, Library) rather than device GPS coordinates.", "Geographic Limitation & Zero GPS: ")
    add_clean_bullet(doc, "Handling of health and bite records must comply with university health privacy standards and Republic Act No. 9482. Any animal involved in a bite incident must be locked under a 14-day observation quarantine status.", "Regulatory Compliance (RA 9482): ")
    add_clean_bullet(doc, "In adherence to university policies regarding student projects, monetary transactions and online payment gateways are prohibited. Resource mobilization is conducted strictly through in-kind physical supply donations (kg of food, cans, medical vials, collars).", "Non-Monetary Policy: ")
    add_clean_bullet(doc, "Account registration requires validation of institutional email addresses (@cit.edu) and student/faculty ID format (XX-XXXX-XXX).", "Institutional Domain Filtering: ")
    add_clean_bullet(doc, "The mobile interface must remain lightweight and responsive enough to run smoothly on standard mid-range smartphones without requiring native mobile app installation.", "Hardware Independence: ")

    add_clean_heading_2(doc, "2.5. Assumptions and dependencies")
    add_clean_body(doc, "Assumptions:")
    add_clean_bullet(doc, "All authorized users (Task Force Bruno personnel, student volunteers, MDC staff) possess basic digital literacy and can navigate web-based forms on desktop and mobile browsers.")
    add_clean_bullet(doc, "Smartphones used by students and staff for QR code scanning have functional rear cameras and modern web browsers supporting HTML5 standards.")
    add_clean_bullet(doc, "Task Force Bruno and MDC personnel will regularly update pet profiles, clinical notes, supply logs, and adoption statuses to ensure data reliability.")
    add_clean_bullet(doc, "The university administration will continue supporting the CNVR (Catch, Neuter, Vaccinate, and Return) program and campus animal welfare operations.")
    add_clean_body(doc, "Dependencies:")
    add_clean_bullet(doc, "The system depends on cloud infrastructure availability, specifically Supabase (PostgreSQL and Object Storage) and Render (Django container hosting).")
    add_clean_bullet(doc, "The system depends on an automated Keep-Alive ping (targeting GET /api/health/ every 10 minutes) to prevent Render container sleep and eliminate cold-start latency for field volunteers.")
    add_clean_bullet(doc, "Collar QR identification depends on the physical availability and readability of 300 DPI laminated collar tags affixed to recognized university animals.")
    add_clean_bullet(doc, "Automated notifications depend on third-party SMTP email transport services.")

    doc.add_page_break()

    # ==================== SECTION 3: SPECIFIC REQUIREMENTS ====================
    add_clean_heading_1(doc, "3. Specific Requirements")
    
    add_clean_heading_2(doc, "3.1. External interface requirements")
    add_clean_body(doc, "The Wildcat Welfare Portal interacts with several hardware and software components to support on-site QR scanning, clinical documentation, sighting reports, and adoption workflows.")
    
    add_clean_heading_3(doc, "3.1.1. Hardware interfaces")
    add_clean_bullet(doc, "Used by students, staff, and security personnel to optically scan physical collar QR codes and capture on-site sighting photos.", "Smartphones and Tablets with Built-in Cameras: ")
    add_clean_bullet(doc, "Used by Task Force Bruno coordinators and MDC clinic staff to access administrative dashboards, clinical records, and intake forms.", "Desktop and Laptop Computers: ")
    add_clean_bullet(doc, "Standard office inkjet or laser printers used to print client-side generated 300 DPI collar tag graphics for physical lamination and collar attachment.", "Printers for Collar Tags: ")
    add_clean_bullet(doc, "Campus Wi-Fi routers and cellular base stations providing internet connectivity across CIT-U grounds.", "Network Devices: ")

    add_clean_heading_3(doc, "3.1.2. Software interfaces")
    add_clean_bullet(doc, "Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge on mobile and desktop platforms.", "Web Browsers: ")
    add_clean_bullet(doc, "Supabase managed PostgreSQL 15 database for relational entity storage (users, pets, medical logs, inventory, sightings, adoptions).", "Database Management System: ")
    add_clean_bullet(doc, "Supabase Cloud Storage buckets with CDN distribution for persisting companion photos, sighting attachments, and diagnostic files.", "Cloud Object Storage: ")
    add_clean_bullet(doc, "Django 5.x REST Framework executing on Python 3.12, handling RESTful API requests, serialization, and role-based permissions.", "Backend Web Application Framework: ")
    add_clean_bullet(doc, "Client-side HTML5 canvas API for rendering 300 DPI high-density QR collar tags.", "Canvas Graphic Engine: ")
    add_clean_bullet(doc, "SMTP email service for dispatching automated adoption status notices and emergency alerts.", "Email Service: ")

    add_clean_heading_3(doc, "3.1.3. Communications interfaces")
    add_clean_bullet(doc, "All client-server communications are conducted over HTTPS (TLS 1.3) to ensure encrypted transmission of credentials, medical data, and personal adoption records.", "HTTP/HTTPS Protocol: ")
    add_clean_bullet(doc, "The frontend communicates with backend services via REST APIs using standard JSON request and response payloads.", "RESTful JSON APIs: ")
    add_clean_bullet(doc, "Secure user authentication utilizes JSON Web Tokens (JWT) with bearer authorization headers and a 15-minute sliding inactivity watchdog.", "JWT Authentication: ")
    add_clean_bullet(doc, "An automated cron job executes an HTTP GET request to /api/health/ every 10 minutes to maintain container responsiveness and eliminate cold-start delays.", "Keep-Alive Watchdog: ")

    add_clean_heading_2(doc, "3.2. Functional requirements")
    add_clean_body(doc, "This section presents the detailed functional requirements organized across four core modules and nine functional use cases. Each use case includes its Use Case Diagram, structured Use Case Description table, Activity Diagram, and UI Wireframe.")

    # ==================== MODULE 1 ====================
    add_clean_heading_2(doc, "Module 1")
    add_clean_body(doc, "Veterinary & Animal Identity Core: Manages companion identification, public QR health passports, clinic health journaling, anti-rabies vaccination lot tracking, 14-day bite observation quarantine (RA 9482), and animal intake with 300 DPI canvas tag generation.")

    # 1.1 QR Profile Access
    add_clean_heading_3(doc, "1.1: QR-Coded Profile Access")
    add_subbullet_heading(doc, "Use Case Diagram")
    add_diagram_image(doc, "docs/srs_images/page_10_0_X53.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Use Case Description")
    uc11_fields = [
        ["Use Case ID", "UC-1.1"],
        ["Use Case Name", "QR-Coded Profile Access"],
        ["Primary Actor", "Campus User (Student, Faculty, Staff, or Visitor)"],
        ["Preconditions", "The user has a smartphone with camera functionality. The scanned QR code is registered in the database."],
        ["Main Success Scenario",
         "1. The User scans the physical QR code attached to the animal's collar.\n"
         "2. The mobile browser opens the URL encoded in the QR code (https://wildcatwelfare.cit.edu/pet-passport/{id}/).\n"
         "3. The System validates the Pet ID against the database.\n"
         "4. The System retrieves the associated pet profile (name, photo, vaccination status, territory, and behavior notes).\n"
         "5. The System renders the mobile-responsive Public Pet Passport page displaying verified vaccination badges and welfare contact details."],
        ["Alternative Flows",
         "3a. Invalid QR Code:\n"
         "   1. The System fails to find a matching Pet ID.\n"
         "   2. The System displays an error: 'Pet Profile Not Found.'\n"
         "   3. The System displays a link prompting the user to report an uncataloged stray (UC-3.2).\n"
         "4a. Animal Under Active Bite Quarantine:\n"
         "   1. The animal is flagged under active 14-day bite observation.\n"
         "   2. The System displays a red warning banner: 'BIOSECURITY ALERT: Animal is currently under active 14-day bite surveillance. Do not approach. Contact MDC Clinic immediately.'\n"
         "   3. The System provides a one-tap phone dialer button to the CIT-U MDC Clinic."],
        ["Postconditions", "The user successfully views the real-time health and behavioral data of the campus pet without needing to log in."]
    ]
    add_usecase_table(doc, uc11_fields)
    
    add_subbullet_heading(doc, "Activity Diagram")
    add_diagram_image(doc, "docs/srs_images/page_13_0_X61.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Wireframe")
    add_diagram_image(doc, "docs/srs_images/page_14_0_X64.png", width_inches=4.5)

    doc.add_page_break()

    # 1.2 MDC Medical Dashboard
    add_clean_heading_3(doc, "1.2: MDC Medical Dashboard")
    add_subbullet_heading(doc, "Use Case Diagram")
    add_diagram_image(doc, "docs/srs_images/page_14_1_X65.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Use Case Description")
    uc12_fields = [
        ["Use Case ID", "UC-1.2"],
        ["Use Case Name", "Log Medical Records and Incidents"],
        ["Primary Actor", "MDC Clinic Staff"],
        ["Preconditions", "The staff member is authenticated with CLINIC role credentials and logged into the restricted medical dashboard."],
        ["Main Success Scenario",
         "1. The Staff searches for a specific pet using the Pet ID, Name, or collar scan.\n"
         "2. The System displays the active medical profile and treatment timeline.\n"
         "3. The Staff selects 'Add Clinical Record' or 'Report Incident'.\n"
         "4. The Staff inputs visit details: Treatment Type, Diagnosis, Medication, Vaccine Manufacturer, Batch/Lot Number, and Expiration Date.\n"
         "5. The Staff clicks 'Save Record'.\n"
         "6. The System updates the database and automatically calculates the next vaccination due date.\n"
         "7. The pet's Public Pet Passport badge updates to 'Vaccinated - Up to Date'."],
        ["Alternative Flows",
         "4a. Bite/Scratch Incident Logging (RA 9482 Compliance):\n"
         "   1. Staff selects 'Bite Incident' as the visit category.\n"
         "   2. The System automatically flags the animal's quarantine_status as 'UNDER_OBSERVATION'.\n"
         "   3. The System sets and locks a 14-day observation countdown clock.\n"
         "   4. The System records the bite victim's institutional ID and clinic referral details.\n"
         "   5. An alert is sent to Task Force Bruno personnel for physical animal monitoring.\n"
         "4b. Incomplete Mandatory Fields:\n"
         "   1. Staff leaves required clinical fields (e.g., vaccine lot number or treatment date) blank.\n"
         "   2. The System disables the 'Save' button and highlights the required fields in red."],
        ["Postconditions", "The animal's medical history is updated, and the campus clinic has a formalized, legal record of the treatment or incident."]
    ]
    add_usecase_table(doc, uc12_fields)
    
    add_subbullet_heading(doc, "Activity Diagram")
    add_diagram_image(doc, "docs/srs_images/page_17_0_X72.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Wireframe")
    add_diagram_image(doc, "docs/srs_images/page_18_1_X76.png", width_inches=4.8)

    doc.add_page_break()

    # 1.3 Animal Intake, Registry & Tag Generation
    add_clean_heading_3(doc, "1.3: Animal Intake, Registry & Tag Generation")
    add_subbullet_heading(doc, "Use Case Diagram")
    add_diagram_image(doc, "docs/srs_diagrams/uc_1_3_usecase.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Use Case Description")
    uc13_fields = [
        ["Use Case ID", "UC-1.3"],
        ["Use Case Name", "Animal Intake, Baseline Registry & Tag Generation"],
        ["Primary Actor", "Task Force Bruno Staff / Welfare Officer"],
        ["Preconditions", "Staff is authenticated with STAFF or ADMIN credentials and accesses the AddNewPet.jsx form."],
        ["Main Success Scenario",
         "1. Staff opens the Animal Intake form.\n"
         "2. If converted from a community sighting, fields (landmark, description, photo) are automatically populated from sessionStorage.\n"
         "3. Staff enters companion identity details: Name, Species (Dog/Cat), Biological Sex, Estimated Age, Color/Markings, Temperament, and Campus Territory.\n"
         "4. Staff uploads a clear companion photo.\n"
         "5. Staff clicks 'Register Companion & Generate Tag'.\n"
         "6. The System validates the form and creates the pet record in Supabase PostgreSQL.\n"
         "7. The companion photo is uploaded to Supabase Storage and associated with the record.\n"
         "8. The client-side HTML5 canvas dynamically generates a 300 DPI print-ready collar tag containing the pet name, UUID, and high-density QR code.\n"
         "9. Staff clicks 'Export Printable Tag' to save the graphic for physical collar production.\n"
         "10. The companion is officially listed on PetListings.jsx and indexed in the search catalog."],
        ["Alternative Flows",
         "3a. Duplicate Record Detected:\n"
         "   1. Heuristic search identifies an existing pet with matching physical traits and territory.\n"
         "   2. The System displays a warning modal: 'Possible duplicate pet detected.'\n"
         "   3. Staff can verify and merge with existing record or proceed with new registration.\n"
         "4a. Image Upload Failure:\n"
         "   1. Network timeout occurs during image upload.\n"
         "   2. The System keeps all text fields intact and prompts staff to re-select the image."],
        ["Postconditions", "The animal is permanently registered in the campus database, fitted with a generated 300 DPI QR collar tag, and made searchable across the portal."]
    ]
    add_usecase_table(doc, uc13_fields)
    
    add_subbullet_heading(doc, "Activity Diagram")
    add_diagram_image(doc, "docs/srs_diagrams/uc_1_3_activity.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Wireframe")
    add_diagram_image(doc, "docs/img_140_rId23.png", width_inches=4.8)

    doc.add_page_break()

    # ==================== MODULE 2 ====================
    add_clean_heading_2(doc, "Module 2")
    add_clean_body(doc, "Community Engagement & Welfare Operations: Manages digital adoption applications, multi-stage applicant vetting, shelter triage workflows, and warehouse supply logistics with physical donation tracking across standardized units (kg, cans, vials, pieces).")

    # 2.1 Submit and Process Adoption Application
    add_clean_heading_3(doc, "2.1: Submit and Process Adoption Application")
    add_subbullet_heading(doc, "Use Case Diagram")
    add_diagram_image(doc, "docs/srs_images/page_23_1_X90.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Use Case Description")
    uc21_fields = [
        ["Use Case ID", "UC-2.1"],
        ["Use Case Name", "Submit and Process Adoption Application"],
        ["Primary Actor", "Prospective Adopter, Shelter Staff"],
        ["Preconditions", "The Adopter is viewing an eligible pet's profile page on PetListings.jsx; the pet has status 'AVAILABLE_FOR_ADOPTION'."],
        ["Main Success Scenario",
         "1. The Adopter clicks 'Apply for Adoption'.\n"
         "2. The Adopter completes the digital adoption application form (housing type, pet care experience, landlord policy, daily availability, financial readiness pledge).\n"
         "3. The Adopter submits the application.\n"
         "4. The System sets the application status to 'Pending' and alerts Shelter Staff.\n"
         "5. Staff accesses PendingApplications.jsx and reviews the application dossier.\n"
         "6. Staff moves the application through triage stages: Under Review -> Interview Scheduled -> Approved.\n"
         "7. The System dispatches automated email updates to the applicant upon each status change.\n"
         "8. Upon final approval, the pet's profile status is updated to 'Adopted', and an automated celebratory bulletin is posted to the Community Newsfeed."],
        ["Alternative Flows",
         "2a. Incomplete Vetting Information:\n"
         "   1. Adopter skips required fields in the questionnaire.\n"
         "   2. The System highlights incomplete questions and prevents submission.\n"
         "6a. Application Denied:\n"
         "   1. Staff determines housing or care conditions are unsuitable.\n"
         "   2. Staff sets status to 'Denied' and enters an explanatory reason.\n"
         "   3. The System sends a polite notification to the Adopter, and the pet remains available for other applicants."],
        ["Postconditions", "The adoption application is definitively resolved, recorded in the audit trail, and the animal's ownership status is updated."]
    ]
    add_usecase_table(doc, uc21_fields)
    
    add_subbullet_heading(doc, "Activity Diagram")
    add_diagram_image(doc, "docs/srs_images/page_26_0_X97.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Wireframe")
    add_diagram_image(doc, "docs/srs_images/page_27_0_X100.png", width_inches=4.8)

    doc.add_page_break()

    # 2.2 Supply Logistics & Inventory Control
    add_clean_heading_3(doc, "2.2: Supply Logistics & Inventory Control")
    add_subbullet_heading(doc, "Use Case Diagram")
    add_diagram_image(doc, "docs/srs_diagrams/uc_2_2_usecase.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Use Case Description")
    uc22_fields = [
        ["Use Case ID", "UC-2.2"],
        ["Use Case Name", "Supply Logistics & Inventory Control"],
        ["Primary Actor", "Supply Donor, Shelter Inventory Custodian"],
        ["Preconditions", "The Donor accesses the public logistics dashboard; Staff has administrative access to the inventory ledger."],
        ["Main Success Scenario (In-Kind Physical Donation):",
         "1. The Donor brings physical supplies (dog/cat food, vaccines, medicines, leashes) to the designated campus drop-off point.\n"
         "2. Staff accesses the Logistics portal and clicks 'Log Physical Donation'.\n"
         "3. Staff inputs Donor Name, Item Category, Quantity, Unit of Measure (kg, cans, vials, pieces), and Expiration Date.\n"
         "4. Staff submits the entry.\n"
         "5. The System atomically increments stock_quantity in the inventory table and appends a 'DONATION_IN' event to inventory_transactions.\n"
         "6. The live inventory dashboard updates immediately, displaying current stock levels and issuing a digital acknowledgement receipt."],
        ["Alternative Flows (Stock Disbursement & Low-Stock Alerts):",
         "2a. Staff Logs Supply Consumption:\n"
         "   1. Staff logs supply usage for shelter animals (e.g., 5 kg of dry cat food used).\n"
         "   2. The System decrements stock_quantity and appends a 'DISBURSEMENT_OUT' record to the ledger.\n"
         "   3. If stock_quantity falls at or below reorder_threshold, the System triggers an automated 'LOW STOCK' alert banner on the public Logistics Dashboard and publishes an urgent needs bulletin to the Community Newsfeed."],
        ["Postconditions", "Warehouse inventory balances are updated in real time, full transaction history is preserved, and supply deficits are communicated to the campus community."]
    ]
    add_usecase_table(doc, uc22_fields)
    
    add_subbullet_heading(doc, "Activity Diagram")
    add_diagram_image(doc, "docs/srs_diagrams/uc_2_2_activity.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Wireframe")
    add_diagram_image(doc, "docs/srs_images/page_32_0_X114.png", width_inches=4.8)

    doc.add_page_break()

    # ==================== MODULE 3 ====================
    add_clean_heading_2(doc, "Module 3")
    add_clean_body(doc, "Campus Surveillance & Telemetry: Powers the public campus newsfeed and provides landmark-based sighting telemetry for lost or stray animals, complete with emergency alerts and 1-Click conversion into official shelter intake.")

    # 3.1 Homepage/Newsfeed
    add_clean_heading_3(doc, "3.1: Homepage/Newsfeed")
    add_subbullet_heading(doc, "Use Case Diagram")
    add_diagram_image(doc, "docs/srs_images/page_19_0_X79.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Use Case Description")
    uc31_fields = [
        ["Use Case ID", "UC-3.1"],
        ["Use Case Name", "Community Newsfeed and Reporting Hub"],
        ["Primary Actor", "Community Member (Student, Faculty, Staff, Guest)"],
        ["Preconditions", "The user accesses the portal homepage or Community Newsfeed tab."],
        ["Main Success Scenario",
         "1. The User visits the homepage.\n"
         "2. The System requests the unified newsfeed endpoint (/api/newsfeed/unified/).\n"
         "3. The System retrieves and chronologically displays aggregated posts: official bulletins, adoption stories, emergency alerts, and community reports.\n"
         "4. Pinned administrative announcements are prominently displayed at the top of the feed.\n"
         "5. Authenticated users can like posts and leave threaded comments.\n"
         "6. Interactive counters (likes, comment count) update immediately in real time."],
        ["Alternative Flows",
         "5a. Unauthenticated User Interacts:\n"
         "   1. Guest user attempts to like or comment.\n"
         "   2. The System displays a sign-in modal prompting the user to log in with their CIT-U credentials."],
        ["Postconditions", "The user stays informed regarding campus animal welfare news, and community interaction is logged for moderation."]
    ]
    add_usecase_table(doc, uc31_fields)
    
    add_subbullet_heading(doc, "Activity Diagram")
    add_diagram_image(doc, "docs/srs_images/page_22_0_X86.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Wireframe")
    add_diagram_image(doc, "docs/srs_images/page_23_0_X89.png", width_inches=4.8)

    doc.add_page_break()

    # 3.2 Landmark-Assisted Sighting Telemetry & 1-Click Intake
    add_clean_heading_3(doc, "3.2: Landmark-Assisted Sighting Telemetry & 1-Click Intake")
    add_subbullet_heading(doc, "Use Case Diagram")
    add_diagram_image(doc, "docs/srs_diagrams/uc_3_2_usecase.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Use Case Description")
    uc32_fields = [
        ["Use Case ID", "UC-3.2"],
        ["Use Case Name", "Landmark-Assisted Sighting Telemetry & 1-Click Intake"],
        ["Primary Actor", "Campus Spotter (Student, Faculty, Security Guard), Shelter Staff"],
        ["Preconditions", "The spotter encounters an uncataloged, lost, or injured animal on CIT-U campus grounds."],
        ["Main Success Scenario",
         "1. The User clicks the 'Report Sighting' button.\n"
         "2. The System presents the ReportSightingView.jsx form.\n"
         "3. The User selects a standardized CIT-U Campus Landmark from the dropdown: NGE Building, Canteen, Main Building, Library, SAL Building, Academic Complex, Gate 1, Gate 2, Gate 3, or Gate 4.\n"
         "4. The User inputs physical description, behavior, and approximate time seen.\n"
         "5. If the animal is injured or in immediate distress, the User checks 'URGENT EMERGENCY', prepending '[🚨 URGENT EMERGENCY]' to the record.\n"
         "6. The User uploads a photo and clicks 'Submit Report'.\n"
         "7. The System validates inputs and publishes the sighting to the staff triage dashboard.\n"
         "8. When rescue volunteers secure the animal, Staff clicks 'Convert to Official Intake' (1-Click Handoff).\n"
         "9. The System automatically transfers landmark, notes, and photo into sessionStorage and opens AddNewPet.jsx pre-filled.\n"
         "10. Staff finalizes the baseline record, registers the companion, and issues a 300 DPI QR collar tag."],
        ["Alternative Flows",
         "5a. Urgent Emergency Flagged:\n"
         "   1. System detects emergency flag and sends high-priority notification to on-duty welfare staff for immediate rescue.\n"
         "6a. Unsupported Image Format:\n"
         "   1. The User attempts to upload an unsupported file type.\n"
         "   2. The System displays an error: 'Please upload a valid JPG or PNG image.'"],
        ["Postconditions", "The sighting report is recorded, rescue teams are alerted, and the animal is smoothly transitioned into official intake without duplicate data entry."]
    ]
    add_usecase_table(doc, uc32_fields)
    
    add_subbullet_heading(doc, "Activity Diagram")
    add_diagram_image(doc, "docs/srs_diagrams/uc_3_2_activity.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Wireframe")
    add_diagram_image(doc, "docs/sighting_sequence_diagram_colorful.png", width_inches=4.8)

    doc.add_page_break()

    # ==================== MODULE 4 ====================
    add_clean_heading_2(doc, "Module 4")
    add_clean_body(doc, "Institutional Security, Governance & Onboarding: Handles first-time user guidance, institutional identity validation (@cit.edu), role-based access control, and sliding 15-minute inactivity session termination.")

    # 4.1 Interactive User Onboarding Walkthrough
    add_clean_heading_3(doc, "4.1: Interactive User Onboarding Walkthrough")
    add_subbullet_heading(doc, "Use Case Diagram")
    add_diagram_image(doc, "docs/srs_diagrams/uc_4_1_usecase.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Use Case Description")
    uc41_fields = [
        ["Use Case ID", "UC-4.1"],
        ["Use Case Name", "Interactive User Onboarding Walkthrough"],
        ["Primary Actor", "First-Time Visitor, Student Volunteer, Campus User"],
        ["Preconditions", "The user accesses the Wildcat Welfare Portal on desktop or mobile."],
        ["Main Success Scenario",
         "1. The System checks localStorage for the key 'hasSeenGuide'.\n"
         "2. If not previously viewed, the System displays the interactive UserGuideModal.jsx walkthrough overlay.\n"
         "3. Step 1 (Welcome & Mission): Explains the purpose of Task Force Bruno and campus animal welfare.\n"
         "4. Step 2 (QR Collar Tagging): Demonstrates how scanning collar tags opens the public Pet Passport with verified vaccination records.\n"
         "5. Step 3 (Sighting Reporting): Explains landmark-based location selection and emergency reporting protocols.\n"
         "6. Step 4 (Adoption & Logistics): Outlines the adoption process and how to contribute in-kind supply donations.\n"
         "7. The User clicks 'Get Started' to finish the tour.\n"
         "8. The System saves the preference in localStorage and closes the modal.\n"
         "9. The guide remains accessible anytime via the 'User Guide' link in the top navigation bar."],
        ["Alternative Flows",
         "7a. User Closes Tour Early:\n"
         "   1. User clicks the 'Close / Skip' button at any step.\n"
         "   2. The modal closes immediately, saving the preference to prevent intrusive re-triggering."],
        ["Postconditions", "The user understands primary portal workflows, reducing onboarding confusion and improving usability (addressing the initial 62.32 SUS validation score)."]
    ]
    add_usecase_table(doc, uc41_fields)
    
    add_subbullet_heading(doc, "Activity Diagram")
    add_diagram_image(doc, "docs/srs_diagrams/uc_4_1_activity.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Wireframe")
    add_diagram_image(doc, "docs/c4_container_diagram.png", width_inches=4.8)

    doc.add_page_break()

    # 4.2 Role-Based Access Control & Institutional Authentication
    add_clean_heading_3(doc, "4.2: Role-Based Access Control & Institutional Authentication")
    add_subbullet_heading(doc, "Use Case Diagram")
    add_diagram_image(doc, "docs/srs_diagrams/uc_4_2_usecase.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Use Case Description")
    uc42_fields = [
        ["Use Case ID", "UC-4.2"],
        ["Use Case Name", "Role-Based Access Control & Institutional Authentication"],
        ["Primary Actor", "CIT-U Student, Faculty, MDC Staff, Shelter Staff, Administrator"],
        ["Preconditions", "The user is attempting to register or log in to the portal."],
        ["Main Success Scenario",
         "1. The User accesses the Login / Registration screen.\n"
         "2. For registration, the System verifies that the Institutional ID matches regex format XX-XXXX-XXX (e.g., 21-1234-567) and the email ends with @cit.edu.\n"
         "3. Upon valid submission, the backend hashes passwords via PBKDF2/bcrypt and creates the account in Supabase PostgreSQL.\n"
         "4. Upon login, the backend authenticates credentials and issues a cryptographically signed JWT token pair.\n"
         "5. The frontend inspects role claims and routes the user:\n"
         "   - CLINIC or STAFF roles route to <StaffDashboard /> with medical logs and intake controls.\n"
         "   - COMMUNITY role routes to <DashboardContainer /> with personal adoption applications.\n"
         "6. The frontend starts a 15-minute sliding inactivity watchdog.\n"
         "7. Active user interactions (keyboard, mouse, touch) continuously reset the 15-minute timer."],
        ["Alternative Flows",
         "2a. Non-Institutional Email Entered:\n"
         "   1. User enters a non-CIT-U email address (e.g., @gmail.com or @yahoo.com).\n"
         "   2. The System rejects registration: 'Only official CIT-U email addresses (@cit.edu) are permitted.'\n"
         "6a. 15 Minutes of Inactivity Elapsed:\n"
         "   1. Inactivity timer reaches zero without user input.\n"
         "   2. The System displays a session timeout notice, purges stored JWT tokens, and redirects to the login screen to protect shared campus computers."],
        ["Postconditions", "Users access only their authorized modules, and abandoned sessions are securely terminated."]
    ]
    add_usecase_table(doc, uc42_fields)
    
    add_subbullet_heading(doc, "Activity Diagram")
    add_diagram_image(doc, "docs/srs_diagrams/uc_4_2_activity.png", width_inches=4.8)
    
    add_subbullet_heading(doc, "Wireframe")
    add_diagram_image(doc, "docs/rbac_sequence_diagram_colorful.png", width_inches=4.8)

    doc.add_page_break()

    # ==================== SECTION 3.4: NON-FUNCTIONAL REQUIREMENTS ====================
    add_clean_heading_1(doc, "3.4 Non-functional requirements")
    
    add_clean_heading_2(doc, "Performance")
    add_clean_bullet(doc, "The system must retrieve and display a pet’s digital Public Pet Passport from a scanned QR code in under 1.5 seconds under standard campus Wi-Fi/4G conditions, and under 20 seconds under edge/low-bandwidth conditions.", "• Identification Speed: ")
    add_clean_bullet(doc, "Community sighting reports must be published and visible on the newsfeed within 3 seconds of submission.", "• Reporting Latency: ")
    add_clean_bullet(doc, "The system must support at least 50 simultaneous users scanning codes, browsing pet listings, or viewing the newsfeed during peak campus hours without noticeable degradation.", "• Concurrency: ")
    add_clean_bullet(doc, "An automated keep-alive cron job pinging GET /api/health/ every 10 minutes keeps the Render container awake, maintaining active API response latencies below 300ms.", "• Cold-Start Keep-Alive: ")
    add_clean_bullet(doc, "The HTML5 canvas QR collar tag generator shall render a 300 DPI collar tag graphic in under 500ms client-side.", "• Tag Generation Speed: ")

    add_clean_heading_2(doc, "Security")
    add_clean_bullet(doc, "Strict role-based permissions must be enforced at the API layer. Only authorized MDC clinic staff can create or modify medical treatments, vaccination logs, and bite incident records.", "• Access Control: ")
    add_clean_bullet(doc, "User account registration is restricted exclusively to authorized CIT-U institutional email addresses (@cit.edu) and student/faculty ID format (XX-XXXX-XXX).", "• Institutional Domain Restriction: ")
    add_clean_bullet(doc, "All user passwords must be hashed using PBKDF2 with SHA-256 or bcrypt prior to database storage. Plaintext passwords are never stored or transmitted.", "• Password Hashing: ")
    add_clean_bullet(doc, "User sessions must automatically terminate after 15 minutes of inactivity on client devices, purging stored authentication tokens to safeguard public campus terminals.", "• Session Management: ")
    add_clean_bullet(doc, "All web traffic and database transactions must be encrypted using HTTPS / TLS 1.3 to ensure data privacy.", "• Transport Encryption: ")

    add_clean_heading_2(doc, "Reliability")
    add_clean_bullet(doc, "The system must maintain 99.5% availability during university operating hours (7:00 AM – 9:00 PM).", "• Operational Uptime: ")
    add_clean_bullet(doc, "Automated daily backups of the PostgreSQL database and uploaded media assets are managed through Supabase backup schedules.", "• Data Backup: ")
    add_clean_bullet(doc, "The system must provide clear, user-friendly error messages if a scan fails, if network connectivity drops, or if an invalid QR code is scanned.", "• Error Handling: ")

    add_clean_heading_2(doc, "Usability")
    add_clean_bullet(doc, "Addressing the baseline System Usability Scale (SUS) benchmark of 62.32 from MVP validation testing, the portal incorporates Module 4.1 (interactive user guide modal) to target an elevated SUS score > 80.0.", "• Usability Benchmark: ")
    add_clean_bullet(doc, "The web interface must be fully responsive, with touch-friendly navigation optimized for standard mobile screens (375px–420px) and accessible desktop layouts.", "• Responsive Design: ")
    add_clean_bullet(doc, "Visual status chips (Green for vaccinated, Red for bite quarantine, Amber for pending) must satisfy WCAG 2.1 AA color contrast standards.", "• Accessibility Standards: ")

    out_docx = "docs/srsupdated.docx"
    doc.save(out_docx)
    print(f"Successfully generated clean, authentic SRS document at: {out_docx}")

if __name__ == "__main__":
    build_clean_srs()
