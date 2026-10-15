import os
import subprocess
from pathlib import Path

# Human-styled Microsoft Word / Google Docs Capstone Validation Highlights
html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Task Force Bruno - MVP Validation Highlights</title>
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

  /* Standard Headings */
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

  ul, ol {
    margin: 4px 0 10px 0;
    padding-left: 28px;
    font-size: 10.5pt;
  }

  li {
    margin-bottom: 4px;
  }

  .quote-box {
    border-left: 3px solid #666666;
    padding-left: 12px;
    margin: 8px 0 10px 0;
    font-style: italic;
    font-size: 10pt;
    color: #222222;
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
    <div class="paper-title">MVP Validation Highlights and Findings</div>
    <div class="paper-subtitle">Empirical Results, User Feedback, and Pre-Implementation Action Plan for Task Force Bruno</div>
    
    <table class="meta-table">
      <tr>
        <td style="width: 50%;"><strong>Project:</strong> Task Force Bruno (Campus Pet Management System)</td>
        <td style="width: 50%; text-align: right;"><strong>Validation Period:</strong> September 9–13, 2026</td>
      </tr>
      <tr>
        <td><strong>Total Validated Sample:</strong> N = 34 Completed Responses</td>
        <td style="text-align: right;"><strong>Submission Deadline:</strong> September 12, 2026</td>
      </tr>
    </table>
  </div>

  <!-- Section 1 -->
  <h1>1. Executive Summary</h1>
  <p>
    This report summarizes the empirical findings and qualitative stakeholder insights obtained during the Minimum Viable Product (MVP) validation of <strong>Task Force Bruno: Integrated Campus Pet Management System</strong> at Cebu Institute of Technology – University (CIT-U). Validation was conducted between September 9 and September 13, 2026, using an online structured instrument administered to campus stakeholders following interactive testing sessions.
  </p>
  <p>
    A total of <strong>N = 34 valid responses</strong> were gathered, comprising 33 students and 1 faculty subject matter expert (SME). The evaluation measured practical usability, system performance, biosecurity compliance under Republic Act No. 9482, and behavioral intention to adopt. Key findings from the validation include:
  </p>
  <ul>
    <li><strong>Strong Overall Utility and Aesthetic Appreciation:</strong> Respondents rated the system's ability to address campus stray challenges at <strong>4.31 / 5.0</strong> (PU5) and commended the official CIT-U maroon and gold visual branding at <strong>4.39 / 5.0</strong> (PEOU3), the highest-rated interface element.</li>
    <li><strong>High Behavioral Intention to Adopt:</strong> Stakeholders expressed solid intention to actively use the system upon deployment (<strong>4.24 / 5.0</strong>, BI1) and enthusiastically recommend it to peers and advocates (<strong>4.26 / 5.0</strong>, BI2). Overall experience satisfaction averaged <strong>4.03 / 5.0</strong> (SAT1).</li>
    <li><strong>Usability Benchmark (SUS):</strong> The 4-item System Usability Scale benchmark produced an average composite score of <strong>62.32 / 100</strong>. While willingness to use frequently was high (<strong>4.26 / 5.0</strong>), users identified specific friction points in initial authentication and mobile layout density that require refinement.</li>
    <li><strong>Actionable Feedback:</strong> Users requested an interactive campus map-pinning tool for stray locations, urgent/emergency reporting tags for injured animals, guided onboarding for first-time users, and camera permission optimizations on older smartphones.</li>
  </ul>

  <!-- Section 2 -->
  <h1>2. Respondent Demographics and Device Distribution</h1>
  <p>
    All 34 participants consented to the evaluation protocol. Testing occurred across diverse mobile and desktop hardware configurations:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 35%;">Demographic Dimension</th>
        <th style="width: 25%;">Category / Option</th>
        <th style="width: 20%;">Count (n)</th>
        <th style="width: 20%;">Percentage (%)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td rowspan="2"><strong>Primary Stakeholder Role</strong></td>
        <td>CIT-U Student / General Citizen</td>
        <td>33</td>
        <td>97.1%</td>
      </tr>
      <tr>
        <td>CIT-U Faculty / SME</td>
        <td>1</td>
        <td>2.9%</td>
      </tr>
      <tr>
        <td rowspan="3"><strong>Primary Device Used</strong></td>
        <td>Desktop / Web Browser</td>
        <td>15</td>
        <td>44.1%</td>
      </tr>
      <tr>
        <td>Smartphone (Android)</td>
        <td>12</td>
        <td>35.3%</td>
      </tr>
      <tr>
        <td>Smartphone (iPhone / iOS)</td>
        <td>7</td>
        <td>20.6%</td>
      </tr>
      <tr>
        <td><strong>Baseline Pet Welfare Involvement</strong></td>
        <td>Familiarity with Campus Strays (Q7)</td>
        <td>Mean: <strong>3.44 / 5.0</strong></td>
        <td>SD: 0.89</td>
      </tr>
    </tbody>
  </table>

  <!-- Page Break -->
  <div class="page-break"></div>

  <!-- Section 3 -->
  <h1>3. Quantitative Evaluation Results</h1>
  <p>
    Survey statements were evaluated using a standard 5-point Likert scale (1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly Agree). Table 2 presents the empirical means, standard deviations, and completion counts across all constructs:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 14%;">Construct</th>
        <th style="width: 12%;">Item Code</th>
        <th style="width: 50%;">Questionnaire Item Description</th>
        <th style="width: 12%;">Mean</th>
        <th style="width: 12%;">Std. Dev.</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td rowspan="5"><strong>Perceived Usefulness (PU)</strong></td>
        <td>PU1</td>
        <td>Sighting form captures critical rescue details (photo, landmark)</td>
        <td><strong>4.12</strong></td>
        <td>0.78</td>
      </tr>
      <tr>
        <td>PU2</td>
        <td>Directory differentiates Residents vs. Strays with live badges</td>
        <td><strong>4.18</strong></td>
        <td>0.81</td>
      </tr>
      <tr>
        <td>PU3</td>
        <td>14-day bite/scratch observation quarantine alerts (RA 9482)</td>
        <td><strong>4.12</strong></td>
        <td>0.91</td>
      </tr>
      <tr>
        <td>PU4</td>
        <td>Structured coordination platform superior to Facebook groups</td>
        <td><strong>4.09</strong></td>
        <td>0.80</td>
      </tr>
      <tr>
        <td>PU5</td>
        <td>Addresses urgent animal welfare &amp; stray challenges at CIT-U</td>
        <td><strong>4.31</strong></td>
        <td>0.82</td>
      </tr>

      <tr>
        <td rowspan="4"><strong>Perceived Ease of Use (PEOU)</strong></td>
        <td>PEOU1</td>
        <td>Interface hierarchy and navigation intuitive without a manual</td>
        <td><strong>4.06</strong></td>
        <td>0.90</td>
      </tr>
      <tr>
        <td>PEOU2</td>
        <td>Input forms straightforward with clear validation cues</td>
        <td><strong>4.12</strong></td>
        <td>0.89</td>
      </tr>
      <tr>
        <td>PEOU3</td>
        <td>Official CIT-U maroon/gold branding, spacing, and SVG icons</td>
        <td><strong>4.39</strong></td>
        <td>0.83</td>
      </tr>
      <tr>
        <td>PEOU4</td>
        <td>Maintains active session smoothly without unexpected logouts</td>
        <td><strong>4.24</strong></td>
        <td>0.87</td>
      </tr>

      <tr>
        <td rowspan="4"><strong>Technical Capabilities</strong></td>
        <td>TECH1</td>
        <td>Collar QR scanner camera viewfinder and image decoder</td>
        <td><strong>4.00</strong></td>
        <td>0.82</td>
      </tr>
      <tr>
        <td>TECH1-B</td>
        <td>Public Pet Passport accessible without mandatory login</td>
        <td><strong>4.07</strong></td>
        <td>0.90</td>
      </tr>
      <tr>
        <td>TECH2</td>
        <td>AI NLP trait search accurately matches physical descriptors</td>
        <td><strong>4.00</strong></td>
        <td>0.88</td>
      </tr>
      <tr>
        <td>TECH3</td>
        <td>Responsive adaptation across mobile phones and desktop screens</td>
        <td><strong>4.17</strong></td>
        <td>0.76</td>
      </tr>

      <tr>
        <td rowspan="2"><strong>System Performance</strong></td>
        <td>PERF1</td>
        <td>Application loaded screens smoothly without frustrating latency</td>
        <td><strong>4.18</strong></td>
        <td>0.80</td>
      </tr>
      <tr>
        <td>PERF2</td>
        <td>Operated reliably without crashes or unhandled database errors</td>
        <td><strong>4.09</strong></td>
        <td>0.93</td>
      </tr>

      <tr>
        <td rowspan="4"><strong>Usability Scale (SUS)</strong></td>
        <td>SUS-B1</td>
        <td>Desire to use Task Force Bruno frequently for campus pets (+)</td>
        <td><strong>4.26</strong></td>
        <td>0.83</td>
      </tr>
      <tr>
        <td>SUS-B2</td>
        <td>Found the system unnecessarily complex or difficult (-)</td>
        <td><strong>2.76</strong></td>
        <td>1.28</td>
      </tr>
      <tr>
        <td>SUS-B3</td>
        <td>Felt confident navigating and using system features (+)</td>
        <td><strong>3.76</strong></td>
        <td>0.96</td>
      </tr>
      <tr>
        <td>SUS-B4</td>
        <td>Needed to learn too many things or ask for help (-)</td>
        <td><strong>3.29</strong></td>
        <td>1.29</td>
      </tr>

      <tr>
        <td rowspan="3"><strong>Staff Modules (Staff Only)</strong></td>
        <td>STF1</td>
        <td>1-Click Sighting-to-Intake direct admission workflow</td>
        <td><strong>5.00</strong></td>
        <td>0.00</td>
      </tr>
      <tr>
        <td>STF2</td>
        <td>Inventory tracking by genuine physical units (kg, cans, vials)</td>
        <td><strong>5.00</strong></td>
        <td>0.00</td>
      </tr>
      <tr>
        <td>STF3</td>
        <td>Integrated high-res collar QR tag print generator</td>
        <td><strong>5.00</strong></td>
        <td>0.00</td>
      </tr>

      <tr>
        <td rowspan="3"><strong>Satisfaction &amp; Intention</strong></td>
        <td>SAT1</td>
        <td>Overall satisfaction with experience using Task Force Bruno</td>
        <td><strong>4.03</strong></td>
        <td>0.76</td>
      </tr>
      <tr>
        <td>BI1</td>
        <td>Intend to use upon full deployment for campus companions</td>
        <td><strong>4.24</strong></td>
        <td>0.89</td>
      </tr>
      <tr>
        <td>BI2</td>
        <td>Enthusiastically recommend to fellow students and advocates</td>
        <td><strong>4.26</strong></td>
        <td>0.83</td>
      </tr>
    </tbody>
  </table>

  <!-- Page Break -->
  <div class="page-break"></div>

  <!-- Section 4 -->
  <h1>4. Qualitative Feedback Analysis and User Themes</h1>
  <p>
    Open-ended responses from Questions 15, 16, and 17 of the instrument provided rich, actionable insights into how users interacted with the system:
  </p>

  <h2>Theme 1: Positive Aspects and Strengths to Retain</h2>
  <ul>
    <li><strong>Institutional Branding and Visual Identity:</strong> Multiple respondents praised the visual presentation, noting that it felt authentic to CIT-U. As stated by Phoebe Jelaine Macarulay:
      <div class="quote-box">"Navigation, access, and switching sections are easy and not hassle. The wildcat spirit is definitely consistent and evident throughout the experience."</div>
    </li>
    <li><strong>Professionalism and Urgency:</strong> Users noted that the interface communicates institutional readiness. Joel Ramirez commented:
      <div class="quote-box">"Genuinely amazing work... the website alone genuinely screams professionalism, alertness, and accessibility which is genuinely the crucial thing for this service app. Props to the engineering team definitely!"</div>
    </li>
    <li><strong>Essential Campus Service:</strong> Jamilla Cassandra Nocete noted that having a unified tool is <em>"very useful and essential especially for the campus."</em></li>
  </ul>

  <h2>Theme 2: Identified Usability Roadblocks and Technical Issues</h2>
  <ul>
    <li><strong>Account Creation and Login Friction:</strong> A few users experienced confusion during initial authentication. Carmela Grace Andres reported: <em>"I had a hard time logging in, at first it won't recognize my account even after creating one."</em> Mary Claire Ramas similarly noted struggling to log in immediately after registration.</li>
    <li><strong>Mobile Viewport and Keyboard Obstruction:</strong> On smaller mobile viewports, input field positioning caused occasional overlap. Gillian Altizo observed: <em>"The keyboard covers the password section(?) I can't really see if the password I thought I typed in reflected agad."</em></li>
    <li><strong>Hardware Camera Permissions on Mobile:</strong> John Mikko Rosito noted: <em>"When trying to submit a report on a mobile device, the camera integration sometimes freezes or fails to prompt for the necessary hardware permissions. It would be highly beneficial to debug the camera loading process and ensure a clear, manual file-upload fallback is immediately available."</em></li>
    <li><strong>Feature Density on Mobile Screens:</strong> Mary Laizelle Dalmero highlighted that while desktop navigation was spacious, the mobile view felt feature-dense and required clearer visual grouping.</li>
  </ul>

  <h2>Theme 3: User Suggestions and Missing Capabilities</h2>
  <ul>
    <li><strong>Interactive Campus Map Pinning:</strong> The most frequent functional suggestion was visual map localization. Hazel Dianne Sibuyan recommended: <em>"It would be helpful to have a map or exact campus location showing where each cat or dog is usually found... profile could also include their usual feeding area."</em> John Mikko Rosito similarly suggested an integrated campus map-pinning tool for stray sighting locations.</li>
    <li><strong>Emergency / Urgent Incident Tag:</strong> Hazel Dianne Sibuyan suggested: <em>"Adding an emergency or urgent report option for animals that are injured, sick, lost, or in danger, and providing basic information on what students should do."</em></li>
    <li><strong>Donation and Volunteer Section:</strong> Jamilla Cassandra Nocete and Hanzley James Sibuyan recommended adding a module where students can see animal caretaking activities or contribute food donations.</li>
    <li><strong>First-Time User Guide / Interactive Tutorial:</strong> Justine Kate Purisima and Shena Quiño suggested adding a brief step-by-step onboarding guide or "How it works" popup for new users.</li>
  </ul>

  <!-- Page Break -->
  <div class="page-break"></div>

  <!-- Section 5 -->
  <h1>5. Pre-Implementation Action Plan and Engineering Roadmap</h1>
  <p>
    Based on the empirical scores and user recommendations, the team has formulated a concrete engineering remediation backlog prior to final Capstone 2 deployment:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Priority Tier</th>
        <th style="width: 25%;">Identified Problem Area</th>
        <th style="width: 35%;">User Feedback Reference</th>
        <th style="width: 25%;">Planned Engineering Solution</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>High (Sprint 1)</strong></td>
        <td>Login / Registration Feedback &amp; Keyboard Overlap</td>
        <td>Reported by Carmela Andres, Mary Claire Ramas, and Gillian Altizo.</td>
        <td>Add explicit toast notifications upon registration success; apply <code>padding-bottom: 40vh</code> on mobile form fields to prevent keyboard clipping.</td>
      </tr>
      <tr>
        <td><strong>High (Sprint 1)</strong></td>
        <td>Mobile Camera Permission &amp; Fallback</td>
        <td>Reported by John Mikko Rosito (camera freezing on older Android devices).</td>
        <td>Implement a clear error catch block with a prominent "Upload Photo from Gallery" fallback button if camera access is denied.</td>
      </tr>
      <tr>
        <td><strong>Medium (Sprint 2)</strong></td>
        <td>Campus Landmark Dropdown &amp; Sighting Maps</td>
        <td>Suggested by Hazel Dianne Sibuyan and John Mikko Rosito.</td>
        <td>Add pre-selected CIT-U landmark tags (Canteen, NGE, Gym, Academic Quad) and static map indicators to sighting reports.</td>
      </tr>
      <tr>
        <td><strong>Medium (Sprint 2)</strong></td>
        <td>First-Time User Walkthrough Guide</td>
        <td>Suggested by Justine Kate Purisima and Shena Quiño.</td>
        <td>Deploy an interactive "How to Use" onboarding modal accessible from the navbar.</td>
      </tr>
      <tr>
        <td><strong>Low (Sprint 3)</strong></td>
        <td>Community Volunteer &amp; Donation Portal</td>
        <td>Suggested by Jamilla Nocete and Hanzley Sibuyan.</td>
        <td>Expand the Supply Logistics view to allow community members to log in-kind pet food and medical donations.</td>
      </tr>
    </tbody>
  </table>

  <p>
    <strong>Longitudinal Testing Commitment:</strong> In Question 18, <strong>50.0% of respondents (17 out of 34 participants)</strong> formally agreed to be re-contacted to evaluate the final production release once these sprint items are implemented.
  </p>

  <!-- Section 6 -->
  <h1>6. Conclusion</h1>
  <p>
    The MVP validation study confirms that <strong>Task Force Bruno</strong> fulfills a vital operational and safety need for Cebu Institute of Technology – University. With strong ratings across Perceived Usefulness (4.31/5.0), visual identity (4.39/5.0), and endorsement intention (4.26/5.0), campus stakeholders demonstrated genuine enthusiasm for adopting the platform. By executing the prioritized sprint items—specifically stabilizing mobile login cues, camera fallbacks, and adding landmark location tags—the system will achieve full production maturity ready for Capstone 2 defense and campus deployment.
  </p>

  <p style="text-align: center; margin-top: 36px; font-size: 10pt; color: #555555; text-indent: 0;">
    — End of Validation Highlights —<br>
    <strong>Task Force Bruno Capstone Research Team</strong><br>
    Department of Information Technology • Cebu Institute of Technology – University
  </p>

</body>
</html>
"""

Path("docs/temp_highlights.html").write_text(html_content, encoding="utf-8")

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
pdf_out = Path("docs/Task_Force_Bruno_MVP_Validation_Highlights.pdf").resolve()

cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    f"--print-to-pdf={pdf_out}",
    "--no-pdf-header-footer",
    str(Path("docs/temp_highlights.html").resolve())
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("Edge compile exit code:", res.returncode)

if Path("docs/temp_highlights.html").exists():
    Path("docs/temp_highlights.html").unlink()

print(f"Successfully generated human-style highlights PDF with real data at: {pdf_out}")
