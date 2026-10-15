"""
Build script for the Updated Software Requirements Specification (SRS v2.0)
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

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:left w:val="none"/><w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:right w:val="none"/><w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:insideV w:val="none"/></w:tblBorders>')
    tblPr.append(borders)

def add_callout(doc, title, text, bg_hex="EFF6FF", border_hex="2563EB", title_color="1E40AF"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.5)
    
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="24" w:space="0" w:color="{border_hex}"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    run_t = p.add_run(f"{title}\n")
    run_t.font.name = "Segoe UI"
    run_t.font.size = Pt(10.5)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(int(title_color[0:2], 16), int(title_color[2:4], 16), int(title_color[4:6], 16))
    
    run_b = p.add_run(text)
    run_b.font.name = "Segoe UI"
    run_b.font.size = Pt(9.5)
    run_b.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(6)

def add_figure(doc, img_path, caption_text, width_inches=5.8):
    if not os.path.exists(img_path):
        p_err = doc.add_paragraph(f"[Image Missing: {img_path}]")
        p_err.alignment = WD_ALIGN_PARAGRAPH.CENTER
        return
    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(8)
    p_img.paragraph_format.space_after = Pt(2)
    run_img = p_img.add_run()
    run_img.add_picture(img_path, width=Inches(width_inches))
    
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(2)
    p_cap.paragraph_format.space_after = Pt(12)
    run_cap = p_cap.add_run(caption_text)
    run_cap.font.name = "Segoe UI"
    run_cap.font.size = Pt(9.0)
    run_cap.font.italic = True
    run_cap.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)

def add_heading_1(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(18)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.name = "Segoe UI"
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x5C, 0x06, 0x12) # CIT Maroon
    return h

def add_heading_2(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.name = "Segoe UI"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x80, 0x00, 0x00) # Deep Maroon
    return h

def add_heading_3(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(10)
    h.paragraph_format.space_after = Pt(3)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.name = "Segoe UI"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A) # Deep Navy
    return h

def add_heading_4(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(8)
    h.paragraph_format.space_after = Pt(2)
    h.paragraph_format.keep_with_next = True
    r = h.add_run(text)
    r.font.name = "Segoe UI"
    r.font.size = Pt(10)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
    return h

def add_body(doc, text, bold_prefix=None, italic=False, space_after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Segoe UI"
        r_pre.font.size = Pt(9.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    r = p.add_run(text)
    r.font.name = "Segoe UI"
    r.font.size = Pt(9.5)
    r.font.italic = italic
    r.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
    return p

def add_bullet(doc, text, bold_prefix=None, level=0):
    p = doc.add_paragraph(style='List Bullet' if level==0 else 'List Bullet 2')
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Segoe UI"
        r_pre.font.size = Pt(9.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    r = p.add_run(text)
    r.font.name = "Segoe UI"
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
    return p

def add_styled_table(doc, headers, data, col_widths=None):
    tbl = doc.add_table(rows=len(data)+1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    set_table_borders(tbl)
    
    # Header Row
    hdr_cells = tbl.rows[0].cells
    for i, h_text in enumerate(headers):
        cell = hdr_cells[i]
        set_cell_background(cell, "5C0612") # CIT Maroon
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h_text)
        r.font.name = "Segoe UI"
        r.font.size = Pt(9.0)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        
    # Data Rows
    for r_idx, row_data in enumerate(data):
        row_cells = tbl.rows[r_idx+1].cells
        bg_color = "F9FAFB" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = row_cells[c_idx]
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(str(val))
            r.font.name = "Segoe UI"
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
            
    if col_widths:
        for row in tbl.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Inches(w)
                
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(6)
    return tbl

def build_srs_document():
    doc = docx.Document()
    
    # Page setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    # ==================== COVER PAGE ====================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(36)
    p_inst.paragraph_format.space_after = Pt(4)
    r_inst1 = p_inst.add_run("CEBU INSTITUTE OF TECHNOLOGY - UNIVERSITY\n")
    r_inst1.font.name = "Segoe UI"
    r_inst1.font.size = Pt(13)
    r_inst1.font.bold = True
    r_inst1.font.color.rgb = RGBColor(0x5C, 0x06, 0x12)
    
    r_inst2 = p_inst.add_run("COLLEGE OF COMPUTER STUDIES\nDepartment of Information Technology")
    r_inst2.font.name = "Segoe UI"
    r_inst2.font.size = Pt(11)
    r_inst2.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)
    
    # Gold decorative rule
    p_rule = doc.add_paragraph()
    p_rule.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_rule.paragraph_format.space_before = Pt(16)
    p_rule.paragraph_format.space_after = Pt(24)
    r_rule = p_rule.add_run("―" * 38)
    r_rule.font.name = "Segoe UI"
    r_rule.font.size = Pt(14)
    r_rule.font.bold = True
    r_rule.font.color.rgb = RGBColor(0xD4, 0xAF, 0x37) # Gold
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(8)
    r_title = p_title.add_run("SOFTWARE REQUIREMENTS SPECIFICATIONS\n")
    r_title.font.name = "Segoe UI"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x5C, 0x06, 0x12)
    
    r_sub = p_title.add_run("WILDCAT WELFARE PORTAL\nTask Force Bruno (TFB)")
    r_sub.font.name = "Segoe UI"
    r_sub.font.size = Pt(15)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    
    p_desc = doc.add_paragraph()
    p_desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_desc.paragraph_format.space_before = Pt(8)
    p_desc.paragraph_format.space_after = Pt(40)
    r_desc = p_desc.add_run("A Unified Campus Animal Biosecurity, Veterinary Medical Journaling,\nLandmark-Assisted Sighting Telemetry, and Digital Adoption Management System")
    r_desc.font.name = "Segoe UI"
    r_desc.font.size = Pt(10.5)
    r_desc.font.italic = True
    r_desc.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)
    
    # Metadata Block Table
    meta_data = [
        ["Document Identifier:", "TFB-SRS-2026-V2.0"],
        ["Course & Section:", "IT332 - Systems Analysis and Design / Sem 2, AY 2025-2026"],
        ["Target Institution:", "Cebu Institute of Technology - University (CIT-U)"],
        ["Client / Stakeholder:", "CIT-U Medical & Dental Clinic (MDC) & Campus Animal Welfare"],
        ["Development Team:", "Task Force Bruno (Team 18)"],
        ["Current Release:", "Version 2.0 (Comprehensive Post-MVP Production Release)"],
        ["Effective Date:", "September 19, 2026"],
        ["Production Architecture:", "React 19 SPA, Django REST Framework 5.x, Supabase PostgreSQL / Storage, Render Cloud"]
    ]
    tbl_meta = doc.add_table(rows=len(meta_data), cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_meta.autofit = False
    set_table_borders(tbl_meta, color="E5E7EB", sz="2")
    for r_idx, (k, v) in enumerate(meta_data):
        c0 = tbl_meta.rows[r_idx].cells[0]
        c1 = tbl_meta.rows[r_idx].cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        set_cell_background(c0, "F9FAFB")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=60, bottom=60, left=100, right=100)
        set_cell_margins(c1, top=60, bottom=60, left=100, right=100)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.name = "Segoe UI"
        r0.font.size = Pt(9)
        r0.font.bold = True
        r0.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.name = "Segoe UI"
        r1.font.size = Pt(9)
        r1.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)

    doc.add_page_break()
    
    # ==================== CHANGE HISTORY ====================
    add_heading_1(doc, "Document Revision History")
    add_body(doc, "This document follows standard software engineering change management protocols. All modifications, architectural expansions, and stakeholder requirement adjustments are logged below:")
    
    rev_headers = ["Revision", "Release Date", "Author / Role", "Description of Changes"]
    rev_data = [
        ["1.0", "05/06/2026", "Team Wildcat Welfare", "Initial Draft: Baseline requirements for QR profiles, MDC clinic logs, community reporting, adoption intake, and donation logistics."],
        ["2.0", "09/19/2026", "Task Force Bruno Core Team", "Comprehensive Production Expansion:\n• Added Module 1.3: Animal Intake, Baseline Registry & 300 DPI Canvas QR Tag Generation.\n• Added Module 3.2: Landmark-Assisted Sighting Telemetry & 1-Click Intake Hand-off.\n• Added Module 4.1: Interactive User Onboarding Walkthrough (UserGuideModal.jsx) addressing SUS benchmark (62.32).\n• Added Module 4.2: Role-Based Access Control, Institutional Authentication (@cit.edu & XX-XXXX-XXX regex), and 15-Minute Sliding Inactivity Session Termination.\n• Replaced obsolete mock payment gateway in UC-2.2 with physical in-kind warehouse supply logistics and donation intake.\n• Full compliance alignment with Republic Act No. 9482 (Anti-Rabies Act of 2007) and mandatory 14-day bite observation quarantine.\n• Updated architecture specifications to Django REST Framework (Python 3.12), React 19/Vite, Supabase PostgreSQL, Supabase Cloud Storage, and Render keep-alive watchdog."]
    ]
    add_styled_table(doc, rev_headers, rev_data, col_widths=[0.8, 1.1, 1.6, 3.0])
    
    add_heading_2(doc, "Document Sign-Off & Approvals")
    appr_headers = ["Stakeholder Role", "Designation", "Institutional Affiliation", "Approval Status"]
    appr_data = [
        ["Lead Project Architect", "System Lead", "Task Force Bruno / CCS", "Approved - Verified"],
        ["Medical Clinic Representative", "Chief Medical Officer", "CIT-U Medical & Dental Clinic", "Approved - Verified"],
        ["Animal Welfare Officer", "Campus Safety Coordinator", "CIT-U General Services Office", "Approved - Verified"],
        ["Academic Course Assessor", "Course Professor", "CIT-U College of Computer Studies", "Approved - Verified"]
    ]
    add_styled_table(doc, appr_headers, appr_data, col_widths=[1.6, 1.6, 2.0, 1.3])

    # ==================== TABLE OF CONTENTS ====================
    add_heading_1(doc, "Table of Contents")
    toc_items = [
        ("1. Introduction", "5"),
        ("    1.1 Purpose and Objectives", "5"),
        ("    1.2 Scope of the System", "5"),
        ("    1.3 Definitions, Acronyms, and Abbreviations", "6"),
        ("    1.4 References and Statutory Mandates", "6"),
        ("2. Overall Description", "7"),
        ("    2.1 Product Perspective & Context", "7"),
        ("    2.2 User Classes and Operational Roles", "7"),
        ("    2.3 Operating Environment & Cloud Topology", "8"),
        ("    2.4 Design and Implementation Constraints", "8"),
        ("    2.5 Assumptions and Dependencies", "9"),
        ("3. System Interface Requirements", "9"),
        ("    3.1 User Interfaces (UI/UX Standards)", "9"),
        ("    3.2 Hardware Interfaces", "9"),
        ("    3.3 Software Interfaces (Storage & Database)", "10"),
        ("    3.4 Communications Interfaces & Keep-Alive Watchdog", "10"),
        ("4. Specific Functional Requirements (Use Cases)", "10"),
        ("    4.1 Module 1: Veterinary Biosecurity & Animal Identity Core", "10"),
        ("        4.1.1 UC-1.1: QR Collar Tagging & Public Pet Passport Access", "10"),
        ("        4.1.2 UC-1.2: MDC Clinical Journaling, Vaccination Batches & Bite Surveillance", "14"),
        ("        4.1.3 UC-1.3: Animal Intake, Baseline Registry & 300 DPI Canvas QR Tag Generation", "17"),
        ("    4.2 Module 2: Community Engagement & Welfare Operations", "19"),
        ("        4.2.1 UC-2.1: Submit and Process Adoption Application", "19"),
        ("        4.2.2 UC-2.2: Warehouse Supply Logistics, Donation Intake & Physical Unit Stock Ledger", "22"),
        ("    4.3 Module 3: Campus Surveillance & Telemetry", "24"),
        ("        4.3.1 UC-3.1: Homepage, Campus Bulletins & Polymorphic Social Newsfeed", "24"),
        ("        4.3.2 UC-3.2: Landmark-Assisted Sighting Telemetry & 1-Click Intake Hand-off", "27"),
        ("    4.4 Module 4: Institutional Security, Governance & Onboarding", "30"),
        ("        4.4.1 UC-4.1: Interactive User Onboarding Walkthrough & Usability Support", "30"),
        ("        4.4.2 UC-4.2: Role-Based Access Control, Institutional Authentication & Session Security", "32"),
        ("5. Non-Functional Requirements (NFRs)", "35"),
        ("    5.1 Performance Requirements", "35"),
        ("    5.2 Safety and Biosecurity Requirements (RA 9482 Compliance)", "35"),
        ("    5.3 Security and Access Control Requirements", "36"),
        ("    5.4 Software Quality Attributes (Availability, Maintainability, Portability)", "36"),
        ("    5.5 Usability and Human Factors (SUS Benchmark Enhancements)", "36"),
        ("6. Requirements Traceability and Verification Matrix", "37")
    ]
    tbl_toc = doc.add_table(rows=len(toc_items), cols=2)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_toc.autofit = False
    set_table_borders(tbl_toc, color="E5E7EB", sz="2")
    for idx, (title, page) in enumerate(toc_items):
        c0 = tbl_toc.rows[idx].cells[0]
        c1 = tbl_toc.rows[idx].cells[1]
        c0.width = Inches(5.7)
        c1.width = Inches(0.8)
        set_cell_background(c0, "FFFFFF" if idx%2==0 else "F9FAFB")
        set_cell_background(c1, "FFFFFF" if idx%2==0 else "F9FAFB")
        set_cell_margins(c0, top=40, bottom=40, left=80, right=80)
        set_cell_margins(c1, top=40, bottom=40, left=80, right=80)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(title)
        r0.font.name = "Segoe UI"
        r0.font.size = Pt(8.5)
        if not title.startswith("    "):
            r0.font.bold = True
            r0.font.color.rgb = RGBColor(0x5C, 0x06, 0x12)
        else:
            r0.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
            
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r1 = p1.add_run(page)
        r1.font.name = "Segoe UI"
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = RGBColor(0x6B, 0x72, 0x80)

    doc.add_page_break()

    # ==================== SECTION 1: INTRODUCTION ====================
    add_heading_1(doc, "1. Introduction")
    
    add_heading_2(doc, "1.1 Purpose and Objectives")
    add_body(doc, "The Wildcat Welfare Portal (developed under Task Force Bruno) is a comprehensive web-based platform designed to digitally transform and institutionalize animal welfare, veterinary public health, and population telemetry at the Cebu Institute of Technology - University (CIT-U). Historically, campus animal management has suffered from paper-bound veterinary logs, undocumented bite incidents, uncoordinated stray sightings, and informal social media adoption postings. This lack of centralized data infrastructure creates acute administrative and public safety vulnerabilities, particularly regarding campus rabies biosecurity and compliance with national veterinary mandates.")
    add_body(doc, "The primary objectives of the Wildcat Welfare Portal are:")
    add_bullet(doc, "Digitally catalog every resident campus companion animal with high-resolution photographic identity records, clinical histories, and unique QR-coded collar tags.", "1. Centralized Digital Registry: ")
    add_bullet(doc, "Provide instant, permission-free public verification of anti-rabies vaccination credentials and rabies quarantine status via physical smartphone QR scanning to safeguard students, faculty, and personnel.", "2. Public Biosecurity Transparency: ")
    add_bullet(doc, "Furnish the CIT-U Medical and Dental Clinic (MDC) with an encrypted, audit-trailed clinical journal for documenting medical treatments, batch-level vaccine lot tracking, and formal 14-day bite observation protocols.", "3. Clinical Governance & Quarantine: ")
    add_bullet(doc, "Empower campus constituents to log real-time animal sightings using zero-GPS landmark telemetry, with a rapid 1-Click triage hand-off pipeline for shelter intake.", "4. Community Telemetry & Rescue: ")
    add_bullet(doc, "Facilitate ethical, screened digital pet adoptions and manage transparent warehouse logistics for physical supply donations (food, pharmaceuticals, gear).", "5. Ethical Adoption & Logistics: ")
    add_bullet(doc, "Ensure zero-barrier user onboarding and robust institutional security through guided interactive walkthroughs and domain-restricted authentication.", "6. Usability & Governance: ")

    add_heading_2(doc, "1.2 Scope of the System")
    add_body(doc, "The Wildcat Welfare Portal encompasses four core operational pillars spanning veterinary healthcare, rescue operations, community engagement, and administrative governance:")
    add_bullet(doc, "Collar tag optical generation, read-only Public Pet Passport, MDC clinical records management, vaccination lot administration, and 14-day bite/scratch quarantine surveillance.", "Pillar 1 - Veterinary Biosecurity & Animal Identity Core: ")
    add_bullet(doc, "Multi-stage digital adoption applications, applicant questionnaire screening, administrative approval state cascade, and physical supply inventory ledger with deficit threshold alerting.", "Pillar 2 - Welfare Operations & Supply Logistics: ")
    add_bullet(doc, "Aggregated community newsfeed, broadcast bulletins, landmark-assisted sighting reporting (without GPS reliance), emergency triage flags, and 1-click sighting-to-intake conversion.", "Pillar 3 - Campus Surveillance & Sighting Telemetry: ")
    add_bullet(doc, "Strict institutional authentication enforcing @cit.edu domain and XX-XXXX-XXX ID formatting, 15-minute sliding inactivity session termination, cold-start keep-alive watchdogs, and an interactive 4-step user guide modal.", "Pillar 4 - Institutional Security, Governance & Onboarding: ")

    add_heading_2(doc, "1.3 Definitions, Acronyms, and Abbreviations")
    def_headers = ["Term / Acronym", "Full Description & Technical Definition"]
    def_data = [
        ["CIT-U", "Cebu Institute of Technology - University; the academic host institution."],
        ["MDC", "Medical and Dental Clinic; the primary institutional healthcare stakeholder at CIT-U."],
        ["TFB", "Task Force Bruno; the student-led software engineering team developing the platform."],
        ["RA 9482", "Republic Act No. 9482 (Anti-Rabies Act of 2007); Philippine national statute mandating pet registration, mandatory rabies immunization, and strict 14-day observation quarantine for biting animals."],
        ["Public Pet Passport", "A public-facing, responsive web view rendered when an animal's physical collar tag QR is scanned, presenting real-time vaccination badges, quarantine flags, and emergency contact details."],
        ["300 DPI Canvas QR", "High-density Quick Response code rendered client-side on an HTML5 canvas at 300 dots per inch to guarantee optical scan readability when printed onto physical collar tags."],
        ["Landmark Telemetry", "A location recording methodology using predefined CIT-U structural landmarks (e.g., NGE Building, Canteen, Library) to eliminate device GPS inaccuracies and battery drain."],
        ["1-Click Intake Hand-off", "An automated state hand-off transferring unverified community sighting data directly into the official animal intake form via browser sessionStorage."],
        ["SUS", "System Usability Scale; an industry-standard 10-item Likert scale benchmark evaluated at 62.32 during MVP validation and addressed via Module 4.1."],
        ["RBAC", "Role-Based Access Control; security model partitioning system capabilities across Guests, CIT-U Members, Clinic Staff, Welfare Officers, and System Administrators."],
        ["JWT", "JSON Web Token; cryptographically signed token pair (access + refresh) with a 15-minute sliding inactivity expiration watchdog."],
        ["Supabase", "Managed cloud backend providing relational PostgreSQL 15 database storage and S3-compatible cloud object storage buckets."],
        ["Render", "Containerized cloud application hosting environment with automated keep-alive polling to prevent server instance spin-down."]
    ]
    add_styled_table(doc, def_headers, def_data, col_widths=[1.8, 4.7])

    add_heading_2(doc, "1.4 References and Statutory Mandates")
    add_bullet(doc, "IEEE Recommended Practice for Software Requirements Specifications (ANSI/IEEE Std 830-1998).", "1. ")
    add_bullet(doc, "Republic Act No. 9482: An Act Providing for the Control and Elimination of Rabies, Prescribing Penalties for Violation Thereof and Appropriating Funds Therefor (Anti-Rabies Act of 2007).", "2. ")
    add_bullet(doc, "CIT-U Institutional Health and Environmental Safety Guidelines (MDC Biosecurity Standards 2024).", "3. ")
    add_bullet(doc, "Task Force Bruno Software Design Document (SDD v2.0): Post-MVP Architectural Specification (September 2026).", "4. ")
    add_bullet(doc, "Brooke, J. (1996). SUS: A 'quick and dirty' usability scale. Usability Evaluation in Industry, Taylor & Francis.", "5. ")

    # ==================== SECTION 2: OVERALL DESCRIPTION ====================
    add_heading_1(doc, "2. Overall Description")
    
    add_heading_2(doc, "2.1 Product Perspective & Context")
    add_body(doc, "The Wildcat Welfare Portal operates as an institutional software ecosystem connecting students, faculty, clinic personnel, and animal welfare coordinators. The system resides within a modern cloud infrastructure, communicating across a decoupled Single-Page Application (SPA) frontend and a RESTful backend API service.")
    add_figure(doc, "docs/c4_container_diagram.png", "Figure 2.1: C4 Container Diagram - Wildcat Welfare Portal Production Topology", width_inches=6.0)
    add_body(doc, "As visualized in Figure 2.1, the React 19 SPA runs inside modern mobile and desktop browsers, communicating over HTTPS/JSON with the Django REST Framework API layer. The backend orchestrates relational queries and data persistence via Supabase PostgreSQL, while photographic media assets (sighting photos, animal profile shots, vaccination cards) are securely uploaded and served from Supabase Storage buckets. Critical workflow transitions (such as adoption approvals and emergency alerts) trigger transactional outbound emails via an SMTP notification service.")

    add_heading_2(doc, "2.2 User Classes and Operational Roles")
    add_body(doc, "The system strictly partitions privileges across five discrete user categories:")
    role_headers = ["User Class", "Identity & Domain", "Access Channel", "Core System Privileges"]
    role_data = [
        ["Public / Guest Visitor", "Unauthenticated / Any", "Mobile / Desktop Browser", "Scan collar QR codes, view Public Pet Passport, browse active adoption listings, read campus bulletins, submit unverified sightings."],
        ["CIT-U Community Member", "Authenticated (@cit.edu)", "Student / Faculty Portal", "Submit verified adoption applications, track application dossiers, post sightings, comment/like newsfeed bulletins, access onboarding tour."],
        ["MDC Clinic Staff", "Authenticated (Clinic Role)", "MDC Clinic Dashboard", "Record clinical treatments, manage anti-rabies vaccination lots, log bite/scratch incidents, enforce 14-day observation quarantine."],
        ["Welfare Officer / Shelter Staff", "Authenticated (Staff Role)", "Staff Operations Hub", "Perform animal intake, generate 300 DPI QR collar tags, triage community sightings, conduct 1-click intakes, review adoption dossiers, log physical supply inventory."],
        ["System Administrator", "Superuser Credentials", "Django Admin & Security Hub", "Manage user roles and permissions, review security audit logs, monitor database health, oversee container keep-alive telemetry."]
    ]
    add_styled_table(doc, role_headers, role_data, col_widths=[1.5, 1.4, 1.3, 2.3])

    add_heading_2(doc, "2.3 Operating Environment & Cloud Topology")
    add_body(doc, "The platform is engineered to operate across the following hardware, software, and network specifications:")
    add_bullet(doc, "Mobile viewports (360px - 480px width) optimized for Android/iOS smartphone browsers; desktop displays (1024px - 1920px) optimized for administrative and clinical dashboards.", "Client Hardware: ")
    add_bullet(doc, "Google Chrome 120+, Apple Safari 17+, Mozilla Firefox 120+, and Microsoft Edge 120+. Native camera access is utilized for optical QR scanning without requiring native application installation.", "Client Web Browsers: ")
    add_bullet(doc, "Python 3.12 executing Django 5.x and Django REST Framework within a Linux container hosted on the Render cloud platform.", "Backend Application Server: ")
    add_bullet(doc, "Supabase managed PostgreSQL 15 instance with row-level connection pooling and SSL encryption; media assets stored in Supabase Object Storage buckets with CDN distribution.", "Database & Cloud Storage: ")
    add_bullet(doc, "HTTPS encryption via TLS 1.3 with automated Keep-Alive polling targeting /api/health/ to mitigate Render container cold-start dormancy.", "Network & Hosting: ")

    add_heading_2(doc, "2.4 Design and Implementation Constraints")
    add_bullet(doc, "In compliance with CIT-U institutional regulations governing student campus initiatives, the portal completely omits monetary payment gateways. Financial collections are prohibited; all resource mobilization functions strictly via in-kind physical supply donations (kg of dry food, canned food, medical vials, grooming supplies).", "1. Zero Monetary Transactions: ")
    add_bullet(doc, "Because GPS signals suffer severe attenuation inside multi-story concrete campus buildings and deplete mobile batteries rapidly, all sighting and rescue telemetry is constrained to standardized CIT-U physical landmarks (e.g., NGE Building, Canteen, Main Library, Academic Complex).", "2. Zero GPS Hardware Dependency: ")
    add_bullet(doc, "Public Pet Passports must be instantaneously accessible upon scanning a collar tag without requiring account creation, login credentials, or native app downloads.", "3. Zero-Barrier QR Lookup: ")
    add_bullet(doc, "Under Republic Act No. 9482, any companion animal involved in a human scratch or bite incident MUST have its profile flagged with an active 14-day observation quarantine status until certified clear by the MDC clinic.", "4. Statutory Rabies Biosecurity: ")
    add_bullet(doc, "Account registration requires validation against institutional regex XX-XXXX-XXX and strict domain enforcement (@cit.edu) to prevent unauthorized external access.", "5. Institutional Domain Restriction: ")

    add_heading_2(doc, "2.5 Assumptions and Dependencies")
    add_body(doc, "The system operates under the operational assumptions that campus Wi-Fi or commercial 4G/5G mobile connectivity is available throughout the CIT-U grounds. Printing of 300 DPI canvas collar tags assumes availability of standard office inkjet/laser printers or badge laminating hardware. Persistent storage and automated daily backups depend on Supabase cloud SLAs.")

    # ==================== SECTION 3: SYSTEM INTERFACE REQUIREMENTS ====================
    add_heading_1(doc, "3. System Interface Requirements")
    
    add_heading_2(doc, "3.1 User Interfaces")
    add_body(doc, "The user interface adheres to CIT-U visual identity guidelines, utilizing CIT Maroon (#5C0612), Gold accents (#D4AF37), and clean neutral surfaces (#FFFFFF, #F9FAFB, #1F2937).")
    add_bullet(doc, "Responsive CSS Grid and Flexbox layouts dynamically adapting across 375px mobile viewports, tablet screens, and 1080p desktop monitors.", "Responsive Viewport Adaptation: ")
    add_bullet(doc, "Public Pet Passport and Emergency Sighting views feature high-visibility status chips: GREEN (#10B981) for Up-to-Date / Vaccinated, RED (#EF4444) for Quarantine / Urgent Alert, and AMBER (#F59E0B) for Pending / Review.", "Visual Status Hierarchy: ")
    add_bullet(doc, "An interactive multi-step walkthrough modal (UserGuideModal.jsx) triggers for first-time visitors, providing visual orientation across QR biosecurity, sighting reporting, and adoption workflows.", "Interactive Guided Walkthrough: ")
    add_bullet(doc, "Touch-friendly form controls, accessible modal overlays with focus trapping, and WCAG 2.1 Level AA color contrast compliance.", "Accessibility Standards: ")

    add_heading_2(doc, "3.2 Hardware Interfaces")
    add_bullet(doc, "The web application leverages the browser MediaDevices API and native mobile camera software to optically scan collar QR codes at distances of 10cm to 50cm under standard indoor and outdoor campus lighting.", "Optical Camera Hardware: ")
    add_bullet(doc, "The collar tag generation engine exports 300 DPI raster PNG graphics formatted for 2.0-inch circular or rectangular waterproof physical collar medallions.", "Collar Tag Printing Hardware: ")

    add_heading_2(doc, "3.3 Software Interfaces")
    add_bullet(doc, "Managed PostgreSQL database accessed via Django ORM with Psycopg2 binary driver, enforcing foreign-key integrity across users, animals, medical records, adoption dossiers, and inventory ledgers.", "Supabase PostgreSQL Database: ")
    add_bullet(doc, "RESTful binary upload endpoints persisting JPEG/PNG media into dedicated storage buckets ('animal-photos', 'sighting-media', 'medical-documents') with CDN caching.", "Supabase Cloud Object Storage: ")
    add_bullet(doc, "Standardized RESTful JSON endpoints following HTTP specification (GET, POST, PUT, PATCH, DELETE) with status code standards (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found).", "Django REST Framework: ")
    add_bullet(doc, "SMTP gateway transmitting transactional email updates to applicants upon adoption status changes and alerting staff to emergency triage sightings.", "SMTP Mail Transport Service: ")

    add_heading_2(doc, "3.4 Communications Interfaces & Keep-Alive Watchdog")
    add_body(doc, "All external communications execute over HTTPS using TLS 1.3 encryption. API requests carry standard JSON content headers (`Content-Type: application/json`) and cryptographic JWT bearer authorization headers (`Authorization: Bearer <token>`).")
    
    add_callout(doc, "PRODUCTION INFRASTRUCTURE NOTE: KEEP-ALIVE WATCHDOG", 
                "To mitigate free/starter-tier container sleep on the Render cloud host (which otherwise introduces 50-second cold-start latency for field volunteers), the system implements an automated watchdog. A cron job pings the dedicated endpoint GET /api/health/ every 10 minutes. The endpoint returns a lightweight HTTP 200 JSON payload, keeping the WSGI worker hot and maintaining API response latencies below 300ms.",
                bg_hex="EFF6FF", border_hex="2563EB", title_color="1E40AF")

    # ==================== SECTION 4: SPECIFIC FUNCTIONAL REQUIREMENTS ====================
    add_heading_1(doc, "4. Specific Functional Requirements")
    add_body(doc, "This section defines the comprehensive functional requirements across all nine (9) production use cases spanning Modules 1 through 4. Every use case details actor interactions, preconditions, main success sequences, alternative exception flows, and regulatory compliance rules.")

    # ------------------- MODULE 1 -------------------
    add_heading_2(doc, "4.1 Module 1: Veterinary Biosecurity & Animal Identity Core")
    
    # UC-1.1
    add_heading_3(doc, "4.1.1 UC-1.1: QR Collar Tagging & Public Pet Passport Access")
    add_body(doc, "Enables any campus constituent or visiting public member to scan a resident animal's physical collar tag and immediately inspect its official identity, vaccination certification, and rabies quarantine status.")
    
    uc11_spec = [
        ["Use Case ID:", "UC-1.1"],
        ["Use Case Name:", "QR Collar Tagging & Public Pet Passport Access"],
        ["Primary Actor:", "Campus Constituent (Student, Faculty, Staff, or Visitor)"],
        ["Secondary Actors:", "MDC Clinic Staff, Animal Welfare Officer"],
        ["Preconditions:", "The animal has been registered in the database, assigned a unique UUID/Collar ID, and fitted with an active physical QR collar tag."],
        ["Trigger:", "The actor encounters an animal on campus and scans its collar tag using a mobile device camera or barcode scanner application."],
        ["Main Success Scenario:", 
         "1. Actor optically scans the physical QR code affixed to the companion's collar.\n"
         "2. Mobile browser resolves the encoded URL: https://wildcatwelfare.cit.edu/pet-passport/{animal_id}/.\n"
         "3. Frontend executes an unauthenticated GET request to /api/pets/{animal_id}/passport/.\n"
         "4. Backend verifies animal status, retrieves verified vaccination credentials and active quarantine flags.\n"
         "5. System renders the responsive Public Pet Passport view displaying animal name, high-res photo, biological sex, campus territory, anti-rabies vaccination lot status (Up-to-Date badge), and emergency welfare contact CTA.\n"
         "6. Actor reviews the verified credentials and confirms the animal is safe and vaccinated."],
        ["Alternative Flows:",
         "3a. Invalid / Damaged QR Code:\n"
         "   1. Scanner cannot resolve QR or URL points to a non-existent UUID.\n"
         "   2. Backend responds with HTTP 404 Not Found.\n"
         "   3. System displays: 'Companion Profile Not Found. Please report an uncataloged stray.' with a direct CTA to UC-3.2 (Report Sighting).\n\n"
         "4a. Active 14-Day Bite Quarantine Flagged:\n"
         "   1. Animal is currently undergoing mandatory bite observation under RA 9482.\n"
         "   2. System renders a prominent RED WARNING BANNER: '⚠️ BIOSECURITY NOTICE: Animal is currently under active 14-day bite surveillance. Do not approach. Contact MDC Clinic immediately.'\n"
         "   3. System displays a one-tap phone dialer button to the CIT-U MDC Emergency Clinic."],
        ["Postconditions:", "Actor successfully verifies animal health status without logging in; scan event is logged in system telemetry for campus population monitoring."]
    ]
    add_styled_table(doc, ["Attribute", "Specification Details"], uc11_spec, col_widths=[1.8, 4.7])
    
    add_figure(doc, "docs/srs_images/page_10_0_X53.png", "Figure 4.1.1a: Use Case Diagram - UC-1.1 QR-Coded Profile Access", width_inches=4.8)
    add_figure(doc, "docs/srs_images/page_13_0_X61.png", "Figure 4.1.1b: Activity Diagram - UC-1.1 QR Passport Resolution Flow", width_inches=4.8)
    add_figure(doc, "docs/srs_images/page_14_0_X64.png", "Figure 4.1.1c: Wireframe - Public Pet Passport Mobile Screen", width_inches=4.2)

    # UC-1.2
    add_heading_3(doc, "4.1.2 UC-1.2: MDC Clinical Journaling, Vaccination Batches & Bite Surveillance")
    add_body(doc, "Provides the CIT-U Medical and Dental Clinic (MDC) with veterinary health journaling, vaccine inventory lot tracking, and formal bite/scratch incident management in strict accordance with Republic Act No. 9482.")
    
    uc12_spec = [
        ["Use Case ID:", "UC-1.2"],
        ["Use Case Name:", "MDC Clinical Journaling, Vaccination Batches & Bite Incident Surveillance"],
        ["Primary Actor:", "MDC Clinic Staff / Attending Veterinarian"],
        ["Secondary Actors:", "System Administrator, CIT-U Safety Officer"],
        ["Preconditions:", "Staff is authenticated with valid CLINIC role credentials and navigating the MDC Medical Dashboard."],
        ["Trigger:", "An animal receives medical treatment, undergoes scheduled vaccination, or is implicated in a campus bite/scratch incident."],
        ["Main Success Scenario:",
         "1. Clinic staff locates the animal record via search query or direct collar tag scan.\n"
         "2. Staff selects 'Add Clinical Record' on the medical timeline.\n"
         "3. Staff selects record type: [Routine Exam, Anti-Rabies Vaccination, Wound Care, Spay/Neuter, Bite Incident].\n"
         "4. For vaccinations, staff enters Vaccine Manufacturer, Lot/Batch Number, Expiration Date, and Dose Administered.\n"
         "5. Staff attaches diagnostic documentation or treatment notes.\n"
         "6. Staff clicks 'Save Clinical Record'.\n"
         "7. Backend validates inputs, commits record to PostgreSQL, updates animal's next_vaccination_due date, and returns HTTP 201 Created.\n"
         "8. System updates the animal's Public Pet Passport badge to 'Vaccinated - Up to Date'."],
        ["Alternative Flows:",
         "3a. Incident Involves Human Bite or Scratch (RA 9482 Protocol):\n"
         "   1. Staff flags record type as 'Bite Incident'.\n"
         "   2. System automatically sets animal quarantine_status = 'UNDER_OBSERVATION'.\n"
         "   3. System calculates and locks quarantine_end_date = Current Date + 14 Days.\n"
         "   4. System logs the victim's institutional ID and clinic referral records.\n"
         "   5. Emergency notification is dispatched to Welfare Officers for physical animal isolation.\n\n"
         "4a. Incomplete Mandatory Medical Data:\n"
         "   1. Staff attempts submission without vaccine batch number or attending physician name.\n"
         "   2. System blocks form submission, highlights missing inputs in red, and displays validation alert: 'Vaccine batch tracking is legally required per RA 9482.'"],
        ["Postconditions:", "Medical record is permanently appended to the animal's immutable clinical journal; quarantine status updates across all public and administrative views."]
    ]
    add_styled_table(doc, ["Attribute", "Specification Details"], uc12_spec, col_widths=[1.8, 4.7])
    
    add_figure(doc, "docs/srs_images/page_14_1_X65.png", "Figure 4.1.2a: Use Case Diagram - UC-1.2 MDC Medical Records & Biosecurity", width_inches=4.8)
    add_figure(doc, "docs/srs_images/page_17_0_X72.png", "Figure 4.1.2b: Activity Diagram - UC-1.2 Clinical Treatment & Bite Quarantine Flow", width_inches=4.8)
    add_figure(doc, "docs/srs_images/page_18_1_X76.png", "Figure 4.1.2c: Wireframe - MDC Medical Records Dashboard & Clinical Journal", width_inches=4.8)

    # UC-1.3
    add_heading_3(doc, "4.1.3 UC-1.3: Animal Intake, Baseline Registry & 300 DPI Canvas QR Tag Generation")
    add_body(doc, "Governs the official intake of newly cataloged or rescued campus animals, capturing biological baseline metrics and instantly generating high-resolution, print-ready 300 DPI QR collar tags client-side.")
    
    uc13_spec = [
        ["Use Case ID:", "UC-1.3"],
        ["Use Case Name:", "Animal Intake, Baseline Registry & 300 DPI Canvas QR Tag Generation"],
        ["Primary Actor:", "Animal Welfare Officer / Shelter Staff"],
        ["Secondary Actors:", "Campus Spotter (via 1-Click Intake Hand-off)"],
        ["Preconditions:", "Staff is authenticated with STAFF or ADMIN role credentials and accesses AddNewPet.jsx."],
        ["Trigger:", "A new stray animal is rescued on campus, or an uncataloged resident companion is brought in for baseline registration."],
        ["Main Success Scenario:",
         "1. Staff opens the Animal Intake form (AddNewPet.jsx).\n"
         "2. (Optional) If originating from a community sighting, data is automatically pre-filled via sessionStorage (photo, landmark, physical description).\n"
         "3. Staff enters companion identity data: Name, Species (Canine/Feline), Estimated Age, Biological Sex, Primary Color/Markings, Temperament, and Campus Territory.\n"
         "4. Staff captures or uploads a high-resolution primary profile photo.\n"
         "5. Staff clicks 'Register Companion & Generate Collar Tag'.\n"
         "6. Frontend sends multipart/form-data to POST /api/pets/.\n"
         "7. Backend validates payload, persists entity in Supabase PostgreSQL, stores media in 'animal-photos' bucket, and generates a permanent UUID.\n"
         "8. Client-side HTML5 canvas dynamically renders a 300 DPI collar tag medallion featuring the CIT-U Wildcat Welfare emblem, animal name, unique UUID, and a high-contrast QR code pointing to the Public Pet Passport.\n"
         "9. Staff clicks 'Export Printable Tag' to produce a high-resolution PNG for physical collar production.\n"
         "10. The animal immediately appears in the official catalog (PetListings.jsx) and is searchable via PetAISearchAPIView."],
        ["Alternative Flows:",
         "4a. Duplicate Animal Registration Detected:\n"
         "   1. Backend heuristic search identifies an existing record with matching name, species, and territory.\n"
         "   2. System returns HTTP 409 Conflict with duplicate warning modal.\n"
         "   3. Staff reviews side-by-side comparison; if identical, staff merges data into existing profile.\n\n"
         "6a. High-Resolution Image Upload Failure:\n"
         "   1. Network timeout or invalid image MIME-type occurs.\n"
         "   2. System retains all entered form data, displays retry prompt, and allows re-selecting the file without clearing text fields."],
        ["Postconditions:", "Animal record is permanently registered; companion is fitted with a physical 300 DPI QR collar tag; profile is indexed for public search and adoption consideration."]
    ]
    add_styled_table(doc, ["Attribute", "Specification Details"], uc13_spec, col_widths=[1.8, 4.7])
    
    add_figure(doc, "docs/srs_diagrams/uc_1_3_usecase.png", "Figure 4.1.3a: Use Case Diagram - UC-1.3 Animal Intake & QR Generation", width_inches=5.0)
    add_figure(doc, "docs/srs_diagrams/uc_1_3_activity.png", "Figure 4.1.3b: Activity Diagram - UC-1.3 Animal Intake & 300 DPI Tag Generation Flow", width_inches=4.8)
    add_figure(doc, "docs/intake_sequence_diagram_colorful.png", "Figure 4.1.3c: Sequence Diagram - UC-1.3 Animal Intake & Supabase Storage Pipeline", width_inches=5.6)

    # ------------------- MODULE 2 -------------------
    add_heading_2(doc, "4.2 Module 2: Community Engagement & Welfare Operations")
    
    # UC-2.1
    add_heading_3(doc, "4.2.1 UC-2.1: Submit and Process Adoption Application")
    add_body(doc, "Coordinates the complete digital adoption lifecycle, from prospective adopter questionnaire vetting to multi-stage triage review, status progression, automated email dispatch, and forever-home celebratory announcements.")
    
    uc21_spec = [
        ["Use Case ID:", "UC-2.1"],
        ["Use Case Name:", "Submit and Process Adoption Application"],
        ["Primary Actor:", "Prospective Adopter (Student, Faculty, or Approved Public Member)"],
        ["Secondary Actors:", "Animal Welfare Officer / Shelter Reviewer"],
        ["Preconditions:", "The animal has status 'AVAILABLE_FOR_ADOPTION'; the applicant is authenticated via an active student/staff account."],
        ["Trigger:", "The applicant views an animal's profile on PetListings.jsx and clicks 'Apply for Adoption'."],
        ["Main Success Scenario:",
         "1. Applicant reviews adoption eligibility requirements and opens the application form.\n"
         "2. Applicant completes the comprehensive vetting questionnaire: Living Space Type, Household Pet Experience, Landlord Pet Policy, Daily Care Availability, and Household Financial Stability Confirmation.\n"
         "3. Applicant agrees to the CIT-U Animal Welfare Lifetime Care Pledge.\n"
         "4. Applicant clicks 'Submit Application Dossier'.\n"
         "5. Frontend transmits payload to POST /api/adoptions/.\n"
         "6. Backend validates dossier, creates record with status 'PENDING', and notifies Welfare Staff.\n"
         "7. Welfare Staff accesses PendingApplications.jsx, reviews dossier, and updates status sequentially: [UNDER_REVIEW -> INTERVIEW_SCHEDULED -> HOME_CHECK -> APPROVED].\n"
         "8. System automatically dispatches transactional email notifications to the applicant at each milestone.\n"
         "9. Upon final approval, the animal's status transitions to 'ADOPTED', and an automated celebratory bulletin is published to the Unified Newsfeed."],
        ["Alternative Flows:",
         "2a. Applicant Leaves Mandatory Vetting Questions Blank:\n"
         "   1. Frontend validation intercepts submission, scrolls to unfulfilled fields, and displays error: 'All lifestyle vetting questions are mandatory.'\n\n"
         "7a. Application Dossier Rejected:\n"
         "   1. Staff identifies unsuitable living arrangements (e.g., dormitory landlord prohibiting animals).\n"
         "   2. Staff selects 'Reject Application' and inputs standardized rejection rationale.\n"
         "   3. Backend updates status to 'REJECTED' and dispatches polite explanatory notification to applicant.\n"
         "   4. The animal remains available for other prospective adopters."],
        ["Postconditions:", "Adoption dossier is permanently archived; approved adopter receives digital ownership transfer; pet status is updated; celebratory newsfeed post is generated."]
    ]
    add_styled_table(doc, ["Attribute", "Specification Details"], uc21_spec, col_widths=[1.8, 4.7])
    
    add_figure(doc, "docs/srs_images/page_23_1_X90.png", "Figure 4.2.1a: Use Case Diagram - UC-2.1 Digital Adoption Pipeline", width_inches=4.8)
    add_figure(doc, "docs/srs_images/page_26_0_X97.png", "Figure 4.2.1b: Activity Diagram - UC-2.1 Adoption Vetting & Status Cascade Flow", width_inches=4.8)
    add_figure(doc, "docs/srs_images/page_27_0_X100.png", "Figure 4.2.1c: Wireframe - Adoption Application Dossier & Administrative Review", width_inches=4.8)

    # UC-2.2
    add_heading_3(doc, "4.2.2 UC-2.2: Warehouse Supply Logistics, Donation Intake & Physical Unit Stock Ledger")
    add_body(doc, "Manages physical supply donations and shelter inventory across standard metrics (kg, cans, vials, pieces), maintaining an immutable transaction ledger and triggering low-stock deficit alerts without any monetary payment processing.")
    
    uc22_spec = [
        ["Use Case ID:", "UC-2.2"],
        ["Use Case Name:", "Warehouse Supply Logistics, Donation Intake & Physical Unit Stock Ledger"],
        ["Primary Actor:", "Supply Donor / Community Member, Shelter Inventory Custodian"],
        ["Secondary Actors:", "Animal Welfare Officer, Clinic Staff"],
        ["Preconditions:", "Custodian is authenticated with STAFF credentials; Donor is accessing the public Logistics Dashboard."],
        ["Trigger:", "A donor contributes physical supplies (kibble, canned food, vaccines), or shelter staff issues supplies for daily animal feeding and medical care."],
        ["Main Success Scenario (Physical In-Kind Donation Intake):",
         "1. Donor or staff opens the Logistics & Donation portal.\n"
         "2. Donor brings physical goods to the designated campus shelter drop-off station.\n"
         "3. Staff selects 'Log Physical Donation' and inputs Donor Name, Item Category [Dry Food, Canned Wet Food, Anti-Rabies Vaccine, Antibiotics, Collars/Leashes], Quantity, Standard Unit [kg, cans, vials, pieces], and Expiration Date.\n"
         "4. Staff submits the donation form (POST /api/inventory/donation/).\n"
         "5. Backend atomically increments stock_quantity in the inventory table and appends a 'DONATION_IN' audit record to inventory_transactions.\n"
         "6. Real-time supply gauges refresh, reflecting the newly available inventory stock.\n"
         "7. System issues a digital donation acknowledgement receipt."],
        ["Alternative Flows (Stock Disbursement & Deficit Threshold Triggering):",
         "3a. Shelter Staff Issues Supplies for Ward Use:\n"
         "   1. Staff logs stock disbursement (e.g., 5 kg dry cat food consumed).\n"
         "   2. Backend decrements stock_quantity and logs 'DISBURSEMENT_OUT' transaction.\n"
         "   3. If stock_quantity falls below reorder_threshold:\n"
         "      a. Backend flags item status as 'DEFICIT_ALERT'.\n"
         "      b. System automatically pins an urgent 'SUPPLY NEEDED' banner to the Unified Newsfeed (UC-3.1).\n\n"
         "5a. Database Transaction Lock Conflict:\n"
         "   1. Concurrent updates to stock ledger occur.\n"
         "   2. Django transaction.atomic() handles retry mechanism and guarantees zero ledger balance drift."],
        ["Postconditions:", "Physical stock balance is updated in real time; complete ledger audit trail is preserved; critical shortages are automatically published to the community."]
    ]
    add_styled_table(doc, ["Attribute", "Specification Details"], uc22_spec, col_widths=[1.8, 4.7])
    
    add_figure(doc, "docs/srs_diagrams/uc_2_2_usecase.png", "Figure 4.2.2a: Use Case Diagram - UC-2.2 Physical Supply Logistics & Ledger", width_inches=5.0)
    add_figure(doc, "docs/srs_diagrams/uc_2_2_activity.png", "Figure 4.2.2b: Activity Diagram - UC-2.2 Supply Donation & Deficit Alert Flow", width_inches=4.8)
    add_figure(doc, "docs/srs_images/page_32_0_X114.png", "Figure 4.2.2c: Wireframe - Supply Inventory Dashboard & Physical Donation Modal", width_inches=4.8)

    # ------------------- MODULE 3 -------------------
    add_heading_2(doc, "4.3 Module 3: Campus Surveillance & Telemetry")
    
    # UC-3.1
    add_heading_3(doc, "4.3.1 UC-3.1: Homepage, Campus Bulletins & Polymorphic Social Newsfeed")
    add_body(doc, "Aggregates multi-stream campus communications into a single unified social newsfeed (UnifiedNewsfeedAPIView), displaying administrative broadcasts, pet milestones, adoption stories, and community alerts with interactive engagement.")
    
    uc31_spec = [
        ["Use Case ID:", "UC-3.1"],
        ["Use Case Name:", "Homepage, Campus Bulletins & Polymorphic Social Newsfeed"],
        ["Primary Actor:", "Campus User (Student, Faculty, Staff, Guest)"],
        ["Secondary Actors:", "Animal Welfare Officer (Broadcaster)"],
        ["Preconditions:", "User navigates to the portal root URL (https://wildcatwelfare.cit.edu/)."],
        ["Trigger:", "User opens the homepage or navigates to the Community Newsfeed tab."],
        ["Main Success Scenario:",
         "1. Frontend dispatches a GET request to /api/newsfeed/unified/.\n"
         "2. Backend aggregates multi-model streams: Official Announcements, Emergency Sighting Broadcasts, Adoption Celebrations, and General Community Posts.\n"
         "3. Streams are sorted chronologically with pinned administrative bulletins prioritized at the top.\n"
         "4. System renders the responsive newsfeed card list with author tags, time-ago formatting, photo carousels, and verified badges.\n"
         "5. Authenticated users interact via like reactions (POST /api/newsfeed/{id}/like/) and threaded comments (POST /api/newsfeed/{id}/comments/).\n"
         "6. Interactive counters update instantaneously with optimistic UI rendering."],
        ["Alternative Flows:",
         "5a. Unauthenticated Guest Attempts Social Interaction:\n"
         "   1. User clicks like or comment field without active session.\n"
         "   2. System intercepts action, displays gentle login prompt modal: 'Please sign in with your CIT-U account to participate.'\n\n"
         "2a. Network Degradation During Feed Refresh:\n"
         "   1. Network timeout occurs.\n"
         "   2. Frontend serves cached feed items from browser IndexedDB/localStorage and displays subtle 'Offline / Stale Data' indicator."],
        ["Postconditions:", "Constituents remain informed on campus welfare initiatives; community engagement metrics are tracked for welfare outreach assessment."]
    ]
    add_styled_table(doc, ["Attribute", "Specification Details"], uc31_spec, col_widths=[1.8, 4.7])
    
    add_figure(doc, "docs/srs_images/page_19_0_X79.png", "Figure 4.3.1a: Use Case Diagram - UC-3.1 Community Newsfeed & Bulletins", width_inches=4.8)
    add_figure(doc, "docs/srs_images/page_22_0_X86.png", "Figure 4.3.1b: Activity Diagram - UC-3.1 Newsfeed Aggregation & Social Interaction", width_inches=4.8)
    add_figure(doc, "docs/srs_images/page_23_0_X89.png", "Figure 4.3.1c: Wireframe - Unified Newsfeed Interface", width_inches=4.8)

    # UC-3.2
    add_heading_3(doc, "4.3.2 UC-3.2: Landmark-Assisted Sighting Telemetry & 1-Click Intake Hand-off")
    add_body(doc, "Permits rapid reporting of stray or injured campus animals using fixed CIT-U physical landmarks (eliminating GPS failure), flagging urgent emergencies, and empowering staff to execute a 1-Click hand-off into the official animal intake registry.")
    
    uc32_spec = [
        ["Use Case ID:", "UC-3.2"],
        ["Use Case Name:", "Landmark-Assisted Sighting Telemetry & 1-Click Intake Hand-off"],
        ["Primary Actor:", "Campus Spotter (Student, Faculty, Security Guard)"],
        ["Secondary Actors:", "TFB Rescue Team, Animal Welfare Officer"],
        ["Preconditions:", "Spotter encounters a stray, injured, or uncataloged animal on CIT-U campus grounds."],
        ["Trigger:", "Spotter clicks 'Report Sighting' button from navigation bar or mobile quick-action CTA."],
        ["Main Success Scenario:",
         "1. Spotter opens ReportSightingView.jsx.\n"
         "2. Spotter selects a standardized CIT-U Landmark from the curated dropdown list: [NGE Building, Canteen, Main Building, Library, SAL Building, Academic Complex, Gate 1, Gate 2, Gate 3, Gate 4].\n"
         "3. Spotter inputs physical description (coat color, size, recognizable marks) and current behavioral status.\n"
         "4. (Optional) If animal is bleeding, aggressive, or trapped, spotter checks 'URGENT EMERGENCY', prepending '[🚨 URGENT EMERGENCY]' to the record.\n"
         "5. Spotter captures a photo using device camera or uploads image file.\n"
         "6. Spotter submits report (POST /api/sightings/).\n"
         "7. Backend persists record with status 'PENDING_TRIAGE' and uploads image to 'sighting-media' bucket.\n"
         "8. Sighting immediately alerts rescue staff on StaffDashboard.jsx.\n"
         "9. Upon rescue team securing the animal, staff clicks 'Convert to Official Intake' (1-Click Handoff).\n"
         "10. System packages sighting landmark, description, and photo into browser sessionStorage and redirects to AddNewPet.jsx pre-populated.\n"
         "11. Staff confirms baseline data, registers companion, and issues a 300 DPI QR collar tag; sighting status updates to 'RESOLVED_INTAKE'."],
        ["Alternative Flows:",
         "4a. Emergency Sentinel Flag Triggered:\n"
         "   1. System detects '[🚨 URGENT EMERGENCY]' in report payload.\n"
         "   2. Backend elevates alert priority, bypasses normal triage queues, and immediately broadcasts an urgent rescue alert to all on-duty welfare staff.\n\n"
         "5a. Spotter Lacks Device Camera or Image File:\n"
         "   1. Spotter submits sighting without photo attachment.\n"
         "   2. System accepts report, assigns default silhouette avatar, and prompts staff to verify physical location immediately."],
        ["Postconditions:", "Sighting telemetry record is established; unverified stray is successfully converted to official intake with complete chain-of-custody tracking."]
    ]
    add_styled_table(doc, ["Attribute", "Specification Details"], uc32_spec, col_widths=[1.8, 4.7])
    
    add_figure(doc, "docs/srs_diagrams/uc_3_2_usecase.png", "Figure 4.3.2a: Use Case Diagram - UC-3.2 Landmark Sighting & 1-Click Intake", width_inches=5.0)
    add_figure(doc, "docs/srs_diagrams/uc_3_2_activity.png", "Figure 4.3.2b: Activity Diagram - UC-3.2 Sighting Triage & 1-Click Handoff Flow", width_inches=4.8)
    add_figure(doc, "docs/sighting_sequence_diagram_colorful.png", "Figure 4.3.2c: Sequence Diagram - UC-3.2 Landmark Telemetry & 1-Click Handoff Pipeline", width_inches=5.6)

    # ------------------- MODULE 4 -------------------
    add_heading_2(doc, "4.4 Module 4: Institutional Security, Governance & Onboarding")
    
    # UC-4.1
    add_heading_3(doc, "4.4.1 UC-4.1: Interactive User Onboarding Walkthrough & Usability Support")
    add_body(doc, "Provides a structured 4-step onboarding overlay (UserGuideModal.jsx) addressing MVP System Usability Scale (SUS) validation findings (62.32 benchmark), accelerating user comprehension and volunteer task completion.")
    
    uc41_spec = [
        ["Use Case ID:", "UC-4.1"],
        ["Use Case Name:", "Interactive User Onboarding Walkthrough & Usability Support"],
        ["Primary Actor:", "First-Time Visitor, Student Volunteer, Campus Constituent"],
        ["Secondary Actors:", "Volunteer Coordinator"],
        ["Preconditions:", "User accesses the portal via desktop or mobile browser."],
        ["Trigger:", "System detects first-time visitor (localStorage['hasSeenGuide'] is null), or user manually selects 'User Guide' from navigation."],
        ["Main Success Scenario:",
         "1. System renders the interactive UserGuideModal.jsx modal overlay with background backdrop blur.\n"
         "2. Step 1 (Welcome & Mission): User is introduced to Task Force Bruno and the portal's biosecurity goals.\n"
         "3. Step 2 (QR Collar Tagging & Passports): Visual animation demonstrates how physical collar scanning reveals instant vaccination and quarantine records.\n"
         "4. Step 3 (Landmark Sighting Reporting): Tutorial explains landmark selection without GPS and emergency sentinel flagging for rapid response.\n"
         "5. Step 4 (Adoption & Volunteer Support): Overview of ethical adoption vetting and physical supply drop-off procedures.\n"
         "6. User clicks 'Get Started' button.\n"
         "7. System sets localStorage['hasSeenGuide'] = 'true' and smoothly dismisses the modal with CSS fade transition.\n"
         "8. User is oriented and immediately capable of executing primary portal tasks."],
        ["Alternative Flows:",
         "6a. User Dismisses Guide Early:\n"
         "   1. User clicks the 'Skip / Close' button at any step.\n"
         "   2. Modal closes immediately; preference is saved to avoid nagging; guide remains accessible via the 'User Guide' navbar quick-link."],
        ["Postconditions:", "User successfully completes onboarding orientation; measured system usability score increases toward the post-MVP target of > 80.0."]
    ]
    add_styled_table(doc, ["Attribute", "Specification Details"], uc41_spec, col_widths=[1.8, 4.7])
    
    add_figure(doc, "docs/srs_diagrams/uc_4_1_usecase.png", "Figure 4.4.1a: Use Case Diagram - UC-4.1 Interactive User Onboarding", width_inches=5.0)
    add_figure(doc, "docs/srs_diagrams/uc_4_1_activity.png", "Figure 4.4.1b: Activity Diagram - UC-4.1 User Guide Modal Tour Flow", width_inches=4.8)

    # UC-4.2
    add_heading_3(doc, "4.4.2 UC-4.2: Role-Based Access Control, Institutional Authentication & Session Security")
    add_body(doc, "Enforces institutional authentication strictly via institutional email domain (@cit.edu) and student/faculty ID regex (XX-XXXX-XXX), issuing JWT tokens, governing dashboard routing, and terminating inactive sessions via a 15-minute sliding inactivity watchdog.")
    
    uc42_spec = [
        ["Use Case ID:", "UC-4.2"],
        ["Use Case Name:", "Role-Based Access Control, Institutional Authentication & Session Security"],
        ["Primary Actor:", "CIT-U Student / Faculty, MDC Clinic Personnel, Welfare Officer"],
        ["Secondary Actors:", "System Security Daemon, Keep-Alive Watchdog"],
        ["Preconditions:", "User has an active or pending institutional account with CIT-U credentials."],
        ["Trigger:", "User attempts to register, log in, or access privileged administrative/clinical modules."],
        ["Main Success Scenario (Authentication & Session Monitoring):",
         "1. User navigates to Login/Registration portal.\n"
         "2. For registration, system validates Institutional ID against regex: ^\\d{2}-\\d{4}-\\d{3}$ (e.g. 21-1234-567) and Email against domain: ^[a-zA-Z0-9._%+-]+@cit\\.edu$.\n"
         "3. Upon valid credential entry, backend verifies password hash using PBKDF2/bcrypt and generates a cryptographically signed JWT access/refresh token pair carrying role claims [COMMUNITY, CLINIC, STAFF, ADMIN].\n"
         "4. Frontend securely stores token in memory/storage and inspects role claim.\n"
         "5. System routes user to appropriate dashboard: CLINIC/STAFF -> <StaffDashboard />, COMMUNITY -> <DashboardContainer />.\n"
         "6. Frontend initializes a 15-minute sliding inactivity timer monitoring DOM mouse, keyboard, and touch events.\n"
         "7. Each detected interaction resets the 15-minute countdown clock.\n"
         "8. User performs authorized tasks within their permitted RBAC role."],
        ["Alternative Flows (Session Timeout & Access Violations):",
         "6a. User Inactive for 15 Minutes (Sliding Timeout Watchdog):\n"
         "   1. Inactivity timer reaches 0:00 without user interaction.\n"
         "   2. System displays 'Session Expired for Security' alert modal.\n"
         "   3. Tokens are purged from browser storage and Authorization headers are invalidated.\n"
         "   4. User is redirected to login screen, preventing unauthorized access on public/shared campus terminals.\n\n"
         "2a. Non-Institutional Email Attempted:\n"
         "   1. User attempts registration with non-CIT-U domain (e.g. @gmail.com).\n"
         "   2. System rejects registration immediately: 'Access Restricted. Only official CIT-U email addresses (@cit.edu) are authorized.'\n\n"
         "5a. Unauthorized Endpoint Request (RBAC Violation):\n"
         "   1. Community member attempts manual REST dispatch to /api/medical/records/.\n"
         "   2. Django permissions (IsStaffOrClinicUser) intercept request, log security alert, and return HTTP 403 Forbidden."],
        ["Postconditions:", "Authenticated session is strictly maintained; role boundaries are cryptographically enforced; dormant sessions are securely purged."]
    ]
    add_styled_table(doc, ["Attribute", "Specification Details"], uc42_spec, col_widths=[1.8, 4.7])
    
    add_figure(doc, "docs/srs_diagrams/uc_4_2_usecase.png", "Figure 4.4.2a: Use Case Diagram - UC-4.2 Institutional RBAC & Session Security", width_inches=5.0)
    add_figure(doc, "docs/srs_diagrams/uc_4_2_activity.png", "Figure 4.4.2b: Activity Diagram - UC-4.2 Institutional Authentication & Sliding Timeout Flow", width_inches=4.8)
    add_figure(doc, "docs/rbac_sequence_diagram_colorful.png", "Figure 4.4.2c: Sequence Diagram - UC-4.2 Institutional Authentication & Token Lifecycle", width_inches=5.6)

    # ==================== SECTION 5: NON-FUNCTIONAL REQUIREMENTS ====================
    add_heading_1(doc, "5. Non-Functional Requirements (NFRs)")
    
    add_heading_2(doc, "5.1 Performance Requirements")
    add_bullet(doc, "The system shall resolve a scanned QR code and render the full Public Pet Passport view in under 1.5 seconds under standard campus 4G/Wi-Fi conditions, and under 20 seconds under edge/low-bandwidth conditions.", "NFR-PERF-01 (Passport Latency): ")
    add_bullet(doc, "The sighting reporting form shall upload image media to Supabase Storage and commit sighting telemetry in under 2.0 seconds total.", "NFR-PERF-02 (Sighting Submission): ")
    add_bullet(doc, "The unified newsfeed endpoint (/api/newsfeed/unified/) shall aggregate multi-table models and return 50 serialized items in under 800 milliseconds.", "NFR-PERF-03 (Newsfeed Query Optimization): ")
    add_bullet(doc, "The automated cron keep-alive watchdog pinging /api/health/ shall maintain backend container responsiveness, keeping active API latencies below 300ms.", "NFR-PERF-04 (Cold-Start Mitigation): ")
    add_bullet(doc, "The client-side HTML5 canvas tag generator shall render a 300 DPI collar graphic in under 500 milliseconds without UI thread stutter.", "NFR-PERF-05 (Client Tag Generation): ")

    add_heading_2(doc, "5.2 Safety and Biosecurity Requirements (RA 9482 Compliance)")
    add_bullet(doc, "In strict adherence to Republic Act No. 9482, any animal logged with an active bite/scratch incident MUST have its profile flagged with an immutable 14-day observation quarantine status. The quarantine flag cannot be lifted until the 14-day duration has elapsed and an MDC medical officer signs off.", "NFR-BIO-01 (Mandatory 14-Day Quarantine): ")
    add_bullet(doc, "Public Pet Passports must display prominent visual quarantine warnings whenever an animal is under observation, explicitly advising constituents not to approach.", "NFR-BIO-02 (Biosecurity Transparency): ")
    add_bullet(doc, "The system shall maintain an immutable clinical audit trail recording vaccination lot numbers, manufacturers, and expiration dates for every anti-rabies injection administered.", "NFR-BIO-03 (Vaccination Lot Traceability): ")

    add_heading_2(doc, "5.3 Security and Access Control Requirements")
    add_bullet(doc, "User account creation is restricted exclusively to authorized CIT-U institutional domains (@cit.edu) and student/faculty ID regex format (XX-XXXX-XXX).", "NFR-SEC-01 (Institutional Domain Filtering): ")
    add_bullet(doc, "All user passwords must be hashed using PBKDF2 with SHA-256 or bcrypt prior to database persistence; plain-text passwords shall never be transmitted or stored.", "NFR-SEC-02 (Cryptographic Storage): ")
    add_bullet(doc, "Client sessions shall automatically terminate and purge stored JWT tokens upon fifteen (15) consecutive minutes of user inactivity to prevent session hijacking on public campus library computers.", "NFR-SEC-03 (15-Minute Sliding Inactivity Termination): ")
    add_bullet(doc, "All database communications, API transactions, and asset deliveries must be conducted exclusively over HTTPS / TLS 1.3.", "NFR-SEC-04 (Transport Layer Security): ")
    add_bullet(doc, "All API endpoints must defend against OWASP Top 10 vulnerabilities, including SQL injection (enforced via Django parameterized ORM) and Cross-Site Scripting (XSS sanitization on newsfeed comments).", "NFR-SEC-05 (Vulnerability Defense): ")

    add_heading_2(doc, "5.4 Software Quality Attributes")
    add_bullet(doc, "The system shall maintain 99.5% operational availability during core academic campus hours (7:00 AM - 9:00 PM PHT), supported by automated keep-alive health pings.", "NFR-REL-01 (Operational Availability): ")
    add_bullet(doc, "Relational database backups are automated daily via Supabase managed backup schedules, ensuring a Maximum Tolerable Data Loss (RPO) of ≤ 24 hours.", "NFR-REL-02 (Data Resilience & Backup): ")
    add_bullet(doc, "The codebase follows a strictly decoupled architectural model, separating the React 19 SPA frontend from the Django REST Framework backend to enable independent scaling and maintenance.", "NFR-MAINT-01 (Architectural Decoupling): ")
    add_bullet(doc, "The frontend application shall be fully responsive across mobile (iOS/Android), tablet, and desktop browser environments without requiring native installation.", "NFR-PORT-01 (Cross-Platform Compatibility): ")

    add_heading_2(doc, "5.5 Usability and Human Factors (SUS Benchmark Enhancements)")
    add_bullet(doc, "Responding to the initial MVP System Usability Scale (SUS) benchmark score of 62.32, the platform integrates Module 4.1 (UserGuideModal.jsx) and streamlined landmark telemetry to elevate the post-MVP usability benchmark to > 80.0.", "NFR-USE-01 (SUS Benchmark Elevation): ")
    add_bullet(doc, "All critical status badges and emergency warnings must satisfy WCAG 2.1 Level AA color contrast ratios (minimum 4.5:1 for normal text).", "NFR-USE-02 (Accessibility Compliance): ")
    add_bullet(doc, "A first-time user shall be able to complete a stray sighting report within ninety (90) seconds of encountering an animal on campus.", "NFR-USE-03 (Task Efficiency): ")

    # ==================== SECTION 6: TRACEABILITY MATRIX ====================
    add_heading_1(doc, "6. Requirements Traceability and Verification Matrix")
    add_body(doc, "The following matrix maps all functional and non-functional requirements to their verification method, target acceptance criteria, and responsible role, ensuring full lifecycle verification:")
    
    matrix_headers = ["Req ID", "Requirement Description", "Verification Method", "Target Acceptance Criteria", "Responsible"]
    matrix_data = [
        ["FR-1.1", "QR Public Pet Passport", "Integration / Field Test", "Scanned QR renders passport in < 1.5s with verified vaccination badge.", "Frontend / QA"],
        ["FR-1.2", "MDC Clinical Journal & Quarantine", "System Test / Clinical Audit", "Bite incident sets 14-day lock; vaccination lot persisted accurately.", "Backend / MDC"],
        ["FR-1.3", "Animal Intake & 300 DPI Canvas QR", "Visual Inspection / Print Test", "Intake commits record to Supabase; canvas tag prints crisp at 300 DPI.", "Frontend / Staff"],
        ["FR-2.1", "Digital Adoption Application", "End-to-End User Test", "Dossier vetted; status cascade dispatches transactional email alerts.", "Full Stack / Staff"],
        ["FR-2.2", "Supply Logistics & Stock Ledger", "Automated Unit Test", "In-kind donation increments stock; low balance triggers deficit alert.", "Backend / Logistics"],
        ["FR-3.1", "Unified Social Newsfeed", "Performance / UI Test", "Aggregates multi-stream cards < 800ms; likes/comments update live.", "Frontend / Backend"],
        ["FR-3.2", "Landmark Sighting & 1-Click Intake", "Field Telemetry Test", "Dropdown logs landmark; 1-click pre-populates AddNewPet via storage.", "Frontend / Rescue"],
        ["FR-4.1", "Interactive Onboarding Walkthrough", "User Acceptance Test (UAT)", "Guide triggers for first-time visitors; SUS benchmark exceeds 80.0.", "UI/UX / Volunteer"],
        ["FR-4.2", "Institutional RBAC & 15m Timeout", "Security Audit / Penetration", "Blocks non-@cit.edu; 15 min idle purges tokens and redirects to login.", "Security / DevOps"],
        ["NFR-01", "Render Keep-Alive Watchdog", "Telemetry Monitoring", "GET /api/health/ pings every 10 min; eliminates 50s cold-starts.", "DevOps Lead"],
        ["NFR-02", "RA 9482 Biosecurity Compliance", "Regulatory Audit", "100% of reported bite incidents enforce mandatory 14-day quarantine.", "MDC Liaison"]
    ]
    add_styled_table(doc, matrix_headers, matrix_data, col_widths=[0.8, 1.8, 1.3, 1.8, 0.8])

    out_docx = "docs/srsupdated.docx"
    doc.save(out_docx)
    print(f"Successfully generated updated SRS document at: {out_docx}")

if __name__ == "__main__":
    build_srs_document()
