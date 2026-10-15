import zlib
import base64
import requests
import os

def render_kroki(puml_code, out_png, out_puml):
    with open(out_puml, "w", encoding="utf-8") as f:
        f.write(puml_code)
    
    compressed = zlib.compress(puml_code.encode("utf-8"), 9)
    encoded = base64.urlsafe_b64encode(compressed).decode("ascii")
    png_url = f"https://kroki.io/plantuml/png/{encoded}"
    svg_url = f"https://kroki.io/plantuml/svg/{encoded}"
    
    resp = requests.get(png_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    if resp.status_code == 200:
        with open(out_png, "wb") as f:
            f.write(resp.content)
        print(f"Successfully rendered {out_png} ({len(resp.content)} bytes)")
        return svg_url
    else:
        print(f"Failed to render {out_png}: {resp.status_code} - {resp.text}")
        return None

# ==========================================
# 1. COLORFUL CLASS DIAGRAM (MODULE 3.1)
# ==========================================
class_puml = """@startuml
skinparam backgroundColor #F8FAFC
skinparam shadowing false
skinparam roundcorner 12
skinparam handwritten false
skinparam defaultFontName "Segoe UI"

skinparam class {
    BackgroundColor white
    ArrowColor #2563EB
    BorderColor #64748B
    BorderThickness 1.5
    FontSize 12
}

skinparam package {
    BackgroundColor #F1F5F9
    BorderColor #64748B
    BorderThickness 1.5
    FontColor #0F172A
    FontStyle bold
}

package "Frontend Presentation Layer (React 19 / Vite)" #EFF6FF {
    class NewsfeedViewComponent <<React Component>> #DBEAFE {
        - feedItems: UnifiedFeedItem[]
        - activeFilter: string
        - searchQuery: string
        - currentUserEmail: string
        - isSubmittingComment: boolean
        --
        + fetchUnifiedNewsfeed(): Promise<void>
        + handleToggleLike(feedId: string): Promise<void>
        + handleAddComment(feedId: string, text: string): Promise<void>
        + handleDeleteComment(commentId: number): Promise<void>
        + renderFeedCards(): JSX.Element
    }

    class SightingTriageViewComponent <<React Component>> #DBEAFE {
        - pendingSightings: SightingReport[]
        - selectedSighting: SightingReport
        - isTriageProcessing: boolean
        --
        + fetchPendingSightings(): Promise<void>
        + handleVerifySighting(sightingId: number): Promise<void>
        + handleAdmitAndIntakeStray(sighting: SightingReport): void
        + renderTriageGrid(): JSX.Element
    }

    class ReportSightingViewComponent <<React Component>> #DBEAFE {
        - campusLandmarks: Landmark[]
        - selectedLandmark: string
        - animalType: string
        - distinctFeatures: string
        - isEmergencyAlert: boolean
        - photoFile: File
        --
        + handleLandmarkSelect(landmark: string): void
        + handlePhotoUpload(e: ChangeEvent): void
        + handleSubmitSighting(e: FormEvent): Promise<void>
    }

    class UserGuideModalComponent <<React Modal>> #DBEAFE {
        - activeStepIndex: number
        - isOpen: boolean
        --
        + nextStep(): void
        + prevStep(): void
        + renderGuideStep(): JSX.Element
    }
}

package "Backend REST API Layer (Django REST Framework)" #ECFDF5 {
    class UnifiedNewsfeedAPIView <<APIView>> #D1FAE5 {
        + permission_classes: [IsAuthenticatedOrReadOnly]
        --
        + get(request: Request): Response
    }

    class ToggleLikeAPIView <<APIView>> #D1FAE5 {
        + permission_classes: [IsAuthenticated]
        --
        + post(request: Request): Response
    }

    class AddCommentAPIView <<APIView>> #D1FAE5 {
        + permission_classes: [IsAuthenticated]
        --
        + post(request: Request): Response
    }

    class CampusAnnouncementAPIView <<APIView>> #D1FAE5 {
        + parser_classes: [MultiPartParser, FormParser]
        --
        + get(request: Request): Response
        + post(request: Request): Response
    }

    class NewsfeedInteractionHandler <<Python Module / Service>> #FEF08A {
        + aggregate_feed_streams(): list
        + toggle_feed_like(feed_id: str, user_email: str): dict
        + append_feed_comment(feed_id: str, user_email: str, text: str): dict
        + moderate_flagged_content(feed_id: str, staff_id: UUID): boolean
    }
}

package "Persistence Layer (Supabase PostgreSQL / Tables)" #FAF5FF {
    class CampusAnnouncement <<Database Table / Schema>> #FCE7F3 {
        + announcement_id: Serial [PK]
        + title: Varchar(200)
        + content: Text
        + author_email: Varchar(254)
        + image_url: Varchar(500)
        + created_at: TimestampTz
    }

    class AnimalSighting <<Database Table / Schema>> #EDE9FE {
        + sighting_id: Serial [PK]
        + animal_type: Varchar(50)
        + location_details: Varchar(200)
        + distinct_features: Text
        + status: Varchar(50)
        + reporter_email: Varchar(254)
        + image_url: Varchar(500)
        + logged_at: TimestampTz
    }

    class FeedLike <<Database Table / Schema>> #FEF3C7 {
        + id: Serial [PK]
        + feed_id: Varchar(100)
        + user_email: Varchar(254)
        + created_at: TimestampTz
    }

    class FeedComment <<Database Table / Schema>> #FEF3C7 {
        + comment_id: Serial [PK]
        + feed_id: Varchar(100)
        + user_email: Varchar(254)
        + comment_text: Text
        + created_at: TimestampTz
    }

    class Pet <<Database Table / Schema>> #F3E8FF {
        + pet_id: Serial [PK]
        + name: Varchar(100)
        + species: Varchar(50)
        + breed: Varchar(100)
        + adoption_status: Varchar(50)
        + primary_image: Varchar(500)
        + created_at: TimestampTz
    }
}

NewsfeedViewComponent ..[#2563EB]> UnifiedNewsfeedAPIView : "<color:#1D4ED8><b>HTTP GET /api/newsfeed/</b></color>"
NewsfeedViewComponent ..[#2563EB]> ToggleLikeAPIView : "<color:#1D4ED8><b>HTTP POST /api/newsfeed/like/</b></color>"
NewsfeedViewComponent ..[#2563EB]> AddCommentAPIView : "<color:#1D4ED8><b>HTTP POST /api/newsfeed/comment/</b></color>"
ReportSightingViewComponent ..[#2563EB]> AnimalSighting : "HTTP POST /api/sightings/"

UnifiedNewsfeedAPIView --[#D97706]> NewsfeedInteractionHandler : "Delegates multi-stream aggregation"
ToggleLikeAPIView --[#D97706]> NewsfeedInteractionHandler : "Delegates atomic like toggle"
AddCommentAPIView --[#D97706]> NewsfeedInteractionHandler : "Sanitizes and persists comment"

NewsfeedInteractionHandler --[#7C3AED]> AnimalSighting : "Reads verified sightings"
NewsfeedInteractionHandler --[#7C3AED]> CampusAnnouncement : "Reads official bulletins"
NewsfeedInteractionHandler --[#7C3AED]> Pet : "Reads companion introductions"
NewsfeedInteractionHandler --[#D97706]> FeedLike : "Mutates like tuples"
NewsfeedInteractionHandler --[#D97706]> FeedComment : "Appends social comments"

SightingTriageViewComponent ..[#059669]> Pet : "1-Click Intake Hand-off"
@enduml"""

# ==========================================
# 2. COLORFUL SEQUENCE DIAGRAM (MODULE 3.1)
# ==========================================
sequence_puml = """@startuml
autonumber
skinparam backgroundColor #F8FAFC
skinparam shadowing false
skinparam roundcorner 10
skinparam sequenceMessageAlign center
skinparam defaultFontName "Segoe UI"

skinparam sequence {
    ArrowColor #2563EB
    ArrowThickness 1.5
    LifeLineBorderColor #3B82F6
    LifeLineBackgroundColor #EFF6FF
    ParticipantBorderThickness 1.5
    ActorBorderThickness 1.5
    GroupBorderColor #64748B
    GroupBackgroundColor #F1F5F9
    GroupHeaderFontColor #0F172A
    DividerBackgroundColor #E2E8F0
    DividerFontColor #0F172A
    DividerBorderColor #94A3B8
}

actor "CIT-U Student / User" as User #BFDBFE
actor "MDC Welfare Officer" as Staff #FED7AA

participant "Vite/React Frontend\\n(NewsfeedView & SightingTriage)" as Frontend #DBEAFE
participant "Django REST API\\n(Newsfeed Endpoints)" as API #D1FAE5
participant "Newsfeed Interaction\\nHandler" as Handler #FEF08A
participant "Supabase PostgreSQL\\n(Multi-Stream Tables)" as DB #EDE9FE
participant "Supabase Storage\\n(Image Buckets)" as Storage #FCE7F3

== <color:#1E40AF><b>Phase 1: Multi-Stream Activity Feed Aggregation</b></color> ==
User -> Frontend: Navigate to Homepage / Newsfeed Timeline
activate Frontend #DBEAFE
Frontend -> API: <color:#1D4ED8><b>GET /api/newsfeed/?email=student@cit.edu</b></color>
activate API #D1FAE5

API -> Handler: <color:#B45309><b>aggregate_feed_streams(user_email="student@cit.edu")</b></color>
activate Handler #FEF08A

group <color:#7C3AED><b>Supabase Parallel Stream Queries</b></color>
    Handler -> DB: SELECT * FROM campus_announcements ORDER BY created_at DESC
    activate DB #EDE9FE
    DB --> Handler: Return official administrative bulletins
    deactivate DB

    Handler -> DB: SELECT * FROM animal_sightings WHERE status != 'Resolved'
    activate DB #EDE9FE
    DB --> Handler: Return verified/emergency sighting reports
    deactivate DB

    Handler -> DB: SELECT * FROM pets ORDER BY created_at DESC LIMIT 10
    activate DB #EDE9FE
    DB --> Handler: Return newest companion admissions
    deactivate DB

    Handler -> DB: SELECT * FROM feed_likes
    activate DB #EDE9FE
    DB --> Handler: Return social like registers
    deactivate DB

    Handler -> DB: SELECT * FROM feed_comments ORDER BY created_at ASC
    activate DB #EDE9FE
    DB --> Handler: Return comment threads
    deactivate DB
end

Handler -> Handler: Compile unified timeline, inject likes_count, is_liked_by_me, and comment subtrees
Handler --> API: UnifiedTimelineArray(sorted by timestamp DESC)
deactivate Handler

API --> Frontend: <color:#16A34A><b>200 OK JSON (Combined bulletins, sightings, companions)</b></color>
deactivate API
Frontend --> User: Render social timeline with interaction buttons & badge markers
deactivate Frontend

== <color:#C2410C><b>Phase 2: Social Reaction & Comment Interaction</b></color> ==
User -> Frontend: Click "Heart / Like" icon on Sighting Post (feed_id: "sighting_42")
activate Frontend #DBEAFE
Frontend -> API: <color:#1D4ED8><b>POST /api/newsfeed/like/</b></color>\\n{ feed_id: "sighting_42", user_email: "student@cit.edu" }
activate API #D1FAE5

API -> Handler: <color:#B45309><b>toggle_feed_like("sighting_42", "student@cit.edu")</b></color>
activate Handler #FEF08A

Handler -> DB: SELECT * FROM feed_likes WHERE feed_id = 'sighting_42' AND user_email = 'student@cit.edu'
activate DB #EDE9FE
DB --> Handler: Empty set (User has not yet liked)
deactivate DB

Handler -> DB: <color:#7C3AED><b>INSERT INTO feed_likes (feed_id, user_email, created_at)</b></color>
activate DB #EDE9FE
DB --> Handler: 201 Created (Like record stored)
deactivate DB

Handler --> API: { liked: true, likes_count: 8 }
deactivate Handler
API --> Frontend: 200 OK JSON { liked: true, likes_count: 8 }
deactivate API

Frontend --> User: Fill heart icon with RED badge and increment like count to 8
deactivate Frontend

== <color:#059669><b>Phase 3: Sighting Moderation & 1-Click Intake Hand-off</b></color> ==
Staff -> Frontend: Access "Sighting Triage" dashboard
activate Frontend #DBEAFE
Staff -> Frontend: Inspect Landmark: "NGE Building Grounds", Sighting #42
Staff -> Frontend: Click "1-Click Admit & Intake Stray"
Frontend --> Staff: Auto-populate AddNewPet modal with landmark, description, and photo URL
Staff -> Frontend: Confirm admission & create official Pet Registry entry
deactivate Frontend
@enduml"""

# ==========================================
# 3. COLORFUL ERD DATA DESIGN (MODULE 3.1)
# ==========================================
erd_puml = """@startuml
skinparam backgroundColor #F8FAFC
skinparam shadowing false
skinparam roundcorner 10
skinparam defaultFontName "Segoe UI"

skinparam entity {
    BorderColor #64748B
    BorderThickness 1.5
    FontSize 12
    FontStyle bold
    HeaderBackgroundColor #E2E8F0
}

entity "campus_announcements" as announcements #FCE7F3 {
    * announcement_id : serial <<PK>>
    --
    * title : varchar(200)
    * content : text
    * <color:#DB2777>author_email : varchar(254)</color>
    image_url : varchar(500)
    * created_at : timestamptz
}

entity "animal_sightings" as sightings #EDE9FE {
    * sighting_id : serial <<PK>>
    --
    * animal_type : varchar(50)
    * <color:#7C3AED>location_details : varchar(200)</color>
    distinct_features : text
    * <color:#D97706>status : varchar(50)</color>
    * reporter_email : varchar(254)
    image_url : varchar(500)
    * logged_at : timestamptz
}

entity "pets" as pets #F3E8FF {
    * pet_id : serial <<PK>>
    --
    * name : varchar(100)
    * species : varchar(50)
    breed : varchar(100)
    * <color:#7C3AED>adoption_status : varchar(50)</color>
    found_near : varchar(150)
    primary_image : varchar(500)
    about_text : text
    created_at : timestamptz
}

entity "feed_likes" as likes #FEF3C7 {
    * id : serial <<PK>>
    --
    * <color:#2563EB>feed_id : varchar(100)</color>
    * <color:#2563EB>user_email : varchar(254)</color>
    * created_at : timestamptz
}

entity "feed_comments" as comments #FEF3C7 {
    * comment_id : serial <<PK>>
    --
    * <color:#2563EB>feed_id : varchar(100)</color>
    * <color:#2563EB>user_email : varchar(254)</color>
    * comment_text : text
    * created_at : timestamptz
}

entity "auth_user" as users #DBEAFE {
    * id : uuid <<PK>>
    --
    * email : varchar(254) <<UQ>>
    username : varchar(150)
    <color:#2563EB>is_staff : boolean</color>
}

users ||--[#2563EB]o{ likes : "user_email\\n(authorizes reaction)"
users ||--[#2563EB]o{ comments : "user_email\\n(posts comment)"
users ||--[#DB2777]o{ announcements : "author_email\\n(publishes official bulletin)"
users ||--[#7C3AED]o{ sightings : "reporter_email\\n(submits sighting)"

sightings ||--[#D97706]o{ likes : "feed_id\\n(sighting reactions)"
announcements ||--[#D97706]o{ likes : "feed_id\\n(bulletin reactions)"
pets ||--[#D97706]o{ likes : "feed_id\\n(companion reactions)"

sightings ||--[#D97706]o{ comments : "feed_id\\n(sighting comments)"
announcements ||--[#D97706]o{ comments : "feed_id\\n(bulletin comments)"
pets ||--[#D97706]o{ comments : "feed_id\\n(companion comments)"
@enduml"""

svg_class = render_kroki(class_puml, "docs/newsfeed_class_diagram_colorful.png", "docs/newsfeed_class_diagram_colorful.puml")
svg_seq = render_kroki(sequence_puml, "docs/newsfeed_sequence_diagram_colorful.png", "docs/newsfeed_sequence_diagram_colorful.puml")
svg_erd = render_kroki(erd_puml, "docs/newsfeed_erd_diagram_colorful.png", "docs/newsfeed_erd_diagram_colorful.puml")

print("All Module 3.1 diagrams rendered!")
print("SVG Class:", svg_class)
print("SVG Seq:", svg_seq)
print("SVG ERD:", svg_erd)
