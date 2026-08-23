const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function generatePDF() {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    bufferPages: true
  });

  const outputPath = path.join(__dirname, '../docs/Task_Force_Bruno_MVP_Validation_Plan.pdf');
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const MAROON = '#5C0612';
  const GOLD = '#B8860B';
  const DARK = '#2D3748';
  const GRAY = '#718096';
  const LIGHT_BG = '#F7FAFC';

  function drawHeader() {
    doc.fontSize(8).fillColor(GRAY).font('Helvetica')
       .text('Task Force Bruno | Capstone 2 MVP Validation Plan', 50, 30, { align: 'right' });
    doc.moveTo(50, 42).lineTo(545, 42).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
  }

  function checkPageBreak(neededSpace = 80) {
    if (doc.y + neededSpace > 750) {
      doc.addPage();
      drawHeader();
      doc.y = 55;
    }
  }

  function addHeading1(title) {
    checkPageBreak(70);
    doc.moveDown(0.8);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(MAROON).text(title);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(GOLD).lineWidth(1.5).stroke();
    doc.moveDown(0.4);
  }

  function addHeading2(title) {
    checkPageBreak(50);
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(MAROON).text(title);
    doc.moveDown(0.2);
  }

  function addPara(text) {
    checkPageBreak(30);
    doc.fontSize(9.5).font('Helvetica').fillColor(DARK).text(text, { align: 'justify', lineGap: 2 });
    doc.moveDown(0.3);
  }

  function addBullet(boldPrefix, text) {
    checkPageBreak(25);
    const y = doc.y;
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(MAROON).text('• ', 55, y, { continued: false });
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(DARK).text(boldPrefix + ' ', 68, y, { continued: true });
    doc.fontSize(9.5).font('Helvetica').fillColor(DARK).text(text, { align: 'justify', lineGap: 1.5 });
    doc.moveDown(0.25);
  }

  function addSimpleTable(headers, rows, colWidths) {
    checkPageBreak(50 + rows.length * 20);
    const startX = 50;
    let startY = doc.y + 4;

    // Header Background
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    doc.rect(startX, startY, totalWidth, 18).fill(MAROON);

    let curX = startX;
    headers.forEach((h, i) => {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#FFFFFF')
         .text(h, curX + 4, startY + 4, { width: colWidths[i] - 8, align: 'left' });
      curX += colWidths[i];
    });

    startY += 18;
    rows.forEach((row, rIdx) => {
      checkPageBreak(30);
      const isEven = rIdx % 2 === 0;
      
      // Calculate row height based on text length
      let maxLines = 1;
      row.forEach((cell, cIdx) => {
        const lines = Math.ceil(doc.widthOfString(cell, { font: 'Helvetica', size: 8 }) / (colWidths[cIdx] - 8));
        if (lines > maxLines) maxLines = lines;
      });
      const rowHeight = Math.max(16, maxLines * 11 + 6);

      if (isEven) {
        doc.rect(startX, startY, totalWidth, rowHeight).fill('#FFFFFF');
      } else {
        doc.rect(startX, startY, totalWidth, rowHeight).fill(LIGHT_BG);
      }

      // Draw borders
      doc.rect(startX, startY, totalWidth, rowHeight).strokeColor('#CBD5E0').lineWidth(0.5).stroke();

      curX = startX;
      row.forEach((cell, cIdx) => {
        doc.fontSize(8).font('Helvetica').fillColor(DARK)
           .text(cell, curX + 4, startY + 4, { width: colWidths[cIdx] - 8, align: 'left', lineGap: 1 });
        curX += colWidths[cIdx];
      });

      startY += rowHeight;
      doc.y = startY;
    });

    doc.moveDown(0.6);
  }

  // --- COVER / HEADER ---
  drawHeader();
  doc.y = 55;

  doc.fontSize(13).font('Helvetica-Bold').fillColor(MAROON).text('CEBU INSTITUTE OF TECHNOLOGY – UNIVERSITY', { align: 'center' });
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(GOLD).text('College of Computer Studies • Department of Information Technology', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(16).font('Helvetica-Bold').fillColor(MAROON).text('TASK FORCE BRUNO: INTEGRATED CAMPUS PET MANAGEMENT SYSTEM', { align: 'center' });
  doc.fontSize(11).font('Helvetica-Oblique').fillColor(DARK).text('MVP Validation Framework & Empirical Research Plan (Capstone 2)', { align: 'center' });
  doc.moveDown(0.8);

  // Metadata Table
  addSimpleTable(
    ['Attribute', 'Specification Details'],
    [
      ['Institution', 'Cebu Institute of Technology – University (CIT-U)'],
      ['Course Track', 'Capstone 2 / Information Technology'],
      ['Document Version', 'Version 1.0 (Production Validation Baseline)'],
      ['Target Sample Size', 'N = 30 Stratified Campus Participants (22 Community, 8 Staff)'],
      ['Evaluation Frameworks', 'Technology Acceptance Model (TAM) + ISO 9241-11 Usability + SUS'],
      ['System Deployment', 'Vercel (Client) + Render (DRF Gateway) + Supabase (PostgreSQL & Storage)']
    ],
    [140, 355]
  );

  // Section 1
  addHeading1('1. Executive Summary & Validation Goals');
  addPara('The primary objective of the Task Force Bruno MVP Validation is to systematically evaluate the usefulness, usability, operational efficiency, user experience, and institutional acceptance of the deployed campus pet management platform at Cebu Institute of Technology – University (CIT-U).');
  addPara('This validation study gathers empirical evidence across four foundational pillars:');
  addBullet('1. Stray Identification:', 'Mitigates identification delays and streamlines animal welfare operations.');
  addBullet('2. Rapid Lookups:', 'Dual-card optical QR scanner and AI-driven trait search engine enable fast lookups.');
  addBullet('3. Clinical Tracking:', 'Digitized clinical timeline and vaccination journal improve institutional records.');
  addBullet('4. Institutional Acceptance:', 'Verifies community willingness to adopt and sustain the system long-term.');

  // Section 2
  addHeading1('2. Research Objectives & Evaluation Matrix');
  addPara('The evaluation connects Capstone research questions with established scientific frameworks and measurable metrics:');
  addSimpleTable(
    ['RQ / Dimension', 'Model / Framework', 'Target Benchmark Metric', 'Data Instrument'],
    [
      ['RQ1: Usability', 'ISO 9241-11 & SUS', 'SUS Score >= 75/100; PEOU >= 4.0/5.0', '10-Item SUS Questionnaire'],
      ['RQ2: Effectiveness', 'Goal-Question-Metric', '>= 90% Task Completion, 0 fatal errors', 'Moderated Task Protocol Sheet'],
      ['RQ3: Efficiency', 'ISO 9241-11 Time-on-Task', 'Mean QR scan <= 25s; Sighting log <= 60s', 'Stopwatch / Event Timestamps'],
      ['RQ4: Usefulness', 'TAM (Perceived Usefulness)', 'PU Mean Score >= 4.2 / 5.0', '7-Point TAM Survey Instrument'],
      ['RQ5: User Acceptance', 'TAM (Behavioral Intent)', '>= 85% Positive Adoption Intent', 'TAM Survey + Qualitative Interviews'],
      ['RQ6: UX & Reliability', 'UAT & Heuristic Review', 'Zero blocking UI bugs; > 80% satisfaction', 'Post-Study Feedback Survey']
    ],
    [100, 110, 155, 130]
  );

  // Section 3
  addHeading1('3. Selected Validation Models & Frameworks');
  addPara('A Multi-Method Hybrid Approach is adopted to ensure rigorous triangulated findings:');
  addBullet('TAM Model:', 'Evaluates Perceived Usefulness (PU), Perceived Ease of Use (PEOU), Attitude (ATU), and Behavioral Intention (BI).');
  addBullet('ISO 9241-11 Usability:', 'Measures Effectiveness (task completion), Efficiency (time-on-task), and User Satisfaction.');
  addBullet('System Usability Scale (SUS):', 'Standardized 10-item questionnaire providing an industry benchmark score (0-100).');
  addBullet('Performance Metrics:', 'Captures objective Task Success Rate (%) and Time-on-Task (seconds).');
  addBullet('Qualitative Interviews:', 'Semi-structured post-test questions uncovering UX bottlenecks and user feedback.');

  // Section 4
  addHeading1('4. Target Respondents & Stratified Sampling Strategy');
  addPara('A total sample of N = 30 stakeholders from CIT-U will participate in the validation study:');
  addSimpleTable(
    ['Cohort Group', 'Target Sub-Group', 'Size (n)', 'Role & Responsibilities in Testing'],
    [
      ['Cohort A: Community', 'College Students (All Depts)', '14', 'Test QR scanning, AI search, sightings, adoption'],
      ['Cohort A: Community', 'Faculty Members', '4', 'Test campus bulletins, animal identification, sighting alerts'],
      ['Cohort A: Community', 'Non-Teaching Staff', '4', 'Test mobile scanning, reporting lost/injured campus pets'],
      ['Cohort B: Staff / Ops', 'MDC Staff Members', '3', 'Test administrative triage, health records, bulletins'],
      ['Cohort B: Staff / Ops', 'Campus Clinic / Vet Handlers', '2', 'Test clinical logging, anti-rabies vaccine logs & due dates'],
      ['Cohort B: Staff / Ops', 'Animal Org Student Officers', '3', 'Test adoption reviews, rescue intake, inventory supply logs']
    ],
    [110, 125, 45, 215]
  );

  // Section 5
  addHeading1('5. Validation Test Scenarios & Task Protocols');
  addHeading2('Cohort A: Campus Community User Test Protocol (Tasks 1–5)');
  addSimpleTable(
    ['Task ID', 'Task Name', 'Scenario Prompt', 'Success Criteria', 'Max Time'],
    [
      ['TS-A1', 'Registration & Login', 'Register with @cit.edu email and ID (XX-XXXX-XXX), then log in.', 'Profile created, session active, landed on dashboard', '60s'],
      ['TS-A2', 'Collar QR Lookup', 'Scan sample pet QR tag (PET-0001) to retrieve animal file.', 'jsQR decodes matrix, loads demographics and vaccine logs', '45s'],
      ['TS-A3', 'AI Trait Search', 'Search for "calico coat with white socks near library".', 'Candidate profiles matched descending by affinity score', '30s'],
      ['TS-A4', 'Submit Sighting', 'Report stray sighting near Gym with description and photo.', 'Sighting saved to Supabase with image and location', '75s'],
      ['TS-A5', 'Adoption Form', 'Browse gallery, select companion, submit adoption form.', 'Application stored with status set to Pending', '90s']
    ],
    [50, 95, 175, 140, 35]
  );

  addHeading2('Cohort B: MDC Staff & Clinic Admin Test Protocol (Tasks 6–10)');
  addSimpleTable(
    ['Task ID', 'Task Name', 'Scenario Prompt', 'Success Criteria', 'Max Time'],
    [
      ['TS-B1', 'New Animal Intake', 'Register rescued stray with biometrics, TNR tag, and image upload.', 'Pet record created, visual asset saved in Supabase bucket', '120s'],
      ['TS-B2', 'Sighting Triage', 'Review pending sighting alert, verify evidence, and mark as Triaged.', 'Sighting status updated in database in real time', '45s'],
      ['TS-B3', 'Clinical & Vaccine Log', 'Log veterinary diagnosis and vaccine with calculated due date.', 'Record and vaccine journal appended to health timeline', '60s'],
      ['TS-B4', 'Adoption Review', 'Inspect pending application, verify applicant, approve adoption.', 'Application marked Approved, pet moved to Adopted Alumni', '60s'],
      ['TS-B5', 'Inventory Ledger', 'Log inbound donation of 10 cat food units with donor remarks.', 'Inventory level updated, transaction audit ledger appended', '45s']
    ],
    [50, 95, 175, 140, 35]
  );

  // Section 6
  addHeading1('6. Data Collection Instruments & Questionnaires');
  addHeading2('Instrument 1: System Usability Scale (SUS) (5-Point Likert Scale)');
  addPara('1. I think that I would like to use Task Force Bruno frequently.\n2. I found the system unnecessarily complex.\n3. I thought the system was easy to use.\n4. I think that I would need the support of a technical person to use this system.\n5. I found the various functions in this system were well integrated.\n6. I thought there was too much inconsistency in this system.\n7. I would imagine that most people would learn to use this system very quickly.\n8. I found the system very cumbersome to use.\n9. I felt very confident using the system.\n10. I needed to learn a lot of things before I could get going with this system.');
  addPara('SUS Formula: Score = [(Q1-1)+(5-Q2)+(Q3-1)+(5-Q4)+(Q5-1)+(5-Q6)+(Q7-1)+(5-Q8)+(Q9-1)+(5-Q10)] * 2.5');

  addHeading2('Instrument 2: Technology Acceptance Model (TAM) Items (7-Point Likert)');
  addBullet('PU1-PU4 (Perceived Usefulness):', 'Speed of identification, transparency of vaccine/TNR logs, community engagement, and overall campus utility.');
  addBullet('PEOU1-PEOU4 (Ease of Use):', 'Ease of QR scanning, clarity of navigation, ease of form submission, and overall UI ergonomics.');
  addBullet('ATU1-ATU2 (Attitude):', 'Positive sentiment toward digital animal welfare vs legacy paper records.');
  addBullet('BI1-BI2 (Behavioral Intent):', 'Intention to report sightings and recommend the system to peers.');

  // Section 7
  addHeading1('7. Measurable Success Criteria & Target Benchmarks');
  addSimpleTable(
    ['Evaluation Parameter', 'Minimum Threshold', 'Target Benchmark', 'Operational Interpretation'],
    [
      ['System Usability Scale (SUS)', '>= 68.0 (Global Avg)', '>= 75.0 (Grade A - Good to Excellent)', 'Superior usability with minimal friction.'],
      ['Task Success Rate (TSR)', '>= 80.0%', '>= 90.0% Completion Rate', 'Users can independently complete key workflows.'],
      ['Mean Time (QR Scan)', '<= 60 seconds', '<= 25 seconds', 'Collar decoding is swift in field sightings.'],
      ['Mean Time (Sighting Log)', '<= 120 seconds', '<= 60 seconds', 'Stray reporting friction is very low.'],
      ['TAM: Perceived Usefulness', '>= 3.5 / 5.0', '>= 4.2 / 5.0 (Positive)', 'Strong validation of animal welfare utility.'],
      ['TAM: Ease of Use', '>= 3.5 / 5.0', '>= 4.0 / 5.0 (Positive)', 'High learnability for non-technical users.'],
      ['TAM: Behavioral Intention', '>= 70.0% Positive', '>= 85.0% Positive Intent', 'High likelihood of recurring adoption.']
    ],
    [125, 95, 140, 135]
  );

  // Section 8 & 9
  addHeading1('8. Data Analysis Methodology');
  addPara('• Descriptive Statistics: Mean, SD, and Median values for all SUS and TAM constructs.\n• Reliability Testing: Cronbach\'s Alpha (target alpha >= 0.70) for TAM scale consistency.\n• Correlation Analysis: Pearson\'s r assessing PEOU -> PU -> Behavioral Intention.\n• Thematic Coding: Inductive synthesis of qualitative user interview transcripts.');

  addHeading1('9. Validation Execution Roadmap');
  addSimpleTable(
    ['Phase', 'Timeline', 'Key Activities', 'Deliverables'],
    [
      ['Phase 1: Prep', 'Days 1–3', 'Finalize instruments, deploy cloud build, seed QR tags', 'Printed/Digital Survey Forms & Live App'],
      ['Phase 2: Testing', 'Days 4–8', 'Conduct 30 moderated testing sessions (22 user, 8 staff)', 'Completed Sheets, SUS/TAM Data, Notes'],
      ['Phase 3: Analysis', 'Days 9–11', 'Compute SUS/TAM aggregates, Task Success & ToT', 'Statistical Tables, Charts & Findings'],
      ['Phase 4: Reporting', 'Days 12–14', 'Draft Capstone Chapter 4, implement UX fixes', 'Completed Capstone Chapter 4 & Slide Deck']
    ],
    [90, 65, 185, 155]
  );

  // Section 10
  addHeading1('10. Adviser Consultation & Sign-Off Section');
  addPara('[  ] Validation Model Approval: Concurrence on hybrid TAM + ISO 9241-11 + SUS methodology.\n[  ] Respondent Stratification: Approval of N = 30 cohort distribution (22 Community, 8 Staff).\n[  ] Instrument Review: Verification of 10-item SUS and 12-item TAM survey questionnaires.\n[  ] Data Privacy Compliance: Assured anonymous handling of participant data under CIT-U ethical guidelines.\n[  ] Live Deployment Verification: Production cloud build operational on Vercel and Render.');
  doc.moveDown(0.5);

  addSimpleTable(
    ['Role', 'Name & Designation', 'Signature', 'Date of Approval'],
    [
      ['Capstone Adviser', '___________________________', '___________________________', '____ / ____ / 2026'],
      ['Department Chair', '___________________________', '___________________________', '____ / ____ / 2026'],
      ['Lead Researcher', 'Clark Yu (Task Force Bruno)', '___________________________', '____ / ____ / 2026']
    ],
    [110, 155, 140, 90]
  );

  // Footer on all pages
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(GRAY).font('Helvetica')
       .text(`Cebu Institute of Technology – University (CIT-U)  |  Page ${i + 1} of ${range.count}`, 50, 800, { align: 'center' });
  }

  doc.end();
  stream.on('finish', () => {
    console.log(`PDF generated successfully at: ${outputPath}`);
  });
}

generatePDF();
