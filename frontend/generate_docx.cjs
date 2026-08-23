const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  PageNumber,
  NumberFormat,
  Footer,
  Header
} = require('docx');

const MAROON = '5C0612';
const GOLD = 'D4AF37';
const DARK_GRAY = '2D3748';
const LIGHT_GRAY = 'F7FAFC';
const BORDER_COLOR = 'CBD5E0';
const WHITE = 'FFFFFF';

function createHeading1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    run: {
      bold: true,
      size: 28,
      color: MAROON,
      font: 'Arial'
    }
  });
}

function createHeading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
    run: {
      bold: true,
      size: 24,
      color: MAROON,
      font: 'Arial'
    }
  });
}

function createHeading3(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    run: {
      bold: true,
      size: 20,
      color: DARK_GRAY,
      font: 'Arial'
    }
  });
}

function createPara(text, options = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 100, line: 276 },
    alignment: options.alignment || AlignmentType.LEFT,
    children: [
      new TextRun({
        text: text,
        font: 'Arial',
        size: options.size || 20,
        bold: options.bold || false,
        italics: options.italics || false,
        color: options.color || DARK_GRAY
      })
    ]
  });
}

function createBullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({
      text: boldPrefix + ' ',
      bold: true,
      font: 'Arial',
      size: 20,
      color: DARK_GRAY
    }));
  }
  children.push(new TextRun({
    text: text,
    font: 'Arial',
    size: 20,
    color: DARK_GRAY
  }));

  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 60 },
    children: children
  });
}

function createStyledTable(headers, rowsData, colWidths = []) {
  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: BORDER_COLOR
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, idx) => new TableCell({
      shading: { type: ShadingType.CLEAR, fill: MAROON },
      margins: { top: 120, bottom: 120, left: 140, right: 140 },
      width: colWidths[idx] ? { size: colWidths[idx], type: WidthType.DXA } : undefined,
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: h,
              bold: true,
              color: WHITE,
              font: 'Arial',
              size: 19
            })
          ]
        })
      ]
    }))
  });

  const tableRows = [headerRow];

  rowsData.forEach((row, rIdx) => {
    const isEven = rIdx % 2 === 0;
    const cellRow = new TableRow({
      children: row.map((cellText, cIdx) => new TableCell({
        shading: { type: ShadingType.CLEAR, fill: isEven ? WHITE : LIGHT_GRAY },
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        width: colWidths[cIdx] ? { size: colWidths[cIdx], type: WidthType.DXA } : undefined,
        borders: {
          top: borderStyle,
          bottom: borderStyle,
          left: borderStyle,
          right: borderStyle
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: cellText,
                font: 'Arial',
                size: 18,
                color: DARK_GRAY
              })
            ]
          })
        ]
      }))
    });
    tableRows.push(cellRow);
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle,
      insideHorizontal: borderStyle,
      insideVertical: borderStyle
    },
    rows: tableRows
  });
}

async function generateDocx() {
  const doc = new Document({
    creator: 'Task Force Bruno Team - CIT-U',
    title: 'MVP Validation Framework & Research Plan',
    description: 'Capstone 2 MVP Validation Framework for Task Force Bruno',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Task Force Bruno | Capstone 2 MVP Validation Plan',
                    font: 'Arial',
                    size: 16,
                    color: '718096'
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Cebu Institute of Technology – University (CIT-U)  |  Page ',
                    font: 'Arial',
                    size: 16,
                    color: '718096'
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Arial',
                    size: 16,
                    color: '718096'
                  }),
                  new TextRun({
                    text: ' of ',
                    font: 'Arial',
                    size: 16,
                    color: '718096'
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Arial',
                    size: 16,
                    color: '718096'
                  })
                ]
              })
            ]
          })
        },
        children: [
          // Institutional Banner
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 60 },
            children: [
              new TextRun({
                text: 'CEBU INSTITUTE OF TECHNOLOGY – UNIVERSITY',
                bold: true,
                size: 24,
                font: 'Arial',
                color: MAROON
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 180 },
            children: [
              new TextRun({
                text: 'College of Computer Studies • Department of Information Technology',
                size: 18,
                font: 'Arial',
                color: GOLD
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 200 },
            children: [
              new TextRun({
                text: 'TASK FORCE BRUNO: INTEGRATED CAMPUS PET MANAGEMENT SYSTEM',
                bold: true,
                size: 28,
                font: 'Arial',
                color: MAROON
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 240 },
            children: [
              new TextRun({
                text: 'MVP Validation Framework & Empirical Research Plan (Capstone 2)',
                italics: true,
                size: 22,
                font: 'Arial',
                color: DARK_GRAY
              })
            ]
          }),

          // Metadata Table
          createStyledTable(
            ['Project Attribute', 'Specification Details'],
            [
              ['Institution', 'Cebu Institute of Technology – University (CIT-U)'],
              ['Course Track', 'Capstone 2 / Information Technology'],
              ['Document Version', 'Version 1.0 (Production Validation Baseline)'],
              ['Target Sample Size', 'N = 30 Stratified Campus Participants (22 Community, 8 Staff)'],
              ['Evaluation Frameworks', 'Technology Acceptance Model (TAM) + ISO 9241-11 Usability + SUS'],
              ['System Deployment', 'Vercel (Frontend Client) + Render (Django REST API Gateway) + Supabase (PostgreSQL & Storage)']
            ],
            [3000, 6000]
          ),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // Section 1: Executive Summary
          createHeading1('1. Executive Summary & Validation Goals'),
          createPara(
            'The primary objective of the Task Force Bruno MVP Validation is to systematically evaluate the usefulness, usability, operational efficiency, user experience, and institutional acceptance of the deployed campus pet management platform at Cebu Institute of Technology – University (CIT-U).'
          ),
          createPara(
            'Rather than merely verifying that the software functions without errors, this validation study gathers empirical quantitative and qualitative evidence to prove that:'
          ),
          createBullet('The system effectively mitigates stray identification delays and streamlines animal welfare operations across campus.', '1. Stray Identification:'),
          createBullet('The dual-card optical QR scanner and AI-driven trait search engine allow rapid, accurate lookups.', '2. Rapid Lookups:'),
          createBullet('The digitized clinical timeline, vaccination journal, and adoption pipeline improve institutional coordination over legacy manual logging.', '3. Clinical Tracking:'),
          createBullet('Both general campus community members (students, faculty) and administrative operators (MDC staff, campus clinic handlers) are willing to adopt and sustain the system long-term.', '4. Institutional Acceptance:'),

          // Section 2: Research Objectives & Evaluation Matrix
          createHeading1('2. Research Objectives & Evaluation Matrix'),
          createPara('The evaluation directly connects Capstone research questions with established scientific frameworks, measurable metrics, and concrete instruments:'),
          createStyledTable(
            ['Research Question', 'Evaluation Dimension', 'Model / Framework', 'Target Metric', 'Data Instrument'],
            [
              ['RQ1: Usability', 'Interface clarity, navigation ease, and learnability', 'ISO 9241-11 & SUS', 'SUS Score ≥ 75/100; PEOU ≥ 4.0/5.0', '10-Item SUS Questionnaire'],
              ['RQ2: Effectiveness', 'Accuracy of identification, sighting logs, and intake', 'Goal-Question-Metric (GQM)', '≥ 90% Task Completion Rate, 0 critical errors', 'Moderated Task Observation Sheet'],
              ['RQ3: Efficiency', 'Turnaround time for QR lookups and inventory updates', 'ISO 9241-11 Time-on-Task', 'Mean QR scan ≤ 25s; Sighting log ≤ 60s', 'Stopwatch / Event Timestamp Logs'],
              ['RQ4: Usefulness', 'Mitigation of rabies risk, TNR monitoring, and pet safety', 'TAM (Perceived Usefulness)', 'PU Mean Score ≥ 4.2 / 5.0', '7-Point TAM Survey Instrument'],
              ['RQ5: User Acceptance', 'Stakeholder willingness to adopt the platform', 'TAM (Behavioral Intention)', '≥ 85% Positive Adoption Intent', 'TAM Survey + Qualitative Interviews'],
              ['RQ6: UX & Reliability', 'Visual hierarchy, responsiveness, and session security', 'UAT & Heuristic Review', 'Zero blocking UI bugs; > 80% satisfaction', 'Post-Study Feedback Survey']
            ],
            [1600, 1800, 1600, 2000, 2000]
          ),

          // Section 3: Selected Validation Models
          createHeading1('3. Selected Validation Models & Frameworks'),
          createPara('A Multi-Method Hybrid Approach is adopted to ensure rigorous triangulated findings for Capstone 2:'),
          createHeading2('3.1 Primary Theoretical Framework: TAM + ISO 9241-11'),
          createBullet('Perceived Usefulness (PU): Degree to which users believe the system improves campus animal management.', '• TAM Construct 1:'),
          createBullet('Perceived Ease of Use (PEOU): Degree to which users find the interface, QR scanner, and forms effortless.', '• TAM Construct 2:'),
          createBullet('Attitude Towards Using (ATU) & Behavioral Intention (BI): User sentiment and likelihood of recurring use.', '• TAM Construct 3:'),
          createBullet('ISO 9241-11 Usability: Tri-partite measurement of Effectiveness (task completion), Efficiency (time expended), and Satisfaction (perceived comfort).', '• ISO 9241-11:'),

          createHeading2('3.2 Standardized Usability Instrument: System Usability Scale (SUS)'),
          createPara('The SUS questionnaire provides an industry-standard composite score (0–100) across 10 balanced positive and negative Likert items, allowing direct benchmark comparison against international software averages (industry average = 68.0).'),

          createHeading2('3.3 Objective Performance Measures: Task Success Rate & Time-on-Task'),
          createPara('Direct observational data captured during moderated test execution: Binary task completion (1 = Success without help, 0.5 = Success with prompt, 0 = Failure) and Time-on-Task (ToT in seconds).'),

          createHeading2('3.4 Qualitative Inquiry: Post-Test Semi-Structured Interviews'),
          createPara('Captures open-ended narrative insights on workflow bottlenecks, user emotion, visual aesthetic feedback, and prioritized feature recommendations.'),

          // Section 4: Target Respondents
          createHeading1('4. Target Respondents & Stratified Sampling Strategy'),
          createPara('The validation involves N = 30 active stakeholders from Cebu Institute of Technology – University:'),
          createStyledTable(
            ['Cohort Group', 'Target Sub-Group', 'Sample Size (n)', 'Role & Responsibilities in Testing'],
            [
              ['Cohort A: Campus Community', 'College Students (All Depts)', '14', 'Test QR scanning, AI search, sightings submission, adoption browsing'],
              ['Cohort A: Campus Community', 'Faculty Members', '4', 'Test campus safety newsfeed, animal identification, sighting alerts'],
              ['Cohort A: Campus Community', 'Non-Teaching Staff', '4', 'Test mobile scanning, reporting lost/injured campus companions'],
              ['Cohort B: Staff & Operators', 'MDC Staff Members', '3', 'Test administrative triage, health records, broadcast bulletins'],
              ['Cohort B: Staff & Operators', 'Campus Clinic / Vet Handlers', '2', 'Test clinical logging, anti-rabies vaccine journaling & due dates'],
              ['Cohort B: Staff & Operators', 'Animal Org Student Officers', '3', 'Test adoption reviews, rescue intake, inventory supply movements']
            ],
            [2200, 2400, 1400, 3000]
          ),

          // Section 5: Validation Test Scenarios
          createHeading1('5. Validation Test Scenarios & Task Protocols'),
          createHeading2('Cohort A: Campus Community User Test Protocol (Tasks 1–5)'),
          createStyledTable(
            ['Task ID', 'Task Name', 'Scenario Prompt', 'Success Criteria', 'Time Benchmark'],
            [
              ['TS-A1', 'Registration & Login', 'Register with @cit.edu email and ID format (XX-XXXX-XXX), then log in.', 'Profile created, session active, landed on dashboard', '≤ 60 seconds'],
              ['TS-A2', 'Collar QR Scanner Lookup', 'Scan sample pet QR tag (PET-0001) or upload code to retrieve animal file.', 'jsQR decodes matrix, loads demographics and vaccine status', '≤ 45 seconds'],
              ['TS-A3', 'AI Trait Search', 'Search for "calico coat with white socks near library" using NLP engine.', 'Candidate profiles matched descending by affinity score', '≤ 30 seconds'],
              ['TS-A4', 'Submit Sighting Report', 'Report a stray sighting near Gymnasium with description and photo upload.', 'Sighting saved to Supabase with image asset and location', '≤ 75 seconds'],
              ['TS-A5', 'Adoption Application', 'Browse adoption gallery, select companion, submit adoption form.', 'Application stored with status set to Pending', '≤ 90 seconds']
            ],
            [1200, 1800, 2500, 2300, 1200]
          ),

          createHeading2('Cohort B: MDC Staff & Clinic Admin Test Protocol (Tasks 6–10)'),
          createStyledTable(
            ['Task ID', 'Task Name', 'Scenario Prompt', 'Success Criteria', 'Time Benchmark'],
            [
              ['TS-B1', 'New Animal Intake', 'Register rescued stray with biometrics, TNR tag, and image upload.', 'Pet record created, visual asset saved in Supabase bucket', '≤ 120 seconds'],
              ['TS-B2', 'Sighting Triage', 'Review pending sighting alert, verify evidence, and mark as Triaged.', 'Sighting status updated in database in real time', '≤ 45 seconds'],
              ['TS-B3', 'Clinical & Vaccine Log', 'Log veterinary diagnosis and anti-rabies vaccine with calculated due date.', 'Record and vaccine journal appended to health timeline', '≤ 60 seconds'],
              ['TS-B4', 'Adoption Review', 'Inspect pending application, verify applicant, approve adoption.', 'Application marked Approved, pet moved to Adopted Alumni', '≤ 60 seconds'],
              ['TS-B5', 'Inventory Stock Ledger', 'Log inbound donation of 10 cat food units with donor remarks.', 'Inventory level updated, transaction audit ledger appended', '≤ 45 seconds']
            ],
            [1200, 1800, 2500, 2300, 1200]
          ),

          // Section 6: Data Collection Instruments
          createHeading1('6. Data Collection Instruments & Questionnaires'),
          createHeading2('Instrument 1: System Usability Scale (SUS) (5-Point Likert Scale)'),
          createBullet('1. I think that I would like to use Task Force Bruno frequently.'),
          createBullet('2. I found the system unnecessarily complex.'),
          createBullet('3. I thought the system was easy to use.'),
          createBullet('4. I think that I would need the support of a technical person to be able to use this system.'),
          createBullet('5. I found the various functions in this system were well integrated.'),
          createBullet('6. I thought there was too much inconsistency in this system.'),
          createBullet('7. I would imagine that most people would learn to use this system very quickly.'),
          createBullet('8. I found the system very cumbersome to use.'),
          createBullet('9. I felt very confident using the system.'),
          createBullet('10. I needed to learn a lot of things before I could get going with this system.'),
          createPara('SUS Score Formula: Score = [(Q1-1)+(5-Q2)+(Q3-1)+(5-Q4)+(Q5-1)+(5-Q6)+(Q7-1)+(5-Q8)+(Q9-1)+(5-Q10)] × 2.5', { italics: true, bold: true, color: MAROON }),

          createHeading2('Instrument 2: Technology Acceptance Model (TAM) Survey (7-Point Likert Scale)'),
          createBullet('PU1: Using Task Force Bruno makes identifying campus animals significantly faster.', '• Perceived Usefulness:'),
          createBullet('PU2: The system improves the transparency of campus vaccination and TNR sterilization records.', '• Perceived Usefulness:'),
          createBullet('PU3: The sighting triage and adoption modules enhance community involvement in animal welfare.', '• Perceived Usefulness:'),
          createBullet('PU4: Overall, I find Task Force Bruno useful for the CIT-U campus ecosystem.', '• Perceived Usefulness:'),
          createBullet('PEOU1: Learning to operate the QR scanner and AI search features is easy for me.', '• Ease of Use:'),
          createBullet('PEOU2: My interaction with the system is clear, responsive, and understandable.', '• Ease of Use:'),
          createBullet('PEOU3: It is easy to submit sighting reports, applications, and browse animal profiles.', '• Ease of Use:'),
          createBullet('PEOU4: I find the user interface layout intuitive and easy to navigate.', '• Ease of Use:'),
          createBullet('ATU1: Using Task Force Bruno is a positive and worthwhile initiative for CIT-U.', '• Attitude:'),
          createBullet('ATU2: Digital campus pet management is far superior to legacy paper records or uncoordinated chats.', '• Attitude:'),
          createBullet('BI1: I intend to use Task Force Bruno whenever I encounter a stray or resident pet on campus.', '• Behavioral Intent:'),
          createBullet('BI2: I would recommend Task Force Bruno to fellow CIT-U students, faculty, and staff.', '• Behavioral Intent:'),

          createHeading2('Instrument 3: Qualitative Post-Task Interview Guide'),
          createBullet('1. Which specific feature did you find most valuable during your interaction with the system?'),
          createBullet('2. Did you encounter any confusing layouts, terminology, or navigation roadblocks?'),
          createBullet('3. How effective was the QR scanner / AI search in retrieving the animal profile you were looking for?'),
          createBullet('4. What additional features or operational adjustments would you recommend before university-wide deployment?'),

          // Section 7: Measurable Success Criteria
          createHeading1('7. Measurable Success Criteria & Target Benchmarks'),
          createStyledTable(
            ['Evaluation Parameter', 'Minimum Threshold', 'Target Benchmark', 'Operational Interpretation'],
            [
              ['System Usability Scale (SUS)', '≥ 68.0 (Global Benchmark)', '≥ 75.0 (Grade A - Good to Excellent)', 'System delivers superior usability with minimal cognitive friction.'],
              ['Task Success Rate (TSR)', '≥ 80.0%', '≥ 90.0% Completion Rate', 'Users can independently complete core operational workflows.'],
              ['Mean Time-on-Task (QR Scan)', '≤ 60 seconds', '≤ 25 seconds', 'Collar decoding and lookup is swift during live field sightings.'],
              ['Mean Time-on-Task (Sighting Log)', '≤ 120 seconds', '≤ 60 seconds', 'Reporting stray alerts has negligible user friction.'],
              ['Perceived Usefulness (TAM-PU)', '≥ 3.5 / 5.0', '≥ 4.2 / 5.0 (Positive)', 'Strong stakeholder validation of campus animal welfare utility.'],
              ['Perceived Ease of Use (TAM-PEOU)', '≥ 3.5 / 5.0', '≥ 4.0 / 5.0 (Positive)', 'High learnability across non-technical community users.'],
              ['Behavioral Intention (TAM-BI)', '≥ 70.0% Positive', '≥ 85.0% Positive Intent', 'High likelihood of recurring adoption across CIT-U community.']
            ],
            [2200, 1800, 2500, 2500]
          ),

          // Section 8: Statistical Methodology
          createHeading1('8. Data Analysis & Statistical Methodology'),
          createPara('1. Descriptive Statistics: Calculation of Mean, Standard Deviation (SD), and Median values for each SUS statement and TAM construct dimension.'),
          createPara('2. Scale Reliability: Cronbach’s Alpha coefficient analysis across TAM survey items (Target α ≥ 0.70 for scientific reliability).'),
          createPara('3. Correlation Modeling: Pearson’s correlation coefficient (r) to evaluate the relationship: Perceived Ease of Use (PEOU) → Perceived Usefulness (PU) → Behavioral Intention to Use (BI).'),
          createPara('4. Qualitative Thematic Coding: Inductive categorization of user interview transcripts into themes: UI Ergonomics, Optical Scanner Performance, Mobile Usability, and Feature Enhancements for inclusion in Capstone Chapter 4.'),

          // Section 9: Execution Roadmap
          createHeading1('9. Validation Execution Roadmap'),
          createStyledTable(
            ['Phase', 'Timeline', 'Key Activities', 'Expected Deliverables'],
            [
              ['Phase 1: Preparation', 'Days 1–3', 'Finalize survey instruments, deploy live production build, seed test pet records & QR physical collars', 'Printed/Digital Survey Forms & Validated Production Build'],
              ['Phase 2: Moderated Testing', 'Days 4–8', 'Conduct 30 moderated testing sessions across Cohort A (n=22) and Cohort B (n=8)', 'Completed Task Metric Sheets, SUS & TAM Responses, Audio/Notes'],
              ['Phase 3: Statistical Analysis', 'Days 9–11', 'Compute SUS aggregate scores, TAM construct means, Task Success Rates & Time-on-Task', 'Statistical Charts, SPSS/Python Data Tables & Summary Metrics'],
              ['Phase 4: Capstone Integration', 'Days 12–14', 'Draft Chapter 4 (Results & Discussion), implement critical UX bug fixes', 'Completed Capstone Chapter 4 & Final Defense Presentation Slides']
            ],
            [1800, 1400, 3000, 2800]
          ),

          // Section 10: Adviser Sign-Off
          createHeading1('10. Adviser Consultation & Sign-Off Section'),
          createPara('This validation framework and protocol must be reviewed and signed by the Capstone Adviser prior to executing respondent testing:'),
          createBullet('[  ] Validation Model Approval: Concurrence on hybrid TAM + ISO 9241-11 + SUS methodology.'),
          createBullet('[  ] Respondent Stratification: Approval of N = 30 cohort distribution (22 Community, 8 Staff).'),
          createBullet('[  ] Instrument Review: Verification of 10-item SUS and 12-item TAM survey questionnaires.'),
          createBullet('[  ] Data Privacy Compliance: Assured anonymous handling of participant data under CIT-U ethical standards.'),
          createBullet('[  ] Live Deployment Verification: Production cloud build operational on Vercel and Render.'),

          new Paragraph({ spacing: { before: 300, after: 100 }, children: [] }),

          createStyledTable(
            ['Role', 'Name & Designation', 'Signature', 'Date of Approval'],
            [
              ['Capstone Adviser', '___________________________', '___________________________', '____ / ____ / 2026'],
              ['Department Chair', '___________________________', '___________________________', '____ / ____ / 2026'],
              ['Lead Researcher', 'Clark Yu (Task Force Bruno)', '___________________________', '____ / ____ / 2026']
            ],
            [2200, 2800, 2500, 1500]
          )
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '../docs/Task_Force_Bruno_MVP_Validation_Plan.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document generated successfully at: ${outputPath}`);
}

generateDocx().catch(err => {
  console.error('Error generating document:', err);
  process.exit(1);
});
