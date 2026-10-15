# 📋 Task Force Bruno: MVP Validation Highlights and Findings
**Institutional Affiliation:** Cebu Institute of Technology – University (CIT-U)  
**Department:** College of Computer Studies • Department of Information Technology  
**Project:** Task Force Bruno (Integrated Campus Pet Management System)  
**Track:** Capstone Project 2: Research & System Validation  
**Total Validated Sample:** $N = 34$ Completed Responses  
**Validation Period:** September 9–13, 2026  

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Respondent Demographics and Device Distribution](#2-respondent-demographics-and-device-distribution)
3. [Quantitative Evaluation Results](#3-quantitative-evaluation-results)
4. [Qualitative Feedback Analysis and User Themes](#4-qualitative-feedback-analysis-and-user-themes)
   - [Theme 1: Positive Aspects and Strengths to Retain](#theme-1-positive-aspects-and-strengths-to-retain)
   - [Theme 2: Identified Usability Roadblocks and Technical Issues](#theme-2-identified-usability-roadblocks-and-technical-issues)
   - [Theme 3: User Suggestions and Missing Capabilities](#theme-3-user-suggestions-and-missing-capabilities)
5. [Pre-Implementation Action Plan and Engineering Roadmap](#5-pre-implementation-action-plan-and-engineering-roadmap)
6. [Conclusion](#6-conclusion)

---

## 1. Executive Summary

This report summarizes the empirical findings and qualitative stakeholder insights obtained during the Minimum Viable Product (MVP) validation of **Task Force Bruno: Integrated Campus Pet Management System** at Cebu Institute of Technology – University (CIT-U). Validation was conducted between September 9 and September 13, 2026, using an online structured instrument administered to campus stakeholders following interactive testing sessions.

A total of **$N = 34$ valid responses** were gathered, comprising 33 students and 1 faculty subject matter expert (SME). Key findings include:

- **Strong Overall Utility and Aesthetic Appreciation:** Respondents rated the system's ability to address campus stray challenges at **$4.31 / 5.0$** (PU5) and commended the official CIT-U maroon and gold visual branding at **$4.39 / 5.0$** (PEOU3), the highest-rated interface element.
- **High Behavioral Intention to Adopt:** Stakeholders expressed solid intention to actively use the system upon deployment (**$4.24 / 5.0$**, BI1) and enthusiastically recommend it to peers and advocates (**$4.26 / 5.0$**, BI2). Overall experience satisfaction averaged **$4.03 / 5.0$** (SAT1).
- **Usability Benchmark (SUS):** The 4-item System Usability Scale benchmark produced an average composite score of **$62.32 / 100$**. While willingness to use frequently was high (**$4.26 / 5.0$**), users identified specific friction points in initial authentication and mobile layout density that require refinement.
- **Actionable Feedback:** Users requested an interactive campus map-pinning tool for stray locations, urgent/emergency reporting tags for injured animals, guided onboarding for first-time users, and camera permission optimizations on older smartphones.

---

## 2. Respondent Demographics and Device Distribution

All 34 participants consented to the evaluation protocol. Testing occurred across diverse mobile and desktop hardware configurations:

| Demographic Dimension | Category / Option | Count ($n$) | Percentage (%) |
| :--- | :--- | :--- | :--- |
| **Primary Stakeholder Role** | CIT-U Student / General Citizen | 33 | 97.1% |
| | CIT-U Faculty / SME | 1 | 2.9% |
| **Primary Device Used** | Desktop / Web Browser | 15 | 44.1% |
| | Smartphone (Android) | 12 | 35.3% |
| | Smartphone (iPhone / iOS) | 7 | 20.6% |
| **Baseline Pet Welfare Involvement** | Familiarity with Campus Strays (Q7) | Mean: **3.44 / 5.0** | SD: 0.89 |

---

## 3. Quantitative Evaluation Results

Survey statements were evaluated using a standard 5-point Likert scale ($1 = \text{Strongly Disagree}$, $5 = \text{Strongly Agree}$):

| Construct | Item Code | Questionnaire Item Description | Mean | Std. Dev. |
| :--- | :--- | :--- | :--- | :--- |
| **Perceived Usefulness (PU)** | PU1 | Sighting form captures critical rescue details (photo, landmark) | **4.12** | 0.78 |
| | PU2 | Directory differentiates Residents vs. Strays with live badges | **4.18** | 0.81 |
| | PU3 | 14-day bite/scratch observation quarantine alerts (RA 9482) | **4.12** | 0.91 |
| | PU4 | Structured coordination platform superior to Facebook groups | **4.09** | 0.80 |
| | PU5 | Addresses urgent animal welfare & stray challenges at CIT-U | **4.31** | 0.82 |
| **Perceived Ease of Use (PEOU)** | PEOU1 | Interface hierarchy and navigation intuitive without a manual | **4.06** | 0.90 |
| | PEOU2 | Input forms straightforward with clear validation cues | **4.12** | 0.89 |
| | PEOU3 | Official CIT-U maroon/gold branding, spacing, and SVG icons | **4.39** | 0.83 |
| | PEOU4 | Maintains active session smoothly without unexpected logouts | **4.24** | 0.87 |
| **Technical Capabilities** | TECH1 | Collar QR scanner camera viewfinder and image decoder | **4.00** | 0.82 |
| | TECH1-B | Public Pet Passport accessible without mandatory login | **4.07** | 0.90 |
| | TECH2 | AI NLP trait search accurately matches physical descriptors | **4.00** | 0.88 |
| | TECH3 | Responsive adaptation across mobile phones and desktop screens | **4.17** | 0.76 |
| **System Performance** | PERF1 | Application loaded screens smoothly without frustrating latency | **4.18** | 0.80 |
| | PERF2 | Operated reliably without crashes or unhandled database errors | **4.09** | 0.93 |
| **Usability Scale (SUS)** | SUS-B1 | Desire to use Task Force Bruno frequently for campus pets (+) | **4.26** | 0.83 |
| | SUS-B2 | Found the system unnecessarily complex or difficult (-) | **2.76** | 1.28 |
| | SUS-B3 | Felt confident navigating and using system features (+) | **3.76** | 0.96 |
| | SUS-B4 | Needed to learn too many things or ask for help (-) | **3.29** | 1.29 |
| **Staff Modules (Staff Only)** | STF1 | 1-Click Sighting-to-Intake direct admission workflow | **5.00** | 0.00 |
| | STF2 | Inventory tracking by genuine physical units (kg, cans, vials) | **5.00** | 0.00 |
| | STF3 | Integrated high-res collar QR tag print generator | **5.00** | 0.00 |
| **Satisfaction & Intention** | SAT1 | Overall satisfaction with experience using Task Force Bruno | **4.03** | 0.76 |
| | BI1 | Intend to use upon full deployment for campus companions | **4.24** | 0.89 |
| | BI2 | Enthusiastically recommend to fellow students and advocates | **4.26** | 0.83 |

---

## 4. Qualitative Feedback Analysis and User Themes

### Theme 1: Positive Aspects and Strengths to Retain
- **Institutional Branding and Visual Identity:** Multiple respondents praised the visual presentation, noting that it felt authentic to CIT-U. As stated by Phoebe Jelaine Macarulay:  
  > *"Navigation, access, and switching sections are easy and not hassle. The wildcat spirit is definitely consistent and evident throughout the experience."*
- **Professionalism and Urgency:** Users noted that the interface communicates institutional readiness. Joel Ramirez commented:  
  > *"Genuinely amazing work... the website alone genuinely screams professionalism, alertness, and accessibility which is genuinely the crucial thing for this service app. Props to the engineering team definitely!"*
- **Essential Campus Service:** Jamilla Cassandra Nocete noted that having a unified tool is *"very useful and essential especially for the campus."*

### Theme 2: Identified Usability Roadblocks and Technical Issues
- **Account Creation and Login Friction:** A few users experienced confusion during initial authentication. Carmela Grace Andres reported: *"I had a hard time logging in, at first it won't recognize my account even after creating one."* Mary Claire Ramas similarly noted struggling to log in immediately after registration.
- **Mobile Viewport and Keyboard Obstruction:** On smaller mobile viewports, input field positioning caused occasional overlap. Gillian Altizo observed: *"The keyboard covers the password section(?) I can't really see if the password I thought I typed in reflected agad."*
- **Hardware Camera Permissions on Mobile:** John Mikko Rosito noted: *"When trying to submit a report on a mobile device, the camera integration sometimes freezes or fails to prompt for the necessary hardware permissions. It would be highly beneficial to debug the camera loading process and ensure a clear, manual file-upload fallback is immediately available."*
- **Feature Density on Mobile Screens:** Mary Laizelle Dalmero highlighted that while desktop navigation was spacious, the mobile view felt feature-dense and required clearer visual grouping.

### Theme 3: User Suggestions and Missing Capabilities
- **Interactive Campus Map Pinning:** The most frequent functional suggestion was visual map localization. Hazel Dianne Sibuyan recommended: *"It would be helpful to have a map or exact campus location showing where each cat or dog is usually found... profile could also include their usual feeding area."* John Mikko Rosito similarly suggested an integrated campus map-pinning tool for stray sighting locations.
- **Emergency / Urgent Incident Tag:** Hazel Dianne Sibuyan suggested: *"Adding an emergency or urgent report option for animals that are injured, sick, lost, or in danger, and providing basic information on what students should do."*
- **Donation and Volunteer Section:** Jamilla Cassandra Nocete and Hanzley James Sibuyan recommended adding a module where students can see animal caretaking activities or contribute food donations.
- **First-Time User Guide / Interactive Tutorial:** Justine Kate Purisima and Shena Quiño suggested adding a brief step-by-step onboarding guide or "How it works" popup for new users.

---

## 5. Pre-Implementation Action Plan and Engineering Roadmap

| Priority Tier | Identified Problem Area | User Feedback Reference | Planned Engineering Solution |
| :--- | :--- | :--- | :--- |
| **High (Sprint 1)** | Login / Registration Feedback & Keyboard Overlap | Reported by Carmela Andres, Mary Claire Ramas, and Gillian Altizo. | Add explicit toast notifications upon registration success; apply padding to prevent keyboard clipping on mobile. |
| **High (Sprint 1)** | Mobile Camera Permission & Fallback | Reported by John Mikko Rosito (camera freezing on older Android devices). | Implement a clear error catch block with a prominent "Upload Photo from Gallery" fallback button if camera access is denied. |
| **Medium (Sprint 2)** | Campus Landmark Dropdown & Sighting Maps | Suggested by Hazel Dianne Sibuyan and John Mikko Rosito. | Add pre-selected CIT-U landmark tags (Canteen, NGE, Gym, Academic Quad) and map indicators to sighting reports. |
| **Medium (Sprint 2)** | First-Time User Walkthrough Guide | Suggested by Justine Kate Purisima and Shena Quiño. | Deploy an interactive "How to Use" onboarding modal accessible from the navbar. |
| **Low (Sprint 3)** | Community Volunteer & Donation Portal | Suggested by Jamilla Nocete and Hanzley Sibuyan. | Expand Supply Logistics to allow community members to log in-kind pet food and medical donations. |

> **Longitudinal Testing Commitment:** In Question 18, **50.0% of respondents (17 out of 34 participants)** formally agreed to be re-contacted to evaluate the final production release once these sprint items are implemented.

---

## 6. Conclusion

The MVP validation study confirms that **Task Force Bruno** fulfills a vital operational and safety need for Cebu Institute of Technology – University. With strong ratings across Perceived Usefulness (4.31/5.0), visual identity (4.39/5.0), and endorsement intention (4.26/5.0), campus stakeholders demonstrated genuine enthusiasm for adopting the platform. By executing the prioritized sprint items—specifically stabilizing mobile login cues, camera fallbacks, and adding landmark location tags—the system will achieve full production maturity ready for Capstone 2 defense and campus deployment.

---

<div align="center">

**Task Force Bruno Capstone Research Team**  
*Department of Information Technology • Cebu Institute of Technology – University*

</div>
