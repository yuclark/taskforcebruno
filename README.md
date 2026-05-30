```markdown
# 🐾 Task Force Bruno: Integrated Campus Pet Management System

[![Tech Stack: React](https://img.shields.io/badge/Frontend-React%2018-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tech Stack: Django](https://img.shields.io/badge/Backend-Django%20%2F%20DRF-green?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
[![Database: Supabase](https://img.shields.io/badge/Database-Supabase%20%2F%20PostgreSQL-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Styling: Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

An integrated, enterprise-grade data management ecosystem designed specifically for the **Cebu Institute of Technology – University (CIT-U)** community. **Task Force Bruno** provides digital telemetry tracking, clinical timeline archiving, inventory logistics logging, and predictive lookup systems to monitor, sterilize, protect, and manage resident campus animals and stray allocations.

---

## 🚀 Core Architecture Features

### 1. Master Animal Registry & Analytics Dashboard
*   **Segmented Relational Tables:** Separates master listings into three distinct logical streams: *Active Campus Companions*, *Strays Available for Adoption*, and an *Adopted Alumni Companions Registry*.
*   **Dynamic Somatic Badges:** Automatically maps status color tokens matching immunization milestones (*Fully Vaccinated*, *Partially Vaccinated*, *Not Vaccinated*) alongside automated incremental stray identity key indexing.
*   **Ecosystem Telemetry Indicators:** Features live progress tracking charts processing population control performance parameters (TNR Sterilization Rates) and localized multi-zone hotspot occupancy density configurations in real time.

### 2. Dual-Card QR Viewport & AI Trait Search Engine
*   **Card 1 (Hardware Optical Scanner Component):** Provides a direct camera viewfinder canvas pipeline and alternative file upload array matrix decoding matching official `PET-XXXX` or `STRAY-XXXX` QR code profiles via client-side `jsQR` matrix processing loops. Features a terminal system manual override console.
*   **Card 2 (AI Predictive Descriptor Matching Component):** Communicates with an internal token phrase text matching backend view. Splits user natural language trait inquiries (e.g., *"ginger coat with white paws found near canteen"*) into matching strings and scores candidates descending by priority affinity metrics, highlighting explicit physical descriptors.
*   **Inline Self-Contained Persistence:** Clicking "Load" resolves data queries seamlessly directly inside that specific card slot, allowing desktop or mobile viewport users to maintain tracking context or compare two animal files at the same time.

### 3. Consolidated Social Streams & Operational Logistics
*   **Unified Newsfeed Systems:** Merges campus announcements, safety bulletins, and user sighting alerts into a centralized timeline, supported by rapid database toggle interactions (likes, recursive comment arrays).
*   **Clinical Journals Timelines:** Granular sub-ledgers maintaining long-term records for medical diagnostics logs, treatment logs, and vaccination journal trackers.
*   **Warehouse Supply Inventory Hub:** Ledger tracking system managing material allocations, stock balances, and incoming/outgoing warehouse item movements.
*   **In-Kind Logistics Notice:** Built-in dashboard notices directing users to coordinate physical assets (collars, food supplies, leashes) directly with the physical operations office.

---

## 🛠️ Technical Stack Specifications

### Frontend Application Layer
*   **Framework:** React 18 (Functional Architecture with Hook Patterns)
*   **Styling Engine:** Tailwind CSS (Custom animation keyframes, high-contrast crimson `#5C0612` and gold `#D4AF37` brand alignment matrix)
*   **Matrix Processing:** `jsQR` (Client-side camera block pixel array decoding)

### Backend Services Gateway
*   **Framework:** Django 5.x / Django REST Framework (DRF)
*   **Data Serialization Engine:** MultiPart & FormParser endpoints handling native binary multi-layer image asset uploads securely.
*   **Search Infrastructure:** Python Regex Tokenizer calculating multi-field weight priority algorithms.

### Cloud Integration Matrix
*   **Database Engine:** Supabase PostgreSQL
*   **Storage Tiers:** Supabase Storage Buckets (`petpictures`) storing encrypted public layout visual links.
*   **Relational Database Mapping Layer:** Python Supabase PostgREST Client Library routing directly to database tables.

---

## 📊 Database Schema Architecture


```

```
                    +----------------------+
                    |       profiles       |
                    +----------------------+
                               |
                               |
                               | 
                    +----------------------+
                    |         pets         |
                    +----------------------+
                     /         |          \
                   /           |            \
                 / (1)         | (1)          \ (1)
               /               |                \
             / (N)             | (N)              \ (N)
 +------------------+  +-------------------+  +------------------+
 | medical_records  |  | vaccination_logs  |  |    pet_images    |
 +------------------+  +-------------------+  +------------------+

```

```

| Database Table Name | Core Target Primary Attributes & Data Type Constraints | Functional Purpose / System Role |
| :--- | :--- | :--- |
| **`pets`** | `pet_id` (PK, TEXT), `name` (TEXT), `species` (TEXT), `breed` (TEXT), `gender` (TEXT), `weight` (TEXT), `vaccination_status` (TEXT), `spayed_neutered` (BOOLEAN), `found_near` (TEXT), `description` (TEXT), `primary_image` (TEXT) | Master index holding core biometric parameters, visual metadata links, and physical markers. |
| **`medical_records`** | `record_id` (PK, UUID), `pet_id` (FK, TEXT), `diagnosis` (TEXT), `treatment` (TEXT), `veterinarian` (TEXT), `date_logged` (DATE) | Clinical logging system mapping illness variables and diagnostics tracking profiles. |
| **`vaccination_logs`** | `log_id` (PK, UUID), `pet_id` (FK, TEXT), `vaccine_name` (TEXT), `batch_number` (TEXT), `administered_date` (DATE), `next_due_date` (DATE) | Longitudinal health journal verifying active campus safety immunizations. |
| **`inventory`** | `item_id` (PK, INT), `item_name` (TEXT), `category` (TEXT), `quantity_in_stock` (INT), `unit_measure` (TEXT) | Supply asset register tracking current medical tools or food stocks. |

---

## 🔧 Installation & Environment Setup

### 1. Prerequisites Configuration
Ensure you have **Python 3.10+** and **Node.js 18+** installed locally on your development system.

### 2. Backend Environment Settings
Navigate into your system server subfolder:
```bash
cd backend

```

Install the designated framework python dependencies:

```bash
pip install -r requirements.txt

```

Create a `.env` file in the root backend configuration directory to hook up your database routes safely:

```env
SUPABASE_URL="[https://your-supabase-project.supabase.co](https://your-supabase-project.supabase.co)"
SUPABASE_KEY="your-supabase-anon-public-or-service-role-key"

```

Execute the server instance runtime engine:

```bash
python manage.py runserver

```

### 3. Frontend Client Configuration

Open a separate terminal window and navigate into your client-side folder path:

```bash
cd frontend

```

Install the package tracking blocks out of the lock configuration parameters:

```bash
npm install

```

Start the local user interface web testing workspace:

```bash
npm run dev

```

Open your browser and direct the connection view window parameters to `http://localhost:5173` (or your configured Vite/React local port) to interact with the Task Force Bruno platform!

---

## 📜 Capstone Development Team / Project Context

* **Institution:** Cebu Institute of Technology – University (CIT-U)
* **Course Assignment Node:** Software Quality Assurance Engineering (SQAE) & Capstone Core Track
* **System Integrity Status:** Production Environment Clean

---

*Developed with dedication to elevate the standard of campus companion care and support animal welfare initiatives.*

```

```
