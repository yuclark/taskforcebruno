import docx
from docx.shared import Pt, RGBColor

DOC_PATH = "docs/Team2526-sem2-it332-18_WildcatWelfare_SDD-3 (1).docx"

def update_paragraph(p, new_text, bold=None, italic=None, font_name="Arial", font_size=None, color=None):
    p.text = ""
    run = p.add_run(new_text)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic
    if font_name:
        run.font.name = font_name
    if font_size:
        run.font.size = Pt(font_size)
    if color:
        run.font.color.rgb = color
    return run

doc = docx.Document(DOC_PATH)

# Verify key indices before updating
print("P[124]:", doc.paragraphs[124].text.strip())
print("P[164]:", doc.paragraphs[164].text.strip())
print("P[215]:", doc.paragraphs[215].text.strip())
print("P[254]:", doc.paragraphs[254].text.strip())
print("P[298]:", doc.paragraphs[298].text.strip())

# -------------------------------------------------------------
# Module 1.1 Updates (QR Profile Tracking)
# -------------------------------------------------------------
update_paragraph(doc.paragraphs[124], "PetDetailAPIView & PetListAPIView", bold=True)
update_paragraph(doc.paragraphs[125], "Exposes RESTful endpoints (GET /api/pets/, GET /api/pets/<str:pet_id>/) that query the database to retrieve and serve sanitized companion profiles (name, species, sex, collar tag ID, rescue status, care notes) in JSON format.")
update_paragraph(doc.paragraphs[126], "Django REST Framework APIView (Class-Based View)", italic=True)

update_paragraph(doc.paragraphs[127], "PetProfileQueryHandler", bold=True)
update_paragraph(doc.paragraphs[128], "Executes structured queries against the Supabase pets table via the Supabase Python client. Enforces data sanitization, resolves image storage bucket URLs, and formats response payloads for client-side rendering.")
update_paragraph(doc.paragraphs[129], "Python / Supabase Data Access Handler", italic=True)

update_paragraph(doc.paragraphs[130], "PublicPassportAPIView", bold=True)
update_paragraph(doc.paragraphs[131], "Exposes a public read-only endpoint (GET /api/pets/<str:pet_id>/) that delivers sanitized public safety metadata (name, vaccination tier, rabies status, clinic hotline) while strictly filtering out internal clinic notes and restricted administrative audit logs.")
update_paragraph(doc.paragraphs[132], "Django REST Framework Public APIView", italic=True)

# -------------------------------------------------------------
# Module 1.2 Updates (Medical Record Dashboard)
# -------------------------------------------------------------
update_paragraph(doc.paragraphs[164], "LoginView (MDC Authentication Gate)", bold=True)
update_paragraph(doc.paragraphs[165], "Handles the /api/login/ endpoint. Validates staff credentials and institutional email formats (@cit.edu) against the Supabase users table, verifies role permissions (role = 'MDC_STAFF'), and returns authenticated session tokens to guard clinical management routes.")
update_paragraph(doc.paragraphs[166], "Django REST Framework APIView (Authentication Gate)", italic=True)

update_paragraph(doc.paragraphs[167], "MedicalRecordsAPIView & VaccinationLogsAPIView", bold=True)
update_paragraph(doc.paragraphs[168], "Exposes RESTful clinical endpoints (GET/POST /api/medical/<str:pet_id>/, GET/POST /api/vaccinations/<str:pet_id>/) configured to intake and validate routine visit notes, vaccination administration batches, and incident reports from the frontend. Access is gated by authentication permissions to ensure only authorized MDC personnel can mutate clinical records.")
update_paragraph(doc.paragraphs[169], "Django REST Framework APIView (Clinical & Biosecurity Handlers)", italic=True)

update_paragraph(doc.paragraphs[170], "ClinicalBiosecurityService", bold=True)
update_paragraph(doc.paragraphs[171], "Encapsulates business logic for animal health records and biosecurity protocols. Writes new clinical visit logs and vaccination entries to Supabase, updates immunization timestamps, and automatically initializes 14-day bite/scratch observation quarantine tracking records in compliance with Republic Act No. 9482 (Anti-Rabies Act of 2007).")
update_paragraph(doc.paragraphs[172], "Python Business Logic & Biosecurity Module", italic=True)

# -------------------------------------------------------------
# Module 2.1 Updates (Submit and Process Adoption Application)
# -------------------------------------------------------------
update_paragraph(doc.paragraphs[215], "AdoptionApplicationAPIView", bold=True)
update_paragraph(doc.paragraphs[216], "Exposes RESTful API endpoints (POST /api/pets/applications/, GET /api/pets/applications/) configured to receive multi-stage adoption questionnaire payloads from the frontend, parsing inputs into standardized structural records and assigning a default status of \"Pending\".")
update_paragraph(doc.paragraphs[217], "Django REST Framework APIView (Pipeline Submission View)", italic=True)

update_paragraph(doc.paragraphs[218], "AdoptionApplicationDetailAPIView", bold=True)
update_paragraph(doc.paragraphs[219], "Handles administrative triage and state transitions (PATCH /api/pets/applications/<int:application_id>/). Modifies application status records (Approved/Denied) based on staff reviews, executes related state alterations on linked pet registry records, and locks historical audit trails.")
update_paragraph(doc.paragraphs[220], "Django REST Framework APIView (Triage & State Mutation View)", italic=True)

update_paragraph(doc.paragraphs[221], "AdoptionNotificationMailer", bold=True)
update_paragraph(doc.paragraphs[222], "Listens for pipeline status state modifications and triggers asynchronous hooks to the system's SMTP email service, automatically formatting and dispatching approval confirmations or rejection advisories to the adopter's institutional email address.")
update_paragraph(doc.paragraphs[223], "Django Core Mail / SMTP Asynchronous Task Handler", italic=True)

# -------------------------------------------------------------
# Module 2.2 Updates (Donation / Inventory)
# -------------------------------------------------------------
update_paragraph(doc.paragraphs[254], "InventoryAPIView & InventoryDetailAPIView", bold=True)
update_paragraph(doc.paragraphs[255], "Exposes RESTful API endpoints (GET/POST /api/inventory/, PUT/DELETE /api/inventory/<int:item_id>/) to handle supply catalog queries, new asset intake, threshold configurations, and record deletions.")
update_paragraph(doc.paragraphs[256], "Django REST Framework APIView (Supply Endpoints)", italic=True)

update_paragraph(doc.paragraphs[257], "InventoryTransactionHandler", bold=True)
update_paragraph(doc.paragraphs[258], "Processes operational supply mutations (POST /api/inventory/transactions/). Enforces strict numeric type validation (quantities, minimum alert thresholds), categorizes adjustments into discrete physical unit types (kilograms, cans, vials, pieces), and writes immutable audit entries to the inventory_transactions ledger for inflow and outflow tracking.")
update_paragraph(doc.paragraphs[259], "Python Supply Ledger & Validation Module", italic=True)

update_paragraph(doc.paragraphs[260], "InventorySchema", bold=True)
update_paragraph(doc.paragraphs[261], "The structural relational data definition for supply entries. Models operational fields including item_name, category, physical unit_type (kilograms, cans, vials, pieces), quantity, min_threshold, donor_attribution, and expiration_date.")
update_paragraph(doc.paragraphs[262], "Supabase / Relational PostgreSQL Table Schema", italic=True)

# -------------------------------------------------------------
# Module 3.1 Updates (Homepage / Newsfeed)
# -------------------------------------------------------------
update_paragraph(doc.paragraphs[298], "UnifiedNewsfeedAPIView", bold=True)
update_paragraph(doc.paragraphs[299], "The centralized routing view that manages incoming HTTP requests for the campus activity stream (GET /api/newsfeed/), integrating announcements, sighting reports, and community posts. Enforces domain authentication (@cit.edu) and handles moderation endpoints (DELETE /api/newsfeed/action/).")
update_paragraph(doc.paragraphs[300], "Django REST Framework APIView (Stream & Moderation Endpoint)", italic=True)

update_paragraph(doc.paragraphs[301], "NewsfeedInteractionHandler", bold=True)
update_paragraph(doc.paragraphs[302], "Encapsulates social business logic for community interaction endpoints (ToggleLikeAPIView, AddCommentAPIView, CommentActionAPIView). Manages atomic increment/decrement operations for like counters, formats hierarchical comment trees, and sanitizes user-submitted strings before persisting to Supabase.")
update_paragraph(doc.paragraphs[303], "Python / Django Interaction Logic Module", italic=True)

update_paragraph(doc.paragraphs[304], "NewsfeedSchema", bold=True)
update_paragraph(doc.paragraphs[305], "Defines the relational data structure for announcements, animal_sightings, comments, and likes tables, ensuring relational integrity between post content, user attribution IDs, and media attachments.")
update_paragraph(doc.paragraphs[306], "Supabase / Relational PostgreSQL Table Schema", italic=True)

# -------------------------------------------------------------
# Update Table 0 (Change History)
# -------------------------------------------------------------
history_table = doc.tables[0]
for row in history_table.rows:
    if row.cells[0].text.strip() == "3.1":
        row.cells[3].text = (
            "Post-MVP Validation Refactoring: Incorporated empirical findings from N=34 campus evaluation. "
            "Added Public Emergency Pet Passport (unauthenticated QR access), 14-day bite/scratch quarantine telemetry (RA 9482), "
            "1-click sighting intake handoff, printable collar QR generator, dimensional supply logistics (kg/cans/vials), "
            "and interactive user onboarding. Harmonized architectural terminology across all detailed design modules to strictly "
            "reflect Django REST Framework (Class-Based APIViews, Python biosecurity pipelines, and Supabase client data access), "
            "eliminating legacy Node.js/Express and Spring controller references."
        )

OUTPUT_PATH = "docs/Team2526-sem2-it332-18_WildcatWelfare_SDD-3_UPDATED.docx"
doc.save(OUTPUT_PATH)
print("Successfully saved updated SDD to:", OUTPUT_PATH)

# Try saving to the original path as well (if Word is closed)
try:
    doc.save(DOC_PATH)
    print("Also successfully updated original DOC_PATH:", DOC_PATH)
except PermissionError:
    print("Note: Original file is currently open in Microsoft Word. Saved to _UPDATED.docx for immediate access.")
