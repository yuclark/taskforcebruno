import os
import subprocess
from pathlib import Path
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

# Load inventory and traceability data from our source
import sys
sys.path.append('docs')
import generate_rtm_and_inventory as src

inventory_data = src.inventory_data
traceability_data = src.traceability_data

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# ==========================================
# COMMON EXCEL STYLES
# ==========================================
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

# ==============================================================================
# 1. GENERATE SEPARATE REQUIREMENTS INVENTORY FILES (EXCEL & PDF)
# ==============================================================================

# A. Excel Workbook: Requirements Inventory
wb_inv = openpyxl.Workbook()
ws_inv = wb_inv.active
ws_inv.title = "Requirements Inventory"

ws_inv["A1"] = "Task Force Bruno - Requirements Inventory (Catalog)"
ws_inv["A1"].font = font_title
ws_inv["A2"] = "Cebu Institute of Technology - University • College of Computer Studies • Capstone 2 (IT332)"
ws_inv["A2"].font = font_subtitle

headers_inv = [
    "Goal ID", "SMART Goal", "Requirement ID", "Requirement Statement", 
    "Transaction (Input → Process → Output)", "Type", "Priority", 
    "Status Percentage", "Notes / Issues", "Owner"
]

row_num = 4
for col_idx, h in enumerate(headers_inv, 1):
    c = ws_inv.cell(row=row_num, column=col_idx, value=h)
    c.font = font_header
    c.fill = fill_header
    c.alignment = align_header
    c.border = thin_border
ws_inv.row_dimensions[row_num].height = 28

for row_idx, r_data in enumerate(inventory_data, start=row_num+1):
    current_fill = fill_zebra if row_idx % 2 == 1 else fill_white
    for col_idx, val in enumerate(r_data, 1):
        c = ws_inv.cell(row=row_idx, column=col_idx, value=val)
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
    ws_inv.row_dimensions[row_idx].height = 55

col_widths_inv = [10, 32, 14, 38, 45, 14, 10, 14, 32, 18]
for i, w in enumerate(col_widths_inv, 1):
    ws_inv.column_dimensions[get_column_letter(i)].width = w

excel_inv_path = Path("docs/Task_Force_Bruno_Requirements_Inventory.xlsx").resolve()
wb_inv.save(excel_inv_path)
print(f"Saved Excel: {excel_inv_path}")

# B. PDF: Requirements Inventory (Without Sign-off Section)
inv_rows_html = ""
for idx, r in enumerate(inventory_data):
    bg_style = 'style="background-color: #faf6f0;"' if idx % 2 == 1 else ''
    pct_display = f"{int(r[7]*100)}%"
    inv_rows_html += f"""
    <tr {bg_style}>
      <td style="text-align: center; font-weight: bold; color: #800000;">{r[0]}</td>
      <td><strong>{r[1][:55]}...</strong></td>
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

pdf_inv_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Task Force Bruno - Requirements Inventory</title>
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
  .badge-type {{ background-color: #e2e3e5; color: #383d41; }}
  .badge-priority {{ background-color: #fff3cd; color: #856404; }}
</style>
</head>
<body>
  <div class="title-block">
    <div class="inst-name">Cebu Institute of Technology – University</div>
    <div class="dept-name">College of Computer Studies • Department of Information Technology<br>IT332 – Capstone Project 2: Systems Development &amp; Research Validation</div>
    <div class="paper-title">Requirements Inventory (System Specification Catalog)</div>
    <div class="paper-subtitle">Functional and Non-Functional Transaction Specifications for Task Force Bruno</div>
    
    <table class="meta-table">
      <tr>
        <td style="width: 45%;"><strong>System:</strong> Task Force Bruno (Wildcat Welfare Portal)</td>
        <td style="width: 25%; text-align: center;"><strong>Team:</strong> Team 18 (Task Force Bruno)</td>
        <td style="width: 30%; text-align: right;"><strong>Document Version:</strong> 2.0 (Post-Refactoring)</td>
      </tr>
      <tr>
        <td><strong>Institutional Scope:</strong> CIT-U Campus Premises &amp; RA 9482 Compliance</td>
        <td style="text-align: center;"><strong>Total Requirements:</strong> 21 Requirements Active</td>
        <td style="text-align: right;"><strong>Completion Status:</strong> 100% Implemented &amp; Tested</td>
      </tr>
    </table>
  </div>

  <h1>Requirements Inventory Specification</h1>
  <p class="no-indent">
    The following catalog establishes the baseline functional and non-functional requirements derived from project SMART goals (G1–G6). Each entry defines the concrete operational transaction (<em>Input ➔ Process ➔ Output</em>), categorization, priority, status percentage, and subsystem owner:
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

  <p style="text-align: center; margin-top: 18px; font-size: 8.5pt; color: #555555; text-indent: 0;">
    — End of Requirements Inventory (Catalog) —<br>
    <strong>Task Force Bruno Capstone Engineering &amp; Research Team</strong><br>
    Department of Information Technology • Cebu Institute of Technology – University
  </p>
</body>
</html>
"""

temp_inv_html = Path("docs/temp_inv.html")
temp_inv_html.write_text(pdf_inv_html, encoding="utf-8")
pdf_inv_out = Path("docs/Task_Force_Bruno_Requirements_Inventory.pdf").resolve()

cmd_inv = [
    edge_path, "--headless", "--disable-gpu",
    f"--print-to-pdf={pdf_inv_out}", "--no-pdf-header-footer",
    str(temp_inv_html.resolve())
]
subprocess.run(cmd_inv, capture_output=True, text=True)
if temp_inv_html.exists():
    temp_inv_html.unlink()
print(f"Saved PDF: {pdf_inv_out}")


# ==============================================================================
# 2. GENERATE SEPARATE REQUIREMENTS TRACEABILITY MATRIX FILES (EXCEL & PDF)
# ==============================================================================

# A. Excel Workbook: Traceability Matrix
wb_trace = openpyxl.Workbook()
ws_trace = wb_trace.active
ws_trace.title = "Traceability Matrix"

ws_trace["A1"] = "Task Force Bruno - Requirements Traceability Matrix (RTM)"
ws_trace["A1"].font = font_title
ws_trace["A2"] = "Updated SRS v2.0 → Updated SDD v3.1 → Implementation Modules → Software Test Document (STD v2.0)"
ws_trace["A2"].font = font_subtitle

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
    c = ws_trace.cell(row=row_num, column=col_idx, value=h)
    c.font = font_header
    c.fill = fill_header
    c.alignment = align_header
    c.border = thin_border
ws_trace.row_dimensions[row_num].height = 32

for row_idx, r_data in enumerate(traceability_data, start=row_num+1):
    current_fill = fill_zebra if row_idx % 2 == 1 else fill_white
    for col_idx, val in enumerate(r_data, 1):
        c = ws_trace.cell(row=row_idx, column=col_idx, value=val)
        c.font = font_data_bold if col_idx in [1, 6] else font_data
        c.fill = current_fill
        c.border = thin_border
        if col_idx in [1, 6]:
            c.alignment = align_center
        else:
            c.alignment = align_left
    ws_trace.row_dimensions[row_idx].height = 36

col_widths_trace = [16, 26, 32, 36, 24, 14]
for i, w in enumerate(col_widths_trace, 1):
    ws_trace.column_dimensions[get_column_letter(i)].width = w

excel_trace_path = Path("docs/Task_Force_Bruno_Requirements_Traceability_Matrix.xlsx").resolve()
wb_trace.save(excel_trace_path)
print(f"Saved Excel: {excel_trace_path}")

# B. PDF: Traceability Matrix (Without Sign-off Section)
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

pdf_trace_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Task Force Bruno - Requirements Traceability Matrix</title>
<style>
  @page {{
    size: letter landscape;
    margin: 0.65in 0.7in 0.65in 0.7in;
  }}
  body {{
    font-family: 'Times New Roman', Times, serif;
    color: #111111;
    line-height: 1.32;
    font-size: 9.5pt;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }}
  .title-block {{
    text-align: center;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 2px solid #800000;
  }}
  .inst-name {{
    font-size: 13.5pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #800000;
    margin-bottom: 2px;
  }}
  .dept-name {{
    font-size: 10pt;
    color: #333333;
    margin-bottom: 6px;
  }}
  .paper-title {{
    font-size: 14.5pt;
    font-weight: bold;
    margin-bottom: 2px;
    text-transform: uppercase;
    color: #111111;
  }}
  .paper-subtitle {{
    font-size: 10pt;
    font-style: italic;
    color: #444444;
    margin-bottom: 6px;
  }}
  .meta-table {{
    width: 100%;
    margin: 2px 0 0 0;
    font-size: 9pt;
    border: none;
  }}
  .meta-table td {{
    border: none;
    padding: 1px 4px;
  }}
  h1 {{
    font-size: 11.5pt;
    font-weight: bold;
    color: #800000;
    text-transform: uppercase;
    margin-top: 14px;
    margin-bottom: 6px;
    border-bottom: 1px solid #800000;
    padding-bottom: 2px;
    page-break-after: avoid;
    break-after: avoid;
  }}
  p {{
    margin: 0 0 6px 0;
    text-align: justify;
    text-indent: 0.2in;
    font-size: 9.5pt;
  }}
  p.no-indent {{
    text-indent: 0;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 12px 0;
    font-size: 8.5pt;
    page-break-inside: auto;
  }}
  tr {{
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  th, td {{
    border: 1px solid #555555;
    padding: 5px 6px;
    text-align: left;
    vertical-align: top;
  }}
  th {{
    background-color: #800000;
    color: #ffffff;
    font-weight: bold;
    font-size: 8.5pt;
    text-align: center;
  }}
  .badge {{
    display: inline-block;
    padding: 1px 5px;
    font-size: 8pt;
    font-weight: bold;
    border-radius: 3px;
  }}
  .badge-pass {{ background-color: #d4edda; color: #155724; }}
  code {{
    font-family: Consolas, monospace;
    font-size: 8pt;
    background-color: #f1f1f1;
    padding: 1px 2px;
  }}
</style>
</head>
<body>
  <div class="title-block">
    <div class="inst-name">Cebu Institute of Technology – University</div>
    <div class="dept-name">College of Computer Studies • Department of Information Technology<br>IT332 – Capstone Project 2: Systems Development &amp; Research Validation</div>
    <div class="paper-title">Requirements Traceability Matrix (RTM)</div>
    <div class="paper-subtitle">Bidirectional Traceability Specification for Task Force Bruno: Wildcat Welfare Portal</div>
    
    <table class="meta-table">
      <tr>
        <td style="width: 45%;"><strong>System:</strong> Task Force Bruno (Campus Pet Management Portal)</td>
        <td style="width: 25%; text-align: center;"><strong>Team:</strong> Team 18 (Task Force Bruno)</td>
        <td style="width: 30%; text-align: right;"><strong>Document Version:</strong> 2.0 (Post-Refactoring)</td>
      </tr>
      <tr>
        <td><strong>Baseline Specs:</strong> Updated SRS v2.0 &amp; Updated SDD v3.1</td>
        <td style="text-align: center;"><strong>Verification Scope:</strong> STD v2.0 Test Execution</td>
        <td style="text-align: right;"><strong>Verification Status:</strong> 100% Passed (21 of 21)</td>
      </tr>
    </table>
  </div>

  <h1>Requirements Traceability Model</h1>
  <p class="no-indent">
    The following matrix establishes forward and backward traceability across the entire engineering lifecycle:
  </p>
  <p style="text-align: center; font-weight: bold; color: #800000; text-indent: 0; margin: 4px 0 8px 0; font-size: 9.5pt;">
    Requirement ID ➔ SRS Reference (Use Cases / AD / Wireframes) ➔ SDD Reference (Class / Sequence / UI / DB) ➔ Implementation Module(s) ➔ STD Reference (Test Cases) ➔ Status
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 10%;">Requirement ID</th>
        <th style="width: 18%;">SRS Reference<br><span style="font-size: 7.5pt; font-weight: normal;">(Use Cases, Activity Diagrams, Wireframes)</span></th>
        <th style="width: 22%;">SDD Reference<br><span style="font-size: 7.5pt; font-weight: normal;">(Class Diagrams, Sequence Diagrams, UIs, DBs)</span></th>
        <th style="width: 26%;">Implementation Module(s) / Component(s)</th>
        <th style="width: 15%;">STD Reference<br><span style="font-size: 7.5pt; font-weight: normal;">(Test Case IDs)</span></th>
        <th style="width: 9%;">Status</th>
      </tr>
    </thead>
    <tbody>
      {trace_rows_html}
    </tbody>
  </table>

  <p style="text-align: center; margin-top: 18px; font-size: 8.5pt; color: #555555; text-indent: 0;">
    — End of Requirements Traceability Matrix (RTM) —<br>
    <strong>Task Force Bruno Capstone Engineering &amp; Research Team</strong><br>
    Department of Information Technology • Cebu Institute of Technology – University
  </p>
</body>
</html>
"""

temp_trace_html = Path("docs/temp_trace.html")
temp_trace_html.write_text(pdf_trace_html, encoding="utf-8")
pdf_trace_out = Path("docs/Task_Force_Bruno_Requirements_Traceability_Matrix.pdf").resolve()

cmd_trace = [
    edge_path, "--headless", "--disable-gpu",
    f"--print-to-pdf={pdf_trace_out}", "--no-pdf-header-footer",
    str(temp_trace_html.resolve())
]
subprocess.run(cmd_trace, capture_output=True, text=True)
if temp_trace_html.exists():
    temp_trace_html.unlink()
print(f"Saved PDF: {pdf_trace_out}")

# ==============================================================================
# 3. GENERATE SEPARATE MARKDOWN FILES (Without Sign-off Section)
# ==============================================================================

# A. Markdown: Requirements Inventory
md_inv = """# 📋 Task Force Bruno: Requirements Inventory (Catalog)
**Document Version:** 2.0 (Post-Refactoring System Release)  
**System:** Task Force Bruno – Integrated Campus Pet Management System (Wildcat Welfare Portal)  
**Institutional Affiliation:** Cebu Institute of Technology – University (CIT-U)  
**Department:** College of Computer Studies • Department of Information Technology  
**Course:** IT332 – Capstone Project 2: Systems Development & Research Validation  
**Baseline Documents:** Updated SRS v2.0 & Updated SDD v3.1  

---

## Requirements Inventory

| Goal ID | SMART Goal | Requirement ID | Requirement Statement | Transaction (Input → Process → Output) | Type | Priority | Status % | Notes / Issues | Owner |
| :---: | :--- | :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
"""
for r in inventory_data:
    pct_str = f"{int(r[7]*100)}%"
    md_inv += f"| **{r[0]}** | {r[1]} | **{r[2]}** | {r[3]} | {r[4]} | {r[5]} | {r[6]} | {pct_str} | {r[8]} | {r[9]} |\n"

md_inv += """
---
*End of Requirements Inventory (Catalog)*  
**Task Force Bruno Capstone Engineering & Research Team**  
*Department of Information Technology • Cebu Institute of Technology – University*
"""
Path("docs/REQUIREMENTS_INVENTORY.md").write_text(md_inv, encoding="utf-8")
print("Saved Markdown: docs/REQUIREMENTS_INVENTORY.md")

# B. Markdown: Traceability Matrix
md_trace = """# 📋 Task Force Bruno: Requirements Traceability Matrix (RTM)
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
"""
for r in traceability_data:
    md_trace += f"| **{r[0]}** | {r[1]} | {r[2]} | `{r[3]}` | **{r[4]}** | **{r[5]}** |\n"

md_trace += """
---
*End of Requirements Traceability Matrix (RTM)*  
**Task Force Bruno Capstone Engineering & Research Team**  
*Department of Information Technology • Cebu Institute of Technology – University*
"""
Path("docs/REQUIREMENTS_TRACEABILITY_MATRIX.md").write_text(md_trace, encoding="utf-8")
print("Saved Markdown: docs/REQUIREMENTS_TRACEABILITY_MATRIX.md")

print("\n=== All separate files generated successfully without signature sections! ===")
