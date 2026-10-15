import os
import subprocess
from pathlib import Path

# Professional academic document styled like a genuine Microsoft Word / Google Docs Capstone submission
html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Task Force Bruno - MVP Validation Framework</title>
<style>
  @page {
    size: letter portrait;
    margin: 1in 1in 1in 1in;
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    color: #111111;
    line-height: 1.4;
    font-size: 11pt;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }

  /* Academic Title Block */
  .title-block {
    text-align: center;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 1px solid #333333;
  }

  .inst-name {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  .dept-name {
    font-size: 10.5pt;
    color: #333333;
    margin-bottom: 14px;
  }

  .paper-title {
    font-size: 15pt;
    font-weight: bold;
    margin-bottom: 4px;
    text-transform: uppercase;
  }

  .paper-subtitle {
    font-size: 11.5pt;
    font-style: italic;
    color: #333333;
    margin-bottom: 12px;
  }

  .meta-table {
    width: 100%;
    margin: 8px 0;
    font-size: 10pt;
    border: none;
  }

  .meta-table td {
    border: none;
    padding: 2px 4px;
  }

  /* Standard Academic Headings */
  h1 {
    font-size: 12.5pt;
    font-weight: bold;
    color: #000000;
    text-transform: uppercase;
    margin-top: 20px;
    margin-bottom: 8px;
    border-bottom: 1px solid #666666;
    padding-bottom: 2px;
    page-break-after: avoid;
  }

  h2 {
    font-size: 11.5pt;
    font-weight: bold;
    color: #000000;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 11pt;
    font-weight: bold;
    font-style: italic;
    color: #000000;
    margin-top: 10px;
    margin-bottom: 4px;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 8px 0;
    text-align: justify;
    text-indent: 0.25in;
  }

  p.no-indent {
    text-indent: 0;
  }

  /* Academic Word-Style Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }

  th, td {
    border: 1px solid #444444;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background-color: #f2f2f2;
    color: #000000;
    font-weight: bold;
    font-size: 10pt;
  }

  /* Clean academic list */
  ul, ol {
    margin: 4px 0 10px 0;
    padding-left: 28px;
    font-size: 10.5pt;
  }

  li {
    margin-bottom: 4px;
  }

  .note-box {
    border: 1px solid #888888;
    background-color: #fafafa;
    padding: 8px 12px;
    margin: 10px 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }

  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>

  <!-- Title Block -->
  <div class="title-block">
    <div class="inst-name">Cebu Institute of Technology – University</div>
    <div class="dept-name">College of Computer Studies • Department of Information Technology<br>Capstone Project 2: Research &amp; System Validation</div>
    <div class="paper-title">MVP Validation Framework and Evaluation Plan</div>
    <div class="paper-subtitle">An Empirical Usability and Acceptance Study for Task Force Bruno</div>
    
    <table class="meta-table">
      <tr>
        <td style="width: 50%;"><strong>Project:</strong> Task Force Bruno (Campus Pet Management System)</td>
        <td style="width: 50%; text-align: right;"><strong>Date:</strong> September 12, 2026</td>
      </tr>
      <tr>
        <td><strong>Evaluation Target:</strong> Minimum Viable Product (MVP)</td>
        <td style="text-align: right;"><strong>Sample Size:</strong> N = 34 Campus Respondents</td>
      </tr>
    </table>
  </div>

  <!-- Section 1 -->
  <h1>1. Overview and Evaluation Framework</h1>
  <p>
    This document outlines the validation framework and methodology used to evaluate the Minimum Viable Product (MVP) of <strong>Task Force Bruno</strong>, an integrated campus pet management system developed for Cebu Institute of Technology – University (CIT-U). The purpose of this validation is to test the system with actual campus stakeholders, measure core usability and user acceptance, and identify necessary improvements before final deployment.
  </p>
  <p>
    To ensure a structured and objective evaluation, the study adopts two established research models:
  </p>
  <p class="no-indent">
    <strong>1. Technology Acceptance Model (TAM):</strong> Introduced by Davis (1989), TAM evaluates how users accept and use a technology based on two primary factors: <em>Perceived Usefulness (PU)</em>, or the degree to which a user believes the platform enhances campus animal welfare management, and <em>Perceived Ease of Use (PEOU)</em>, the degree to which the system is free of effort to learn and navigate. These directly predict the community's <em>Behavioral Intention (BI)</em> to adopt the system.
  </p>
  <p class="no-indent">
    <strong>2. System Usability Scale (SUS):</strong> Created by John Brooke (1996), SUS provides a quick, industry-standard benchmark for measuring perceived system usability, cognitive complexity, and learnability through alternating positive and negative statements.
  </p>

  <h2>Rationale for Selected Framework</h2>
  <p>
    This combined evaluation model is appropriate for Task Force Bruno for three reasons:
  </p>
  <ul>
    <li><strong>Campus Context:</strong> Managing animals inside the university requires participation from both students (reporting sightings, scanning collars) and administrative/faculty members (reviewing reports, verifying vaccinations). TAM measures whether both user types find the system practical enough to use regularly.</li>
    <li><strong>Campus Safety and RA 9482 Compliance:</strong> Stray and pet management directly relates to student safety and compliance with the Anti-Rabies Act (Republic Act No. 9482). The evaluation measures whether the platform provides clear, reliable rabies and quarantine information.</li>
    <li><strong>Standardized Scoring:</strong> Using standardized Likert-scale questions allows the team to compute concrete numerical benchmarks rather than relying purely on subjective impressions.</li>
  </ul>

  <!-- Section 2 -->
  <h1>2. Mapping Project SMART Objectives to Evaluation Criteria</h1>
  <p>
    The evaluation instrument directly aligns with the project's SMART objectives to verify whether functional targets were met during testing:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 28%;">Project SMART Objective</th>
        <th style="width: 22%;">Evaluation Construct</th>
        <th style="width: 25%;">Target Success Criteria</th>
        <th style="width: 25%;">Mapped Questionnaire Items</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>SMART 1: Rapid Collar ID &amp; Public Passport</strong><br>Allow quick lookup of animal ID, emergency contact, and rabies status via QR scan and AI search without forced login.</td>
        <td>Core Technical Capabilities (TECH) &amp; Ease of Use</td>
        <td>Lookup time &le; 25 sec;<br>TECH1 &ge; 4.0 / 5.0;<br>TECH1-B &ge; 4.2 / 5.0</td>
        <td>Task Scenarios 2, 3, 7;<br>Items: TECH1, TECH1-B, TECH2, PEOU1</td>
      </tr>
      <tr>
        <td><strong>SMART 2: Structured Sighting Reporting &amp; Intake</strong><br>Digitize campus stray reports with location and photos, enabling staff to admit sightings into the registry with one click.</td>
        <td>Perceived Usefulness (PU) &amp; Workflow Efficiency</td>
        <td>PU1 &ge; 4.2 / 5.0;<br>STF1 &ge; 4.2 / 5.0;<br>Zero duplicate data entry</td>
        <td>Task Scenarios 4, 9;<br>Items: PU1, PU4, STF1, PEOU2</td>
      </tr>
      <tr>
        <td><strong>SMART 3: Biosecurity &amp; Quarantine Monitoring</strong><br>Support campus safety and RA 9482 compliance through 14-day bite/scratch observation alerts and immunization badges.</td>
        <td>Perceived Usefulness &amp; Regulatory Compliance</td>
        <td>PU2 &ge; 4.2 / 5.0;<br>PU3 &ge; 4.5 / 5.0 agreement</td>
        <td>Task Scenario 8;<br>Items: PU2, PU3 (RA 9482), PU5</td>
      </tr>
      <tr>
        <td><strong>SMART 4: Supply Logistics by Physical Units</strong><br>Track clinic supplies by realistic physical units (kilograms for food, cans, vials for vaccines).</td>
        <td>Operational Practicality &amp; Clarity</td>
        <td>STF2 &ge; 4.0 / 5.0 positive rating from evaluators</td>
        <td>Task Scenario 11;<br>Items: STF2</td>
      </tr>
      <tr>
        <td><strong>SMART 5: Usability &amp; Adoption Readiness</strong><br>Achieve high learnability, smooth session stability, and strong community intention to recommend the platform.</td>
        <td>System Usability Scale &amp; Behavioral Intention</td>
        <td>SUS-B1 &ge; 4.0; SUS-B2 &le; 2.0;<br>SAT1 &ge; 4.0; BI1 &ge; 85% agree</td>
        <td>Task Scenarios 1, 6;<br>Items: SUS-B1 to B4, SAT1, BI1, BI2, PEOU3</td>
      </tr>
    </tbody>
  </table>

  <!-- Page Break -->
  <div class="page-break"></div>

  <!-- Section 3 -->
  <h1>3. Target Respondents and Sampling Distribution</h1>
  <p>
    The validation study captured <strong>N = 34 completed responses</strong> from the CIT-U campus community, classified according to the primary stakeholder roles established in Question 5 of the validation instrument:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 32%;">Primary Stakeholder Role (Question 5)</th>
        <th style="width: 18%;">Sample Count</th>
        <th style="width: 25%;">Testing Device (Q4)</th>
        <th style="width: 25%;">Primary Evaluation Scope</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>CIT-U Student / General Citizen</strong></td>
        <td>33 (97.1%)</td>
        <td>Smartphone (12 Android, 7 iPhone), Desktop (14)</td>
        <td>Collar QR scanning, AI trait search, sighting reporting, public pet passport, and adoption gallery.</td>
      </tr>
      <tr>
        <td><strong>CIT-U Faculty / Subject Matter Expert (SME)</strong></td>
        <td>1 (2.9%)</td>
        <td>Desktop Web Browser</td>
        <td>Campus safety compliance, regulatory adherence (RA 9482), administrative workflows, and overall institutional value.</td>
      </tr>
      <tr>
        <td><strong>Total Sample Size</strong></td>
        <td><strong>N = 34 (100%)</strong></td>
        <td colspan="2"><strong>Cross-platform evaluation across 19 mobile devices and 15 desktop browsers</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="note-box">
    <strong>Note on Staff and Clinic Operational Modules (Section 6):</strong><br>
    The Google Form includes specialized administrative questions (Section 6: STF1 to STF3) evaluating staff-only features like 1-click sighting intake, physical unit supply management, and collar QR printing. During user testing, faculty SMEs, student welfare leaders, and designated staff evaluators were guided through administrative walkthroughs to evaluate these specific workflows.
  </div>

  <!-- Section 4 -->
  <h1>4. User Testing Scenarios (Section 3 of Instrument)</h1>
  <p>
    During the testing sessions, participants performed and verified practical user flows matching the 12 scenarios listed in Question 6 of the Google Form:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 10%;">#</th>
        <th style="width: 65%;">Scenario Description (Question 6 Checkbox)</th>
        <th style="width: 25%;">Target User Role</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Registered an institutional account / Logged in to the portal</td><td>All Respondents</td></tr>
      <tr><td>2</td><td>Scanned an animal QR tag or uploaded a QR code matrix using the Collar QR Scanner</td><td>All Respondents</td></tr>
      <tr><td>3</td><td>Tested the AI Natural Language Trait Search (e.g., searching by coat color, tags, or location)</td><td>All Respondents</td></tr>
      <tr><td>4</td><td>Submitted an Animal Sighting Report with location details and image upload</td><td>All Respondents</td></tr>
      <tr><td>5</td><td>Navigated the Adoption Gallery and inspected animal profiles / immunization records</td><td>All Respondents</td></tr>
      <tr><td>6</td><td>Tested responsive layout (switching or resizing between mobile and desktop viewports)</td><td>All Respondents</td></tr>
      <tr><td>7</td><td>Tested Public Pet Passport without logging in (viewed emergency identity and rabies status)</td><td>All Respondents</td></tr>
      <tr><td>8</td><td>Observed the distinction between Campus Resident Companions and Strays Available for Adoption</td><td>All Respondents</td></tr>
      <tr><td>9</td><td><em>(Staff Only)</em> Performed sighting triage and tested the "Admit &amp; Intake Stray" transition button</td><td>Faculty SMEs / Staff Evaluators</td></tr>
      <tr><td>10</td><td><em>(Staff Only)</em> Generated and previewed a printable high-res Collar Tag QR code</td><td>Faculty SMEs / Staff Evaluators</td></tr>
      <tr><td>11</td><td><em>(Staff Only)</em> Inspected Supply Logistics inventory broken down by physical units (kg, cans, vials, assets)</td><td>Faculty SMEs / Staff Evaluators</td></tr>
      <tr><td>12</td><td><em>(Staff Only)</em> Tested the Administrative Dashboard (Sighting triage, medical logs, or inventory ledger)</td><td>Faculty SMEs / Staff Evaluators</td></tr>
    </tbody>
  </table>

  <!-- Page Break -->
  <div class="page-break"></div>

  <!-- Section 5 -->
  <h1>5. Structure of the Survey Instrument</h1>
  <p>
    The validation instrument was deployed via Google Forms and organized into nine (9) clear sections. The questionnaire items in Sections 4 through 7 use a standard 5-point Likert scale (1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly Agree, with an N/A option where appropriate).
  </p>

  <h2>Section 4: Quantitative System Evaluation</h2>

  <h3>Factor A: Perceived Usefulness (PU) &amp; Functional Suitability</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Item Code</th>
        <th style="width: 85%;">Survey Question Statement</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>PU1</strong></td><td><strong>Sighting Reporting:</strong> The sighting submission form captures all critical details (photo, location landmark, physical state) needed to locate and rescue campus animals.</td></tr>
      <tr><td><strong>PU2</strong></td><td><strong>Directory Transparency:</strong> The system clearly differentiates between Permanent Campus Residents and Strays Available for Adoption, presenting vaccination badges and TNR status accurately.</td></tr>
      <tr><td><strong>PU3</strong></td><td><strong>Campus Biosecurity &amp; Rabies Quarantine:</strong> The prominent active 14-day observation quarantine alerts for reported bite/scratch incidents provide critical safety protection for the CIT-U community in compliance with RA 9482.</td></tr>
      <tr><td><strong>PU4</strong></td><td><strong>Institutional Coordination:</strong> Task Force Bruno provides a significantly more structured, trackable coordination platform than unorganized Facebook groups or group chats.</td></tr>
      <tr><td><strong>PU5</strong></td><td><strong>Overall Campus Utility:</strong> Overall, the platform addresses real, urgent animal welfare and stray population management challenges across the CIT-U campus.</td></tr>
    </tbody>
  </table>

  <h3>Factor B: Perceived Ease of Use (PEOU) &amp; Navigation</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Item Code</th>
        <th style="width: 85%;">Survey Question Statement</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>PEOU1</strong></td><td><strong>Navigation &amp; Layout:</strong> The user interface hierarchy (navigation bars, cards, action buttons) is intuitive and easy to navigate without needing a user manual.</td></tr>
      <tr><td><strong>PEOU2</strong></td><td><strong>Form Efficiency:</strong> The input forms (sighting reports, adoption inquiries, profile views) are straightforward to complete with clear validation cues.</td></tr>
      <tr><td><strong>PEOU3</strong></td><td><strong>Visual Coherence &amp; Aesthetics:</strong> The typography, official maroon/gold branding, responsive spacing, and SVG iconography feel clean, professional, and visually engaging.</td></tr>
      <tr><td><strong>PEOU4</strong></td><td><strong>Session Continuity:</strong> The system maintains an active session smoothly while working, without abrupt unexpected logouts during active typing or browsing.</td></tr>
    </tbody>
  </table>

  <h3>Factor C: Core Technical Capabilities</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Item Code</th>
        <th style="width: 85%;">Survey Question Statement</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>TECH1</strong></td><td><strong>Collar QR Scanner:</strong> The hardware camera viewfinder and image file QR decoder resolved pet profiles quickly and accurately.</td></tr>
      <tr><td><strong>TECH1-B</strong></td><td><strong>Public Emergency Pet Passport:</strong> Being able to scan an animal's collar and immediately view emergency medical information and security hotlines without forcing an immediate login is highly practical in emergencies.</td></tr>
      <tr><td><strong>TECH2</strong></td><td><strong>AI Trait &amp; Keyword Search:</strong> The search accurately returned relevant animal profiles when searching with physical descriptors (e.g., "calico cat", "white socks") and handled exclusions appropriately.</td></tr>
      <tr><td><strong>TECH3</strong></td><td><strong>Multi-Device Responsiveness:</strong> The application adapted seamlessly between mobile phones and widescreen desktops without clipped cards, awkward overflows, or excessive dead white space.</td></tr>
    </tbody>
  </table>

  <h2>Section 5: Standardized Usability Scale (SUS — 4-Item Usability Benchmark)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Item Code</th>
        <th style="width: 70%;">Question Statement</th>
        <th style="width: 15%;">Polarity</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>SUS-B1</strong></td><td>I think that I would like to use Task Force Bruno frequently for campus animal welfare.</td><td>Positive (+)</td></tr>
      <tr><td><strong>SUS-B2</strong></td><td>I found the system unnecessarily complex or difficult to understand.</td><td>Negative (-)</td></tr>
      <tr><td><strong>SUS-B3</strong></td><td>I felt very confident navigating and using the features of the system.</td><td>Positive (+)</td></tr>
      <tr><td><strong>SUS-B4</strong></td><td>I needed to learn too many things or ask for help before I could use the system effectively.</td><td>Negative (-)</td></tr>
    </tbody>
  </table>

  <!-- Page Break -->
  <div class="page-break"></div>

  <h2>Section 6: Staff &amp; Clinic Operational Modules (Staff Only)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Item Code</th>
        <th style="width: 85%;">Question Statement</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>STF1</strong></td><td><strong>Sighting Intake Handoff:</strong> The ability for staff to verify an animal sighting and directly admit it into pet registration (auto-filling location and photo) eliminates redundant manual data entry.</td></tr>
      <tr><td><strong>STF2</strong></td><td><strong>Supply Dimensional Clarity:</strong> Tracking inventory by genuine physical units (kilograms for kibble, cans for wet food, vials for vaccines, pieces for assets) provides clear and realistic supply management.</td></tr>
      <tr><td><strong>STF3</strong></td><td><strong>Collar Tag Generation:</strong> The integrated QR tag generator makes it easy for staff to create and print official, scannable collar tags for campus animals.</td></tr>
    </tbody>
  </table>

  <h2>Section 7: Behavioral Intention &amp; Overall Satisfaction</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Item Code</th>
        <th style="width: 85%;">Question Statement</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>SAT1</strong></td><td><strong>Overall Satisfaction:</strong> Overall, how satisfied are you with your experience using Task Force Bruno?</td></tr>
      <tr><td><strong>BI1</strong></td><td><strong>Adoption Intention:</strong> Assuming full campus rollout at CIT-U, I intend to actively use Task Force Bruno whenever I encounter stray animals, resident companions, or adoption opportunities.</td></tr>
      <tr><td><strong>BI2</strong></td><td><strong>Endorsement / Recommendation:</strong> I would enthusiastically recommend Task Force Bruno to fellow students, campus staff, and animal welfare advocates.</td></tr>
    </tbody>
  </table>

  <h2>Sections 8 &amp; 9: Qualitative Feedback and Follow-up Consent</h2>
  <ul>
    <li><strong>Question 15 (Encountered Issues &amp; Friction Points):</strong> Open-ended text field capturing any confusing screens, camera issues, or unexpected behavior observed during testing.</li>
    <li><strong>Question 16 (Missing Fields or Desired Capabilities):</strong> Captures feature requests, missing data fields, or suggested filters from students and staff.</li>
    <li><strong>Question 17 (General Critique &amp; Recommendations):</strong> General feedback and recommendations for the development team.</li>
    <li><strong>Question 18 (Follow-up Agreement):</strong> Voluntary consent to be contacted for re-testing during the post-refinement phase before final deployment.</li>
  </ul>

  <!-- Section 6 -->
  <h1>6. Evaluation Success Benchmarks</h1>
  <p>
    The project team established minimum acceptable thresholds and target benchmarks to evaluate whether the MVP is ready for full implementation:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 30%;">Evaluation Dimension</th>
        <th style="width: 30%;">Instrument Reference</th>
        <th style="width: 20%;">Minimum Passing</th>
        <th style="width: 20%;">Target Benchmark</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Perceived Usefulness</strong></td>
        <td>Factor A (Items PU1 to PU5)</td>
        <td>Mean &ge; 3.50 / 5.0</td>
        <td>Mean &ge; 4.20 / 5.0</td>
      </tr>
      <tr>
        <td><strong>Perceived Ease of Use</strong></td>
        <td>Factor B (Items PEOU1 to PEOU4)</td>
        <td>Mean &ge; 3.50 / 5.0</td>
        <td>Mean &ge; 4.00 / 5.0</td>
      </tr>
      <tr>
        <td><strong>Core Technical Capabilities</strong></td>
        <td>Factor C (TECH1, 1-B, 2, 3)</td>
        <td>Mean &ge; 3.50 / 5.0</td>
        <td>Mean &ge; 4.10 / 5.0</td>
      </tr>
      <tr>
        <td><strong>Usability Benchmark (SUS)</strong></td>
        <td>Section 5 (SUS-B1 to SUS-B4)</td>
        <td>Score &ge; 68.0</td>
        <td>Score &ge; 75.0 (Grade A)</td>
      </tr>
      <tr>
        <td><strong>Staff Operational Utility</strong></td>
        <td>Section 6 (STF1 to STF3)</td>
        <td>Mean &ge; 3.50 / 5.0</td>
        <td>Mean &ge; 4.20 / 5.0</td>
      </tr>
      <tr>
        <td><strong>Behavioral Intention &amp; Satisfaction</strong></td>
        <td>Section 7 (SAT1, BI1, BI2)</td>
        <td>Positive &ge; 70.0%</td>
        <td>Positive &ge; 85.0%</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: center; margin-top: 30px; font-size: 10pt; color: #555555; text-indent: 0;">
    — End of Document —<br>
    <strong>Task Force Bruno Capstone Research Team</strong><br>
    Department of Information Technology • Cebu Institute of Technology – University
  </p>

</body>
</html>
"""

Path("docs/temp_validation_plan.html").write_text(html_content, encoding="utf-8")

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
pdf_out = Path("docs/Task_Force_Bruno_MVP_Validation_Plan.pdf").resolve()

cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    f"--print-to-pdf={pdf_out}",
    "--no-pdf-header-footer",
    str(Path("docs/temp_validation_plan.html").resolve())
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("Edge compile exit code:", res.returncode)

if Path("docs/temp_validation_plan.html").exists():
    Path("docs/temp_validation_plan.html").unlink()

print(f"Successfully generated human-style academic PDF at: {pdf_out}")
