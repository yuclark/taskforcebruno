# 🐾 Task Force Bruno: Integrated Campus Pet Management System

[
[
[
[

An integrated, enterprise-grade data management ecosystem designed specifically for the **Cebu Institute of Technology – University (CIT-U)** community. **Task Force Bruno** provides digital telemetry tracking, clinical timeline archiving, inventory logistics logging, and predictive lookup systems to monitor, sterilize, protect, and manage resident campus animals and stray allocations.

***

## 🚀 Core Architecture Features

### 1. Master Animal Registry & Analytics Dashboard

- **Segmented Relational Tables:** Separates master listings into three distinct logical streams: *Active Campus Companions*, *Strays Available for Adoption*, and an *Adopted Alumni Companions Registry*.
- **Dynamic Somatic Badges:** Automatically maps status color tokens matching immunization milestones (*Fully Vaccinated*, *Partially Vaccinated*, *Not Vaccinated*) alongside automated incremental stray identity key indexing.
- **Ecosystem Telemetry Indicators:** Features live progress tracking charts processing population control performance parameters (TNR Sterilization Rates) and localized multi-zone hotspot occupancy density configurations in real time.

### 2. Dual-Card QR Viewport & AI Trait Search Engine

- **Card 1 – Hardware Optical Scanner Component:** Provides a direct camera viewfinder canvas pipeline and alternative file upload array matrix decoding matching official `PET-XXXX` or `STRAY-XXXX` QR code profiles via client-side `jsQR` matrix processing loops. Features a terminal system manual override console.
- **Card 2 – AI Predictive Descriptor Matching Component:** Communicates with an internal token phrase text matching backend view. Splits user natural language trait inquiries (e.g., *"ginger coat with white paws found near canteen"*) into matching strings and scores candidates descending by priority affinity metrics, highlighting explicit physical descriptors.
- **Inline Self-Contained Persistence:** Clicking "Load" resolves data queries seamlessly directly inside that specific card slot, allowing desktop or mobile viewport users to maintain tracking context or compare two animal files simultaneously.

### 3. Consolidated Social Streams & Operational Logistics

- **Unified Newsfeed System:** Merges campus announcements, safety bulletins, and user sighting alerts into a centralized timeline, supported by rapid database toggle interactions (likes, recursive comment arrays).
- **Clinical Journals Timelines:** Granular sub-ledgers maintaining long-term records for medical diagnostics logs, treatment logs, and vaccination journal trackers.
- **Warehouse Supply Inventory Hub:** Ledger tracking system managing material allocations, stock balances, and incoming/outgoing warehouse item movements.
- **In-Kind Logistics Notice:** Built-in dashboard notices directing users to coordinate physical assets (collars, food supplies, leashes) directly with the physical operations office.

***

## 🛠️ Technical Stack

### Frontend Application Layer

| Component | Technology |
| :--- | :--- |
| **Framework** | React 18 (Functional Architecture with Hook Patterns) |
| **Styling Engine** | Tailwind CSS (Custom animation keyframes, crimson `#5C0612` & gold `#D4AF37` brand palette) |
| **QR Processing** | `jsQR` (Client-side camera block pixel array decoding) |

### Backend Services Gateway

| Component | Technology |
| :--- | :--- |
| **Framework** | Django 5.x / Django REST Framework (DRF) |
| **Data Serialization** | MultiPart & FormParser endpoints for native binary multi-layer image asset uploads |
| **Search Infrastructure** | Python Regex Tokenizer with multi-field weight priority algorithms |

### Cloud Integration

| Component | Technology |
| :--- | :--- |
| **Database Engine** | Supabase PostgreSQL |
| **Storage** | Supabase Storage Buckets (`petpictures`) for public visual asset links |
| **ORM Layer** | Python Supabase PostgREST Client Library |

***

## 📊 Database Schema

```
                    +----------------------+
                    |       profiles       |
                    +----------------------+
                               |
                    +----------------------+
                    |         pets         |
                    +----------------------+
                     /         |          \
                   /           |            \
 +------------------+  +-------------------+  +------------------+
 | medical_records  |  | vaccination_logs  |  |    pet_images    |
 +------------------+  +-------------------+  +------------------+
```

| Table | Key Attributes | Functional Role |
| :--- | :--- | :--- |
| **`pets`** | `pet_id` (PK, TEXT), `name`, `species`, `breed`, `gender`, `weight`, `vaccination_status`, `spayed_neutered` (BOOLEAN), `found_near`, `description`, `primary_image` | Master index for core biometric parameters, visual metadata links, and physical markers |
| **`medical_records`** | `record_id` (PK, UUID), `pet_id` (FK), `diagnosis`, `treatment`, `veterinarian`, `date_logged` (DATE) | Clinical logging system for illness variables and diagnostics tracking |
| **`vaccination_logs`** | `log_id` (PK, UUID), `pet_id` (FK), `vaccine_name`, `batch_number`, `administered_date` (DATE), `next_due_date` (DATE) | Longitudinal health journal verifying active campus safety immunizations |
| **`inventory`** | `item_id` (PK, INT), `item_name`, `category`, `quantity_in_stock` (INT), `unit_measure` | Supply asset register tracking current medical tools and food stocks |

***

## 🔧 Installation & Setup

### Prerequisites

Ensure the following are installed on your local development machine:

- **Python 3.10+**
- **Node.js 18+**

***

### Backend Setup

**1. Navigate to the backend directory:**

```bash
cd backend
```

**2. Install Python dependencies:**

```bash
pip install -r requirements.txt
```

**3. Create a `.env` file in the `backend/` root directory and configure your Supabase credentials:**

```env
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-public-or-service-role-key"
```

**4. Start the Django development server:**

```bash
python manage.py runserver
```

***

### Frontend Setup

**1. Open a new terminal and navigate to the frontend directory:**

```bash
cd frontend
```

**2. Install Node dependencies:**

```bash
npm install
```

**3. Start the Vite development server:**

```bash
npm run dev
```

**4.** Open your browser and navigate to `http://localhost:5173` to access the Task Force Bruno platform.

***

## 📜 Project Context

| Field | Details |
| :--- | :--- |
| **Institution** | Cebu Institute of Technology – University (CIT-U) |
| **Course Track** | Software Quality Assurance Engineering (SQAE) & Capstone Core |
| **System Status** | ✅ Production Environment Clean |

Developed with dedication by the **Task Force Bruno** project engineering unit to elevate the standard of campus companion care and support animal welfare initiatives at CIT-U.