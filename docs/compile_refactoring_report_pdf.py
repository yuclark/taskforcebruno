import os
import subprocess
from pathlib import Path

# Task Force Bruno - MVP Validation Findings & Refactoring Specification PDF Compiler
# Refactored for clean academic pagination without orphaned headings or broken tables

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Task Force Bruno - MVP Validation Findings and Refactoring Specification</title>
<style>
  @page {
    size: letter portrait;
    margin: 0.75in 0.8in 0.75in 0.8in;
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    color: #111111;
    line-height: 1.35;
    font-size: 10.5pt;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }

  /* Academic Title Block */
  .title-block {
    text-align: center;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 2px solid #800000; /* CIT-U Maroon */
  }

  .inst-name {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #800000;
    margin-bottom: 2px;
  }

  .dept-name {
    font-size: 10pt;
    color: #333333;
    margin-bottom: 10px;
  }

  .paper-title {
    font-size: 15pt;
    font-weight: bold;
    margin-bottom: 4px;
    text-transform: uppercase;
    color: #111111;
  }

  .paper-subtitle {
    font-size: 10.5pt;
    font-style: italic;
    color: #444444;
    margin-bottom: 10px;
  }

  .meta-table {
    width: 100%;
    margin: 6px 0 0 0;
    font-size: 9.5pt;
    border: none;
  }

  .meta-table td {
    border: none;
    padding: 2px 4px;
  }

  /* Standard Headings */
  h1 {
    font-size: 12pt;
    font-weight: bold;
    color: #800000;
    text-transform: uppercase;
    margin-top: 18px;
    margin-bottom: 6px;
    border-bottom: 1px solid #800000;
    padding-bottom: 2px;
    page-break-after: avoid;
    break-after: avoid;
  }

  h2 {
    font-size: 11pt;
    font-weight: bold;
    color: #111111;
    margin-top: 14px;
    margin-bottom: 4px;
    page-break-after: avoid;
    break-after: avoid;
  }

  h3 {
    font-size: 10.5pt;
    font-weight: bold;
    font-style: italic;
    color: #2b2b2b;
    margin-top: 10px;
    margin-bottom: 3px;
    page-break-after: avoid;
    break-after: avoid;
  }

  p {
    margin: 0 0 6px 0;
    text-align: justify;
    text-indent: 0.22in;
  }

  p.no-indent {
    text-indent: 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 12px 0;
    font-size: 9pt;
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  th, td {
    border: 1px solid #555555;
    padding: 5px 6px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background-color: #f7f1ea; /* Subtle warm maroon-tinted cream */
    color: #000000;
    font-weight: bold;
    font-size: 9.5pt;
  }

  ul, ol {
    margin: 3px 0 6px 0;
    padding-left: 22px;
    font-size: 10pt;
  }

  li {
    margin-bottom: 3px;
    text-align: justify;
  }

  .quote-box {
    border-left: 3px solid #800000;
    background-color: #faf8f6;
    padding: 6px 10px;
    margin: 6px 0 8px 0;
    font-style: italic;
    font-size: 9.5pt;
    color: #222222;
  }

  .callout-box {
    border: 1px solid #d0c0b0;
    background-color: #fdfaf7;
    padding: 8px 12px;
    margin: 8px 0;
    border-radius: 2px;
    page-break-inside: avoid;
  }

  .badge {
    display: inline-block;
    padding: 1px 5px;
    font-size: 8pt;
    font-weight: bold;
    border-radius: 3px;
    background-color: #eaeaea;
  }

  .section-break {
    page-break-before: always;
    break-before: page;
  }

  .question-heading {
    font-size: 10pt;
    font-weight: bold;
    color: #600000;
    margin-top: 6px;
    margin-bottom: 2px;
    page-break-after: avoid;
    break-after: avoid;
  }
</style>
</head>
<body>

  <!-- Academic Title Block -->
  <div class="title-block">
    <div class="inst-name">Cebu Institute of Technology – University</div>
    <div class="dept-name">College of Computer Studies • Department of Information Technology<br>IT332 – Capstone Project 2: Systems Development &amp; Research Validation</div>
    <div class="paper-title">MVP Validation Findings &amp; System Refactoring Specification</div>
    <div class="paper-subtitle">Establishing the Empirical Bridge Between MVP Testing Results, Stakeholder Evidence, and Architectural Refactoring</div>
    
    <table class="meta-table">
      <tr>
        <td style="width: 52%;"><strong>Project:</strong> Task Force Bruno (Campus Pet Management Portal)</td>
        <td style="width: 48%; text-align: right;"><strong>Team:</strong> Team 18 (Task Force Bruno)</td>
      </tr>
      <tr>
        <td><strong>Evaluation Sample:</strong> N = 34 Validated Stakeholders (CIT-U Students &amp; Faculty SME)</td>
        <td style="text-align: right;"><strong>Submission Deadline:</strong> October 10, 2026 | 11:59 PM</td>
      </tr>
      <tr>
        <td><strong>Validation Frameworks:</strong> TAM (Davis), ISO 9241-11, SUS &amp; RA 9482 Compliance</td>
        <td style="text-align: right;"><strong>Milestone:</strong> Pre-Implementation Refactoring Specification</td>
      </tr>
    </table>
  </div>

  <!-- Executive Summary -->
  <h1>1. Executive Summary &amp; Research Context</h1>
  <p>
    This submission establishes a direct, empirically grounded connection between the Minimum Viable Product (MVP) validation findings and the targeted architectural refactoring required for <strong>Task Force Bruno: Integrated Campus Pet Management System</strong> at <strong>Cebu Institute of Technology – University (CIT-U)</strong>. Following the rigorous field testing period conducted between September 9 and September 13, 2026, quantitative and qualitative evidence was synthesized from <strong>N = 34 validated campus stakeholders</strong> (33 student field observers and 1 faculty subject matter expert). The validation protocol benchmarked the platform across the Technology Acceptance Model (TAM), ISO 9241-11 ergonomics, the 4-item System Usability Scale (Brooke, 1996), and Philippine Republic Act No. 9482 (Anti-Rabies Act of 2007).
  </p>
  <p>
    The validation confirmed strong baseline operational utility (Perceived Usefulness mean <strong>4.31 / 5.0</strong>), vibrant visual branding acceptance (<strong>4.39 / 5.0</strong>), high institutional endorsement intention (<strong>4.26 / 5.0</strong>), and unanimous staff workflow approval (<strong>5.00 / 5.0</strong> across all administrative modules). However, empirical analysis also surfaced critical usability roadblocks, cognitive friction points, and hardware constraints. Notably, the composite System Usability Scale benchmark averaged <strong>62.32 / 100</strong> (Grade D), falling short of the standard acceptability threshold (68–70). Stakeholder feedback revealed specific bottlenecks in mobile viewport layout, hardware camera WebRTC lifecycle management, sighting telemetry precision, and initial user onboarding. In accordance with the Capstone 2 mandate, this document identifies five primary refactoring areas, detailing for each: the empirical learnings, supporting stakeholder evidence, affected SMART objectives, specific requirements/design improvements, and projected quantitative impacts.
  </p>

  <!-- Summary Quantitative Baseline Table -->
  <h2 class="no-indent">Table 1. MVP Validation Quantitative Empirical Baseline (N = 34)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 16%;">Evaluation Dimension</th>
        <th style="width: 10%;">Code</th>
        <th style="width: 48%;">Instrument Construct &amp; Evaluation Focus</th>
        <th style="width: 12%;">Mean (SD)</th>
        <th style="width: 14%;">Benchmark Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Perceived Usefulness</strong></td>
        <td>PU5</td>
        <td>Overall platform capacity to resolve campus pet welfare &amp; strays</td>
        <td><strong>4.31</strong> (0.82)</td>
        <td><span class="badge" style="background-color:#d4edda;color:#155724;">Surpassed (≥ 4.0)</span></td>
      </tr>
      <tr>
        <td><strong>Visual Identity</strong></td>
        <td>PEOU3</td>
        <td>Official CIT-U maroon &amp; gold branding, typography &amp; SVG iconography</td>
        <td><strong>4.39</strong> (0.83)</td>
        <td><span class="badge" style="background-color:#d4edda;color:#155724;">Surpassed (≥ 4.0)</span></td>
      </tr>
      <tr>
        <td><strong>Biosecurity</strong></td>
        <td>PU3</td>
        <td>Prominent 14-day bite/scratch observation quarantine alerts (RA 9482)</td>
        <td><strong>4.12</strong> (0.91)</td>
        <td><span class="badge" style="background-color:#fff3cd;color:#856404;">Near Target (≥ 4.2)</span></td>
      </tr>
      <tr>
        <td><strong>Hardware Scanning</strong></td>
        <td>TECH1</td>
        <td>Collar QR scanner camera viewfinder &amp; image matrix decoder</td>
        <td><strong>4.00</strong> (0.82)</td>
        <td><span class="badge" style="background-color:#fff3cd;color:#856404;">Threshold Met (4.0)</span></td>
      </tr>
      <tr>
        <td><strong>Usability Benchmark</strong></td>
        <td>SUS-B1</td>
        <td>Stakeholder willingness to use Task Force Bruno frequently (+)</td>
        <td><strong>4.26</strong> (0.83)</td>
        <td><span class="badge" style="background-color:#d4edda;color:#155724;">High Intent (≥ 4.0)</span></td>
      </tr>
      <tr>
        <td><strong>Perceived Complexity</strong></td>
        <td>SUS-B2</td>
        <td>System perceived as unnecessarily complex or difficult (-)</td>
        <td><strong>2.76</strong> (1.28)</td>
        <td><span class="badge" style="background-color:#f8d7da;color:#721c24;">Refactor Needed (≤ 2.0)</span></td>
      </tr>
      <tr>
        <td><strong>Learnability Friction</strong></td>
        <td>SUS-B4</td>
        <td>Need to learn too many things / ask for help before effective use (-)</td>
        <td><strong>3.29</strong> (1.29)</td>
        <td><span class="badge" style="background-color:#f8d7da;color:#721c24;">Critical Roadblock (≤ 2.0)</span></td>
      </tr>
      <tr>
        <td><strong>Composite Usability</strong></td>
        <td>SUS Total</td>
        <td>Standardized 4-Item System Usability Scale Composite Score</td>
        <td><strong>62.32</strong> / 100</td>
        <td><span class="badge" style="background-color:#f8d7da;color:#721c24;">Grade D (Target ≥ 80.0)</span></td>
      </tr>
      <tr>
        <td><strong>Clinic Administration</strong></td>
        <td>STF1–STF3</td>
        <td>1-Click Intake, Physical Units (kg, cans, vials), QR Tag Generator</td>
        <td><strong>5.00</strong> (0.00)</td>
        <td><span class="badge" style="background-color:#d4edda;color:#155724;">Optimal (5.0 / 5.0)</span></td>
      </tr>
      <tr>
        <td><strong>Adoption Intention</strong></td>
        <td>BI1 / BI2</td>
        <td>Active deployment usage intention &amp; peer recommendation</td>
        <td><strong>4.24 / 4.26</strong></td>
        <td><span class="badge" style="background-color:#d4edda;color:#155724;">Surpassed (≥ 4.0)</span></td>
      </tr>
    </tbody>
  </table>

  <!-- Section 2: Detailed Refactoring Focus Areas -->
  <h1>2. Potential Areas for Refactoring (Detailed Analysis)</h1>
  <p class="no-indent">
    To systematically address the feedback and guarantee rigorous academic traceability, the five core questions mandated for this submission are answered comprehensively within each of the five identified refactoring areas:
  </p>

  <!-- REFACTORING AREA 1 -->
  <h2>Refactoring Area 1: Institutional Authentication State Synchronization &amp; Mobile Viewport Input Ergonomics</h2>
  <p class="no-indent" style="font-size: 9.5pt; color: #555555; margin-bottom: 4px;">
    <strong>Affected Subsystems:</strong> <code>frontend/src/components/LoginForm.jsx</code>, <code>RegisterUserView.jsx</code>, Backend JWT Middleware (<code>wsapi/views.py</code>)
  </p>

  <div class="question-heading">1. What did you learn from the MVP validation?</div>
  <p>
    During the initial user interaction phase, multiple evaluators experienced cognitive disorientation and functional blockages during account creation and subsequent sign-in. The MVP architecture treated registration and login as two entirely detached HTTP request lifecycles without synchronized client-side token caching. Upon completing registration, users were left on an ambiguous state without clear visual confirmation or automatic token handoff, causing them to believe the system failed to persist their account. Furthermore, testing across mobile hardware (which represented 55.9% of our evaluation sample: 35.3% Android, 20.6% iOS) revealed severe viewport ergonomics issues: on virtual keyboard activation, the software keyboard obstructed password input fields and submission action buttons, leaving users unable to visually verify their keystrokes or submit the form without awkward manual viewport scrolling.
  </p>

  <div class="question-heading">2. What stakeholder feedback or evidence supports the finding?</div>
  <p>
    Empirical quantitative data and qualitative bug reports directly substantiate this friction:
  </p>
  <ul>
    <li><strong>Quantitative Evidence:</strong> The SUS-B4 learnability roadblock scored <strong>3.29 / 5.0 (SD = 1.29)</strong>, while Perceived Ease of Use form efficiency (PEOU2) registered <strong>4.12 / 5.0</strong>, pulled down by onboarding complaints.</li>
    <li><strong>Stakeholder Testimonial (Carmela Grace Andres):</strong> <em>"I had a hard time logging in, at first it won't recognize my account even after creating one."</em></li>
    <li><strong>Stakeholder Testimonial (Mary Claire Ramas):</strong> <em>"Struggling to log in despite of correct credentials."</em></li>
    <li><strong>Stakeholder Testimonial (Gillian Altizo):</strong> <em>"The keyboard covers the password section(?) I can't really see if the password I thought I typed in reflected agad."</em></li>
  </ul>

  <div class="question-heading">3. Which SMART objective or measurable outcome is affected?</div>
  <p>
    This roadblock directly threatens <strong>SMART Objective 5: High Usability &amp; Sustained Campus Adoption</strong> (achieve high learnability, low cognitive load, and strong institutional adoption intent) and compromises <strong>SMART Objective 1: Rapid Collar Identification &amp; Public Passport</strong>.
  </p>
  <ul>
    <li><strong>Measurable Outcome Affected:</strong> Composite System Usability Scale (SUS) score (currently <strong>62.32 / 100</strong>; Target: <strong>≥ 80.0 / 100</strong>); First-Attempt Authentication Success Rate (Baseline: <strong>~79.4%</strong>; Target: <strong>≥ 98.0%</strong>); and Mean Onboarding Duration (Baseline: <strong>&gt; 95 seconds</strong>; Target: <strong>≤ 20 seconds</strong>).</li>
  </ul>

  <div class="question-heading">4. What aspect of the requirements or design should be improved?</div>
  <p>
    The software requirements and architectural design must be refactored across SRS Module 4.2 (Institutional Authentication &amp; RBAC) and SDD Section 4:
  </p>
  <ul>
    <li><strong>Frontend Viewport Ergonomics:</strong> Implement dynamic viewport units (<code>100dvh</code>) and attach <code>scrollIntoView({ behavior: 'smooth', block: 'center' })</code> event listeners to input field focus events. Add an interactive password visibility toggle (eye icon) to eliminate blind typing errors.</li>
    <li><strong>Token Handoff State Machine:</strong> Refactor <code>RegisterUserView</code> to immediately return an authenticated JWT payload upon successful institutional registration (enforcing <code>@cit.edu</code> and <code>XX-XXXX-XXX</code> ID syntax), automatically persisting the session into <code>localStorage</code> and smoothly transitioning the user into the main dashboard without requiring a redundant secondary login step.</li>
    <li><strong>Visual Feedback &amp; Toast Cues:</strong> Introduce clear, non-intrusive animated feedback banners confirming registration success and active session establishment.</li>
  </ul>

  <div class="question-heading">5. How is the proposed change expected to improve the measurable outcome?</div>
  <p>
    By establishing seamless registration-to-session handoff and preventing mobile keyboard occlusion, user drop-off during onboarding will be virtually eliminated. Users will transition into the application in under 20 seconds. This refactoring directly attacks the negative sentiment reflected in SUS-B4 (reducing learnability friction from 3.29 to &lt; 1.8) and SUS-B2 (lowering perceived complexity from 2.76 to &lt; 1.8), projecting a substantial uplift in the composite SUS score toward the target <strong>≥ 80.0</strong> benchmark.
  </p>

  <!-- REFACTORING AREA 2 -->
  <h2>Refactoring Area 2: Hardware Camera Viewfinder Lifecycle, Permission Handling &amp; Graceful File Fallback</h2>
  <p class="no-indent" style="font-size: 9.5pt; color: #555555; margin-bottom: 4px;">
    <strong>Affected Subsystems:</strong> <code>frontend/src/components/CollarQRScanner.jsx</code>, <code>ReportSightingView.jsx</code>, WebRTC MediaStream Pipeline
  </p>

  <div class="question-heading">1. What did you learn from the MVP validation?</div>
  <p>
    Field evaluation revealed that relying strictly on the client browser's live WebRTC hardware camera stream (<code>navigator.mediaDevices.getUserMedia</code>) introduces high failure vulnerability across heterogeneous student smartphones. When users denied camera permissions, possessed older Android OS builds, or operated browsers with restrictive permission policies, the camera viewfinder froze on a black screen or crashed the scanning component without raising an actionable error message. Furthermore, evaluators operating in low-light campus zones (e.g., poorly lit academic corridors or evening grounds) struggled to achieve camera focus on physical collar tags, highlighting the critical architectural requirement for an immediate, one-click manual image upload fallback that decodes QR matrices client-side.
  </p>

  <div class="question-heading">2. What stakeholder feedback or evidence supports the finding?</div>
  <p>
    While the QR decoding algorithm itself scored reasonably well among those with compatible devices (TECH1 mean <strong>4.00 / 5.0</strong>), hardware edge cases generated explicit failure logs:
  </p>
  <ul>
    <li><strong>Quantitative Evidence:</strong> Smartphone testing comprised <strong>55.9% of all sessions</strong> (12 Android, 7 iOS devices). Camera performance had the highest variance among technical metrics (SD = 0.82), with 14.7% of users experiencing camera initialization delays exceeding 15 seconds.</li>
    <li><strong>Stakeholder Testimonial (John Mikko Rosito):</strong> <em>"When trying to submit a report on a mobile device, the camera integration sometimes freezes or fails to prompt for the necessary hardware permissions. It would be highly beneficial to debug the camera loading process and ensure a clear, manual file-upload fallback is immediately available if the live feed fails."</em></li>
    <li><strong>Stakeholder Testimonial (Cohort Tester):</strong> <em>"Some screens could be more intuitive... camera-related features could benefit from clearer instructions and loading indicators."</em></li>
  </ul>

  <div class="question-heading">3. Which SMART objective or measurable outcome is affected?</div>
  <p>
    This finding directly impacts <strong>SMART Objective 1: Rapid Collar Identification &amp; Public Passport</strong> (enable rapid lookup of animal identity, vaccination status, and emergency contacts via QR scanner and AI search without mandatory login).
  </p>
  <ul>
    <li><strong>Measurable Outcome Affected:</strong> Emergency QR Lookup Resolution Time (Target: <strong>≤ 25 seconds</strong> from discovery to profile display; Failure cases during MVP exceeded <strong>60 seconds</strong> due to viewfinder freeze); Hardware Scanning Satisfaction (TECH1 Baseline: <strong>4.00 / 5.0</strong>; Target: <strong>≥ 4.30 / 5.0</strong>); and Camera Decoding Success Rate (Baseline: <strong>85.3%</strong>; Target: <strong>100.0%</strong> through dual-path capture).</li>
  </ul>

  <div class="question-heading">4. What aspect of the requirements or design should be improved?</div>
  <p>
    The system design must be refactored in SRS Module 1.1 / SDD Component <code>CollarQRScanner.jsx</code> as follows:
  </p>
  <ul>
    <li><strong>Asynchronous Permission Catch Blocks:</strong> Wrap <code>getUserMedia</code> in robust try-catch-finally handlers that intercept <code>NotAllowedError</code>, <code>NotFoundError</code>, and <code>NotReadableError</code>, translating technical exceptions into plain-language instructions (e.g., "Camera access blocked. Please enable camera permissions in your browser bar or use the upload button below").</li>
    <li><strong>Dual-Track Fallback Architecture:</strong> Embed an accessible, high-contrast file input button (<em>"Upload QR Photo from Gallery / Filesystem"</em>) directly adjacent to the viewfinder. Utilize client-side HTML5 canvas image decoding (<code>jsQR</code>) to process uploaded image files instantly without server roundtrip latency.</li>
    <li><strong>Camera Stream Lifecycle Teardown:</strong> Ensure all active video tracks (<code>track.stop()</code>) are strictly terminated on component unmount to prevent memory leaks and background camera hardware lockouts.</li>
  </ul>

  <div class="question-heading">5. How is the proposed change expected to improve the measurable outcome?</div>
  <p>
    Providing a guaranteed secondary path via static image upload guarantees a <strong>100% task completion rate</strong> for animal identification, even on smartphones with defective cameras, denied permissions, or broken WebRTC drivers. Eliminating viewfinder freezes ensures lookup resolution strictly adheres to the <strong>≤ 25-second</strong> SMART benchmark, elevating TECH1 from 4.00 to ≥ 4.40.
  </p>

  <!-- REFACTORING AREA 3 -->
  <h2>Refactoring Area 3: Landmark-Assisted Sighting Telemetry, Emergency Sentinel &amp; 1-Click Intake</h2>
  <p class="no-indent" style="font-size: 9.5pt; color: #555555; margin-bottom: 4px;">
    <strong>Affected Subsystems:</strong> <code>frontend/src/components/ReportSightingView.jsx</code>, <code>AddNewPet.jsx</code>, <code>backend/wsapi/views.py</code> (Sighting &amp; Intake Endpoints)
  </p>

  <div class="question-heading">1. What did you learn from the MVP validation?</div>
  <p>
    The MVP sighting module relied on an unconstrained, open-ended plain text field for location reporting. Field testing revealed that students inputted vague or ambiguous descriptions (such as "near the benches" or "outside the classroom"), severely hindering student rescuers and clinic staff from locating strays in CIT-U's expansive multi-building campus. Furthermore, evaluators identified a critical functional void regarding incident urgency: students encountering injured animals, aggressive strays, or potential bite risks had no mechanism to flag reports as high-priority emergencies, nor did the system provide clear guidance on immediate campus safety protocols under Republic Act No. 9482. Finally, while staff evaluators praised the 1-click intake concept (STF1: 5.0/5.0), the handoff between reported sightings and the official pet registry required tighter architectural decoupling.
  </p>

  <div class="question-heading">2. What stakeholder feedback or evidence supports the finding?</div>
  <p>
    Multiple independent campus stakeholders highlighted the necessity for structured landmark telemetry and urgent incident triage:
  </p>
  <ul>
    <li><strong>Quantitative Evidence:</strong> PU1 (Sighting Reporting Completeness) scored <strong>4.12 / 5.0 (SD = 0.78)</strong>, and PU3 (Campus Biosecurity &amp; Quarantine) scored <strong>4.12 / 5.0 (SD = 0.91)</strong>, falling slightly below our 4.20 capstone target.</li>
    <li><strong>Stakeholder Testimonial (Hazel Dianne Sibuyan):</strong> <em>"It would be helpful to have a map or exact campus location showing where each cat or dog is usually found... I recommend adding an emergency or urgent report option for animals that are injured, sick, lost, or in danger. The website could also provide basic information on what students should do."</em></li>
    <li><strong>Stakeholder Testimonial (John Mikko Rosito):</strong> <em>"The reporting form lacks a precise, interactive map-pinning tool for indicating exact incident locations on campus. Implementing an integrated geolocation feature with an adjustable map pin would drastically improve a rescuer's ability to respond quickly."</em></li>
    <li><strong>Stakeholder Testimonial (Cohort Tester):</strong> <em>"It would be helpful to add more detailed location information, status filters, priority levels, timestamps, and a clear way to track the progress of reported incidents."</em></li>
  </ul>

  <div class="question-heading">3. Which SMART objective or measurable outcome is affected?</div>
  <p>
    This directly impacts <strong>SMART Objective 2: Structured Sighting Triage &amp; Intake</strong> (digitize 100% of campus animal sightings with photos and landmarks, enabling 1-click administrative intake into the pet registry) and <strong>SMART Objective 3: Campus Biosecurity &amp; Quarantine Telemetry</strong>.
  </p>
  <ul>
    <li><strong>Measurable Outcome Affected:</strong> Sighting-to-Rescue Response Latency (Baseline: <strong>&gt; 45 minutes</strong> due to ambiguous search zones; Target: <strong>≤ 10 minutes</strong> via landmark clustering); Administrative Data Entry Redundancy (Target: <strong>0 manual re-typed fields</strong> during stray intake); and Sighting Completeness Rating (PU1 Baseline: <strong>4.12</strong>; Target: <strong>≥ 4.50 / 5.0</strong>).</li>
  </ul>

  <div class="question-heading">4. What aspect of the requirements or design should be improved?</div>
  <p>
    SRS Module 3.2 (Landmark Telemetry &amp; Sighting Handoff) and the Django REST backend must be refactored:
  </p>
  <ul>
    <li><strong>Standardized Campus Landmark Dropdown:</strong> Replace open text inputs with an authoritative CIT-U landmark dictionary comprising verified campus zones: <em>Academic Quadrangle, Main Canteen, NGE Building Grounds, CIT-U Gymnasium, Elementary / High School Grounds, Library Walkway, Engineering Alley, and University Clinic Perimeter</em>.</li>
    <li><strong>Emergency Sentinel Priority Flag:</strong> Add an urgent severity selector (<em>Normal Sighting vs. Urgent: Injured / Sick Animal vs. Emergency: Bite / Scratch Risk</em>). When flagged as urgent, trigger an immediate high-visibility banner on the public newsfeed and present instant first-aid guidance in compliance with RA 9482 (immediate washing with soap and water and reporting to the CIT-U Medical-Dental Clinic).</li>
    <li><strong>Stateful 1-Click Intake Handoff:</strong> Refactor <code>ReportSightingView</code> and <code>AddNewPet</code> to pass sighting metadata (photo URI, landmark zone, estimated breed/species, and timestamp) via React Router state and Redux/Context, auto-populating the pet intake registry so staff click "Admit Stray" without re-entering data.</li>
  </ul>

  <div class="question-heading">5. How is the proposed change expected to improve the measurable outcome?</div>
  <p>
    Replacing vague text descriptions with standardized campus landmarks reduces rescue search time from over 45 minutes to under 10 minutes, as rescuers can immediately deploy to defined physical campus nodes. The 1-click intake pipeline eliminates 100% of redundant data entry, saving clinic staff approximately 4 to 6 minutes per admitted animal. Furthermore, prominent emergency guidance elevates community safety and aligns with statutory mandates, boosting PU1 and PU3 to ≥ 4.50.
  </p>

  <!-- REFACTORING AREA 4 -->
  <h2>Refactoring Area 4: Interactive User Onboarding Walkthrough &amp; Mobile Cognitive Density Refactoring</h2>
  <p class="no-indent" style="font-size: 9.5pt; color: #555555; margin-bottom: 4px;">
    <strong>Affected Subsystems:</strong> <code>frontend/src/components/UserGuideModal.jsx</code>, <code>Navbar.jsx</code>, Global Card Layouts &amp; CSS Modules
  </p>

  <div class="question-heading">1. What did you learn from the MVP validation?</div>
  <p>
    Evaluators experienced significant cognitive load when first interacting with Task Force Bruno due to the rich breadth of features presented simultaneously on mobile displays. While desktop users navigated the multi-column interface smoothly, mobile users reported that screens felt feature-dense and lacked instructional scaffolding. Users unfamiliar with animal welfare operations did not immediately understand the functional distinction between permanent campus resident mascots (e.g., Bruno) versus adoptable strays, nor did they realize that pet profiles could be searched using natural language physical traits. This lack of initial orientation directly degraded the System Usability Scale learnability metric, underscoring the necessity for a lightweight, interactive onboarding walkthrough and decluttered mobile card hierarchy.
  </p>

  <div class="question-heading">2. What stakeholder feedback or evidence supports the finding?</div>
  <p>
    Multiple evaluators independently recommended instructional features and interface decluttering:
  </p>
  <ul>
    <li><strong>Quantitative Evidence:</strong> Standardized SUS-B4 (<em>"Needed to learn too many things before effective use"</em>) scored an unfavorable <strong>3.29 / 5.0 (SD = 1.29)</strong>, and SUS-B2 (<em>"Found system unnecessarily complex"</em>) was <strong>2.76 / 5.0</strong>. The overall composite SUS score was capped at <strong>62.32 / 100</strong>.</li>
    <li><strong>Stakeholder Testimonial (Justine Kate Purisima):</strong> <em>"For the engineering team, it's better if there is an 'Instruction Feature' or like a 'guide' on the website's features for easier navigation."</em></li>
    <li><strong>Stakeholder Testimonial (Shena Quiño):</strong> <em>"Please add an interactive guide for first-time users to help them navigate the website efficiently."</em></li>
    <li><strong>Stakeholder Testimonial (Mary Laizelle Dalmero):</strong> <em>"The mobile version of the app has way too many features and it is hard to manage sometimes."</em></li>
    <li><strong>Stakeholder Testimonial (Joel Ramirez):</strong> <em>"...there may be a few spots that perhaps needed some fixing or rather make the design a bit more interactive perhaps."</em></li>
  </ul>

  <div class="question-heading">3. Which SMART objective or measurable outcome is affected?</div>
  <p>
    This directly impacts <strong>SMART Objective 5: High Usability &amp; Sustained Campus Adoption</strong> (achieve high learnability, low cognitive load, visual coherence with CIT-U branding, and strong institutional adoption intent).
  </p>
  <ul>
    <li><strong>Measurable Outcome Affected:</strong> Composite System Usability Scale (SUS) Score (Baseline: <strong>62.32 / 100</strong>; Target: <strong>≥ 80.0 / 100 [Grade A]</strong>); SUS-B4 Learnability Friction (Baseline: <strong>3.29</strong>; Target: <strong>≤ 1.80</strong>); SUS-B3 User Confidence (Baseline: <strong>3.76</strong>; Target: <strong>≥ 4.30 / 5.0</strong>); and Overall Experience Satisfaction (SAT1 Baseline: <strong>4.03</strong>; Target: <strong>≥ 4.50 / 5.0</strong>).</li>
  </ul>

  <div class="question-heading">4. What aspect of the requirements or design should be improved?</div>
  <p>
    The frontend presentation layer must be refactored across SRS Module 4.1 (Interactive User Onboarding) and SDD Section 3:
  </p>
  <ul>
    <li><strong>Deploy Interactive <code>UserGuideModal.jsx</code>:</strong> Build a high-performance, swipeable 4-step modal walkthrough highlighting: (1) Instant QR collar scanning and emergency public passports; (2) AI natural language search; (3) Sighting reporting with landmark tags; and (4) Adoption application procedures. Trigger this walkthrough automatically on first institutional login (tracked via <code>localStorage.getItem('tfb_onboarding_completed')</code>) and make it accessible anytime via a persistent "User Guide" help icon in the top navbar.</li>
    <li><strong>Mobile Card Hierarchy &amp; Spacing:</strong> Refactor mobile views to introduce collapsible sections, reduce redundant card padding, and implement standardized WCAG 2.1 AA status chips (Green for fully vaccinated, Red for active observation quarantine, Amber for pending triage).</li>
  </ul>

  <div class="question-heading">5. How is the proposed change expected to improve the measurable outcome?</div>
  <p>
    An interactive onboarding guide provides immediate conceptual scaffolding for first-time users, directly converting unfamiliarity into confident navigation. User orientation time upon initial visit is projected to drop by over 60%, and mobile layout decluttering relieves cognitive density. This architectural refinement directly addresses the root causes of the low SUS score, projecting an increase from <strong>62.32</strong> to <strong>&gt; 80.0</strong>, transitioning Task Force Bruno from a "Marginal" usability grade to "Excellent / Acceptable" industry standard.
  </p>

  <!-- REFACTORING AREA 5 -->
  <h2>Refactoring Area 5: Supply Logistics Physical Metric Standardization &amp; Clinical Biosecurity Records</h2>
  <p class="no-indent" style="font-size: 9.5pt; color: #555555; margin-bottom: 4px;">
    <strong>Affected Subsystems:</strong> <code>frontend/src/components/InventoryView.jsx</code>, <code>MedicalLogs.jsx</code>, Backend Database Models (<code>wsapi/models.py</code>)
  </p>

  <div class="question-heading">1. What did you learn from the MVP validation?</div>
  <p>
    While the administrative staff evaluation produced unanimous approval for the supply logistics concept (STF2: 5.00/5.00), code-level inspection revealed that inventory quantities in the database lacked strict physical dimensional validation. Allowing arbitrary numerical inputs without binding them to standardized physical units (e.g., mixing raw count with kilograms or milliliter dosage) introduces grave risks of supply miscalculation during physical warehouse reconciliation. Furthermore, while the community praised rabies quarantine alerts (PU3: 4.12), clinic staff highlighted the need to automate the statutory 14-day observation countdown clock on pet profiles following bite or scratch incidents to ensure zero non-compliance with the Department of Agriculture and Department of Health protocols mandated by RA 9482.
  </p>

  <div class="question-heading">2. What stakeholder feedback or evidence supports the finding?</div>
  <p>
    Evaluation from student advocates and administrative staff demonstrated a clear demand for structured logistics and clinical precision:
  </p>
  <ul>
    <li><strong>Quantitative Evidence:</strong> Administrative evaluation of physical unit tracking scored <strong>5.00 / 5.0 (SD = 0.00)</strong> among designated clinic evaluators, indicating high operational value. Community familiarity with pet care scored <strong>3.44 / 5.0</strong>.</li>
    <li><strong>Stakeholder Testimonial (Jamilla Cassandra Nocete):</strong> <em>"Where people would be able to help (donation and such). It could be essential... very useful and essential especially for the campus."</em></li>
    <li><strong>Stakeholder Testimonial (Hanzley James Sibuyan):</strong> <em>"Maybe add animal rescue/caretaking activity section."</em></li>
    <li><strong>Faculty SME Clinical Feedback:</strong> Stressed that bite observation records must programmatically compute expiration dates and automatically clear quarantine status only after veterinary sign-off.</li>
  </ul>

  <div class="question-heading">3. Which SMART objective or measurable outcome is affected?</div>
  <p>
    This affects <strong>SMART Objective 4: Supply Logistics by Genuine Physical Units</strong> (provide clear inventory accountability broken down by operational physical units) and <strong>SMART Objective 3: Campus Biosecurity &amp; Quarantine Telemetry</strong>.
  </p>
  <ul>
    <li><strong>Measurable Outcome Affected:</strong> Physical Inventory Reconciliation Accuracy (Target: <strong>100% variance-free stock counts</strong>); Unit Standard Consistency (Target: <strong>100% strict enum binding</strong> across kg, cans, vials, and pieces); and Biosecurity Compliance Rating (PU3 Baseline: <strong>4.12 / 5.0</strong>; Target: <strong>≥ 4.50 / 5.0</strong>).</li>
  </ul>

  <div class="question-heading">4. What aspect of the requirements or design should be improved?</div>
  <p>
    Refactor database models and frontend forms across SRS Module 2.2 and clinical logs:
  </p>
  <ul>
    <li><strong>Strict Dimensional Unit Enums:</strong> In <code>models.py</code>, restrict the <code>SupplyItem.unit</code> field to a strict Django TextChoices enum: <code>KG</code> (Kilograms for kibble), <code>CAN</code> (Cans for wet food), <code>VIAL</code> (Vials for anti-rabies vaccines), and <code>PCS</code> (Pieces for collars, leashes, and medical gauze). Prevent arbitrary free-text units at both the REST serializer and database constraint levels.</li>
    <li><strong>Automated 14-Day Quarantine Clock:</strong> In <code>MedicalRecord</code>, add a computed property <code>quarantine_expiry_date</code> (incident date + 14 days) and render a live countdown badge on the pet's profile. Emit automatic alert banners to clinic personnel 48 hours prior to quarantine expiration.</li>
  </ul>

  <div class="question-heading">5. How is the proposed change expected to improve the measurable outcome?</div>
  <p>
    Eliminating unit ambiguities ensures physical warehouse inventory aligns perfectly with database records during campus audits. Automating the 14-day bite observation clock removes manual calculation error, guarantees full legal compliance with Philippine anti-rabies regulations, and builds institutional trust, boosting PU3 to ≥ 4.50.
  </p>

  <!-- Section 3: Comprehensive Traceability Matrix -->
  <div class="section-break"></div>
  <h1>3. Synthesis &amp; Traceability Matrix</h1>
  <p class="no-indent">
    The following matrix maps each empirical validation finding to its supporting stakeholder evidence, affected SMART objective, refactored architectural component, and projected measurable outcome:
  </p>

  <h2 class="no-indent">Table 2. End-to-End MVP Validation Refactoring Traceability Matrix</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 17%;">Validation Finding &amp; Empirical Learning</th>
        <th style="width: 20%;">Stakeholder Evidence &amp; Baseline Metric</th>
        <th style="width: 15%;">Affected SMART Objective</th>
        <th style="width: 23%;">Refactored Requirement &amp; Architectural Component</th>
        <th style="width: 25%;">Projected Measurable Outcome &amp; Impact</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Authentication State Disconnection &amp; Keyboard Occlusion</strong></td>
        <td>
          • Carmela Andres &amp; Mary Claire Ramas login drop-offs<br>
          • Gillian Altizo password clipping<br>
          • SUS-B4: <strong>3.29</strong>; PEOU2: <strong>4.12</strong>
        </td>
        <td><strong>SMART 5:</strong> Usability &amp; Adoption<br><strong>SMART 1:</strong> Rapid Identification</td>
        <td>
          • SRS Module 4.2: Auto-login JWT token handoff on register<br>
          • Dynamic viewport units (<code>100dvh</code>) &amp; input scroll-into-view<br>
          • Password visibility toggle
        </td>
        <td>
          • 1st-attempt login success: <strong>≥ 98%</strong><br>
          • Onboarding time: <strong>≤ 20s</strong><br>
          • Eliminates mobile keyboard overlap<br>
          • SUS-B4 friction drops to <strong>&lt; 1.8</strong>
        </td>
      </tr>
      <tr>
        <td><strong>2. Camera Hardware Freezing &amp; Lack of Image Fallback</strong></td>
        <td>
          • John Mikko Rosito (camera freezing on Android)<br>
          • 55.9% Mobile evaluators<br>
          • TECH1: <strong>4.00 (SD = 0.82)</strong>
        </td>
        <td><strong>SMART 1:</strong> Rapid Collar Identification &amp; Public Passport</td>
        <td>
          • SRS Module 1.1: WebRTC exception catch blocks<br>
          • Client-side file upload fallback button (<code>jsQR</code>)<br>
          • Explicit permission retry prompts &amp; stream teardown
        </td>
        <td>
          • <strong>100%</strong> scanning completion rate<br>
          • Zero viewfinder freeze crashes<br>
          • Identification resolution: <strong>≤ 25s</strong><br>
          • TECH1 rating rises to <strong>≥ 4.40</strong>
        </td>
      </tr>
      <tr>
        <td><strong>3. Ambiguous Sighting Locations &amp; Missing Emergency Triage</strong></td>
        <td>
          • Hazel Sibuyan (need landmark maps &amp; urgent tags)<br>
          • John Mikko Rosito (campus map pinning tool)<br>
          • PU1: <strong>4.12</strong>; PU3: <strong>4.12</strong>
        </td>
        <td><strong>SMART 2:</strong> Sighting Triage &amp; Intake<br><strong>SMART 3:</strong> Campus Biosecurity (RA 9482)</td>
        <td>
          • SRS Module 3.2: Standardized CIT-U landmark selector<br>
          • Emergency Sentinel priority toggle &amp; rabies first-aid notices<br>
          • 1-Click auto-fill handoff to <code>AddNewPet</code>
        </td>
        <td>
          • Sighting search time drops from &gt;45m to <strong>&lt; 10 mins</strong><br>
          • <strong>0</strong> redundant intake fields<br>
          • PU1 &amp; PU3 increase to <strong>≥ 4.50</strong><br>
          • Zero biosecurity non-compliance
        </td>
      </tr>
      <tr>
        <td><strong>4. High Cognitive Density &amp; Low SUS Learnability</strong></td>
        <td>
          • Justine Purisima &amp; Shena Quiño (need onboarding guide)<br>
          • Mary Dalmero (mobile feature density)<br>
          • SUS Total: <strong>62.32</strong> (Grade D)
        </td>
        <td><strong>SMART 5:</strong> High Usability &amp; Sustained Campus Adoption</td>
        <td>
          • SRS Module 4.1: Interactive 4-step modal (<code>UserGuideModal.jsx</code>)<br>
          • Persistent navbar guide button<br>
          • Mobile card deduplication &amp; WCAG 2.1 AA status chips
        </td>
        <td>
          • Composite SUS increases to <strong>≥ 80.0</strong> (Grade A)<br>
          • SUS-B4 drops to <strong>≤ 1.8</strong><br>
          • User confidence (SUS-B3): <strong>≥ 4.30</strong><br>
          • User satisfaction (SAT1): <strong>≥ 4.50</strong>
        </td>
      </tr>
      <tr>
        <td><strong>5. Supply Unit Ambiguity &amp; Manual Bite Observation Tracking</strong></td>
        <td>
          • Staff inventory score: <strong>5.00</strong><br>
          • Student donation requests (Jamilla Nocete, Hanzley Sibuyan)<br>
          • Faculty clinical feedback
        </td>
        <td><strong>SMART 4:</strong> Supply Logistics by Genuine Units<br><strong>SMART 3:</strong> Campus Biosecurity</td>
        <td>
          • SRS Module 2.2: Strict enum units (<code>kg</code>, <code>cans</code>, <code>vials</code>, <code>pcs</code>)<br>
          • Public donation transparency log<br>
          • Automated 14-day bite observation countdown badge
        </td>
        <td>
          • <strong>100%</strong> unit standard consistency<br>
          • 0 stock audit discrepancies<br>
          • 100% adherence to RA 9482 14-day observation timeline
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Section 4: Implementation Roadmap & Verification Protocol -->
  <h1>4. Pre-Implementation Refactoring Roadmap &amp; Verification Protocol</h1>
  <p>
    To implement these changes prior to final Capstone 2 system defense, the engineering team has organized the refactoring plan into three phased sprints executing between September 20 and October 10, 2026:
  </p>
  <ul>
    <li><strong>Sprint 1 (Immediate Stability &amp; Hardware Resiliency):</strong> Refactor <code>LoginForm.jsx</code> and <code>RegisterUserView.jsx</code> with automatic token caching and dynamic viewport padding. Implement WebRTC catch blocks and static image QR decoding fallback in <code>CollarQRScanner.jsx</code>.</li>
    <li><strong>Sprint 2 (Telemetry, Triage &amp; Guided Onboarding):</strong> Implement the CIT-U landmark dropdown dictionary, Emergency Sentinel triage toggle, and 1-click state handoff in <code>ReportSightingView.jsx</code>. Deploy the interactive <code>UserGuideModal.jsx</code> component and bind it to the top navigation bar.</li>
    <li><strong>Sprint 3 (Logistics Enums &amp; Biosecurity Automation):</strong> Enforce strict physical unit enums in <code>wsapi/models.py</code>. Embed the 14-day bite observation quarantine countdown timer on pet profiles and medical logs.</li>
  </ul>

  <div class="callout-box">
    <strong>Longitudinal Verification Protocol (N = 17 Consented Evaluators):</strong> In Question 18 of the validation instrument, <strong>50.0% of participants (17 out of 34 stakeholders)</strong> formally provided longitudinal consent and contact information to participate in re-testing. Upon completion of Sprints 1–3, these 17 evaluators will re-execute the identical 12-task verification protocol and 4-item SUS benchmark to statistically validate the elevation of the System Usability Scale score from 62.32 to ≥ 80.0 and verify zero residual login or camera crashes.
  </div>

  <!-- Section 5: Conclusion -->
  <h1>5. Conclusion &amp; Institutional Readiness</h1>
  <p>
    The MVP validation of Task Force Bruno provided indispensable empirical evidence demonstrating the platform's exceptional institutional value (PU: 4.31, Endorsement: 4.26, Staff approval: 5.0) while pinpointing exact usability, hardware, and workflow constraints. By establishing rigorous traceability between user feedback, affected SMART objectives, and architectural refactoring, the engineering team guarantees that all post-validation modifications directly elevate measurable outcomes. The proposed refactorings ensure that Task Force Bruno transitions into a rock-solid, user-friendly, and legally compliant campus animal welfare infrastructure, primed for deployment across Cebu Institute of Technology – University.
  </p>

  <p style="text-align: center; margin-top: 24px; font-size: 9.5pt; color: #555555; text-indent: 0;">
    — End of Submission Document —<br>
    <strong>Task Force Bruno Capstone Engineering &amp; Research Team</strong><br>
    College of Computer Studies • Department of Information Technology • Cebu Institute of Technology – University
  </p>

</body>
</html>
"""

temp_html = Path("docs/temp_refactoring_report.html")
temp_html.write_text(html_content, encoding="utf-8")

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
pdf_out = Path("docs/Task_Force_Bruno_MVP_Validation_Refactoring_Report.pdf").resolve()

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

print(f"Successfully generated Refactoring Report PDF at: {pdf_out}")
