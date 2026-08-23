# 🐾 Task Force Bruno: Integrated Campus Pet Management System

<div align="center">

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.15-A30000?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

<br />

**A modern, full-stack digital telemetry, clinical archiving, inventory logistics, and adoption management platform engineered specifically for the Cebu Institute of Technology – University (CIT-U) community.**

[Features](#-key-features--capabilities) • [System Architecture](#-system-architecture) • [Database Schema](#-database-schema) • [API Directory](#-api-endpoint-reference) • [Getting Started](#-installation--setup) • [Security](#-security--access-control)

---

</div>

## 📌 Table of Contents

- [Overview & Mission](#-overview--mission)
- [Key Features & Capabilities](#-key-features--capabilities)
  - [1. Role-Based Access Portals](#1-role-based-access-portals)
  - [2. Master Pet Registry & Ecosystem Telemetry](#2-master-pet-registry--ecosystem-telemetry)
  - [3. Dual-Card QR Viewport & AI Trait Search](#3-dual-card-qr-viewport--ai-trait-search)
  - [4. Digital Adoption & Rehoming Pipeline](#4-digital-adoption--rehoming-pipeline)
  - [5. Clinical Journals & Vaccination Timelines](#5-clinical-journals--vaccination-timelines)
  - [6. Unified Community Newsfeed & Sighting Triage](#6-unified-community-newsfeed--sighting-triage)
  - [7. Warehouse Supply & Inventory Ledger](#7-warehouse-supply--inventory-ledger)
- [System Architecture](#-system-architecture)
- [Technical Stack](#-technical-stack)
- [Database Schema & Data Models](#-database-schema--data-models)
- [API Endpoint Reference](#-api-endpoint-reference)
- [Installation & Setup](#-installation--setup)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Environment Variables (.env)](#environment-variables-reference)
- [Security & Access Control](#-security--access-control)
- [Institutional Context](#-institutional-context--acknowledgments)

---

## 🎯 Overview & Mission

**Task Force Bruno** is an institutional animal welfare and campus pet registry platform custom-built for **Cebu Institute of Technology – University (CIT-U)**. The system streamlines and digitizes every aspect of campus companion animal management:

- 🐕 **Tracking & Protection:** Real-time identification of resident campus companions and stray animals using optical QR collar scanning and AI-assisted trait matching.
- 💉 **Veterinary Health Assurance:** Longitudinal tracking of vaccination histories, anti-rabies immunizations, treatments, and Trap-Neuter-Return (TNR) sterilization progress.
- 🤝 **Community Involvement:** Unified portal allowing students, faculty, and staff to report animal sightings, follow campus bulletins, and submit verified adoption applications.
- 📦 **Operational Logistics:** End-to-end inventory management and ledger tracking for medical supplies, food stock, collars, and campus donations.

---

## 🌟 Key Features & Capabilities

### 1. Role-Based Access Portals

The application implements granular, role-based interfaces with institutional security validations:
- **Campus User Portal (Students / Faculty / Staff):** Access to community newsfeeds, optical QR scanner, adoption gallery, supply logistics coordination, and stray animal sighting reports.
- **MDC Staff Portal (Admins / Operators):** Dedicated dashboard for pet record management, pending adoption application reviews, sighting report triage, clinical logs editing, broadcast bulletins, and inventory stock transactions.
- **Session Protection:** Automated 15-minute global inactivity timeout matrix with client-side idle tracking (`mousemove`, `keydown`, `scroll`, `touch`).

---

### 2. Master Pet Registry & Ecosystem Telemetry

- **Segmented Directory:** Categorizes animals into *Active Campus Companions*, *Strays Available for Adoption*, and *Adopted Alumni Companions*.
- **Dynamic Somatic Badges:** Real-time visual status badges indicating immunization tiers (*Fully Vaccinated*, *Partially Vaccinated*, *Not Vaccinated*) and TNR status (*Spayed / Neutered*).
- **Telemetry Indicators:** Aggregated live performance indicators displaying population control rates, localized campus zone density, and health compliance.

---

### 3. Dual-Card QR Viewport & AI Trait Search

- **Optical QR Code Scanner (`jsQR`):**
  - Real-time hardware camera viewfinder pipeline.
  - Direct image file upload decoder.
  - Instant resolution of institutional pet codes (`PET-XXXX` / `STRAY-XXXX`).
  - Terminal manual override input.
- **AI-Powered Natural Language Trait Search:**
  - Token-based priority affinity scoring backend.
  - Natural language inquiry parsing (e.g., *"calico cat with white socks spotted near canteen"*).
  - Highlights physical descriptors and matches candidate animal profiles descending by relevance score.
- **Side-by-Side Comparison:** Dual-card container architecture enables simultaneous lookup and side-by-side profile comparison.

---

### 4. Digital Adoption & Rehoming Pipeline

- **Interactive Gallery:** Browse all adoptable campus companions with detailed personality descriptions, health tags, and photo carousels.
- **Application Workflow:** Community members submit comprehensive adoption inquiries directly through the platform.
- **Staff Review Triage:** Staff can review applicant credentials, inspect living environment details, approve/reject submissions, and transition animals to *Adopted Alumni* status.

---

### 5. Clinical Journals & Vaccination Timelines

- **Longitudinal Medical Records:** Comprehensive diagnostic history, prescribed treatments, attending veterinarians, and timestamped progress notes.
- **Vaccination Tracker:** Batch tracking for vaccines (Rabies, 5-in-1, Deworming), administered dates, and automated calculation of upcoming due dates.

---

### 6. Unified Community Newsfeed & Sighting Triage

- **Centralized Social Stream:** Aggregates official campus safety bulletins, announcements, and user sighting submissions into a single chronological timeline.
- **Interactive Engagement:** Rich social actions including likes, comment threads, and timestamped updates.
- **Sighting Triage Queue:** User-submitted sighting reports with uploaded photographic evidence and location tags are triaged and confirmed by staff before escalating to rescue or clinic intake.

---

### 7. Warehouse Supply & Inventory Ledger

- **Asset Control Hub:** Manages medical supplies, antiseptics, surgical tools, and food allocations.
- **Audit Ledger:** Tracks inbound donations and outbound disbursements with quantity mutations, batch timestamps, and staff accountability logs.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer["🖥️ Frontend Client (SPA)"]
        UI["React 19 + Tailwind CSS 4 + Vite"]
        Scanner["Optical QR Engine (jsQR)"]
        State["Session & Auth Matrix (15-min Idle Guard)"]
    end

    subgraph GatewayLayer["⚡ Backend Gateway (Django REST Framework)"]
        API["Django 5.0 REST Endpoints"]
        AuthGate["CIT-U Domain Security Gate (@cit.edu)"]
        AISearch["NLP Trait Tokenizer & Priority Scorer"]
        Parsers["MultiPart & Form Binary Parsers"]
    end

    subgraph DataLayer["☁️ Cloud Data & Storage (Supabase)"]
        Postgres[("Supabase PostgreSQL Database")]
        Storage[("Supabase Storage ('petpictures')")]
        AuthService["Supabase GoTrue Auth Service"]
    end

    UI <--> |HTTPS / JSON REST API| API
    Scanner -.-> UI
    State -.-> UI
    
    API <--> |PostgREST Python SDK| Postgres
    API <--> |Storage API| Storage
    AuthGate <--> |JWT Verification| AuthService
```

---

## 🛠️ Technical Stack

| Domain | Technology | Purpose / Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19.2 | Modern functional architecture, custom hooks, reactive state |
| **Frontend Build Tool** | Vite 8.0 | High-performance HMR and optimized build bundling |
| **Styling Engine** | Tailwind CSS v4.3 | Custom Maroon (`#5C0612`) & Gold (`#D4AF37`) CIT-U brand identity |
| **Vision & Scanning** | `jsQR` 1.4 | Client-side real-time video canvas pixel matrix decoding |
| **Backend Framework** | Django 5.0 / DRF 3.15 | RESTful API endpoints, request validation, custom token search |
| **Database Engine** | Supabase PostgreSQL | Relational database with PostgREST query client |
| **Asset Storage** | Supabase Storage | High-availability cloud bucket (`petpictures`) for visual media |
| **Authentication** | Supabase Auth + JWT | Institutional security with role segregation (`user` / `staff`) |
| **Deployment** | Vercel / Render | Cloud hosting with CORS policy controls and environment routing |

---

## 📊 Database Schema & Data Models

```
                   +----------------------+
                   |       profiles       |
                   | (id, custom_id, role)|
                   +----------------------+
                              | 1
                              |
                              | N
                   +----------------------+
                   |         pets         |
                   | (pet_id, status, ..) |
                   +----------------------+
                    /         |          \
                  /           |            \
      1:N       /             | 1:N          \ 1:N
+------------------+  +-------------------+  +------------------+
| medical_records  |  | vaccination_logs  |  |   applications   |
+------------------+  +-------------------+  +------------------+

+------------------+  +-------------------+  +------------------+
|    sightings     |  |   announcements   |  |    inventory     |
+------------------+  +-------------------+  +------------------+
```

### Key Entity Reference

| Table | Primary Key | Key Attributes | Description |
| :--- | :--- | :--- | :--- |
| **`profiles`** | `id` (UUID) | `custom_id`, `first_name`, `last_name`, `email`, `role` | Institutional user profiles restricted to `@cit.edu` accounts |
| **`pets`** | `pet_id` (TEXT) | `name`, `species`, `breed`, `gender`, `vaccination_status`, `spayed_neutered`, `found_near`, `description`, `primary_image` | Master animal registry directory |
| **`medical_records`** | `record_id` (UUID) | `pet_id` (FK), `diagnosis`, `treatment`, `veterinarian`, `date_logged` | Veterinary clinical history and diagnostics |
| **`vaccination_logs`** | `log_id` (UUID) | `pet_id` (FK), `vaccine_name`, `batch_number`, `administered_date`, `next_due_date` | Longitudinal immunization logbook |
| **`adoption_applications`** | `application_id` (INT) | `pet_id` (FK), `applicant_name`, `applicant_email`, `contact_number`, `reason`, `status` | Public rehoming application entries |
| **`sightings`** | `sighting_id` (INT) | `user_email`, `location`, `description`, `photo_url`, `status`, `created_at` | Community animal sighting alerts |
| **`announcements`** | `id` (INT) | `title`, `content`, `author`, `created_at` | Official campus bulletins and broadcasts |
| **`inventory`** | `item_id` (INT) | `item_name`, `category`, `quantity_in_stock`, `unit_measure` | Supply inventory levels |
| **`inventory_transactions`**| `id` (INT) | `item_id` (FK), `change_amount`, `transaction_type`, `logged_by`, `timestamp` | Audit ledger of item receipts & disbursements |

---

## 📡 API Endpoint Reference

All endpoints are served under `/api/` on the backend gateway.

### 🔐 Authentication & Session
- `POST /api/register/` — Register new user (`@cit.edu` domain and valid ID format required).
- `POST /api/login/` — Authenticate and retrieve role-scoped session token.
- `GET /api/health/` — Server health check and telemetry heartbeat.

### 🐾 Pet Directory & AI Search
- `GET /api/pets/` — Fetch all registered animal profiles.
- `POST /api/pets/` — Create a new pet record (MultiPart binary photo upload supported).
- `GET /api/pets/<pet_id>/` — Retrieve complete profile details for a specific pet.
- `PUT /api/pets/<pet_id>/` — Update pet demographic, status, or medical metadata.
- `DELETE /api/pets/<pet_id>/` — Remove an animal record from the registry.
- `POST /api/pets/ai-search/` — Natural language trait keyword tokenizer search.

### 🩺 Clinical & Medical Logs
- `GET /api/medical/<pet_id>/` — Fetch clinical diagnosis records for an animal.
- `POST /api/medical/<pet_id>/` — Record a new veterinary clinical log entry.
- `GET /api/vaccinations/<pet_id>/` — Fetch immunization history for an animal.
- `POST /api/vaccinations/<pet_id>/` — Append a new vaccination record with due date.

### 🏡 Adoption Applications
- `GET /api/pets/applications/` — List all adoption submissions (Staff clearance).
- `POST /api/pets/applications/` — Submit a new adoption application (Community).
- `PUT /api/pets/applications/<application_id>/` — Update application status (`approved`, `rejected`, `pending`).

### 📦 Inventory & Logistics
- `GET /api/inventory/` — Retrieve current inventory stock levels.
- `POST /api/inventory/` — Add a new inventory item.
- `PUT /api/inventory/<item_id>/` — Update inventory item attributes.
- `GET /api/inventory/transactions/` — Retrieve transaction ledger history.
- `POST /api/inventory/transactions/` — Record an item movement (Stock In / Stock Out).

### 📢 Community Newsfeed & Sighting Reports
- `GET /api/newsfeed/` — Fetch combined timeline (announcements, sightings, social activity).
- `POST /api/newsfeed/like/` — Toggle like reaction on a feed item.
- `POST /api/newsfeed/comment/` — Add a comment to a feed item.
- `POST /api/newsfeed/action/` — Perform administrative actions on a feed post.
- `GET /api/sightings/` — List reported sightings.
- `POST /api/sightings/` — Submit an animal sighting report with location and image.
- `PUT /api/sightings/<sighting_id>/` — Update sighting triage state.
- `GET /api/announcements/` — List all campus announcements.
- `POST /api/announcements/` — Broadcast a new campus announcement.

---

## 🔧 Installation & Setup

### Prerequisites

Ensure you have the following installed on your development machine:
- **Python 3.10+** (with `pip` and `venv`)
- **Node.js 18+** / **npm 9+**
- A **Supabase** project account (free tier compatible)

---

### Backend Setup

1. **Clone the repository and enter the backend directory:**
   ```bash
   git clone https://github.com/yuclark/taskforcebruno.git
   cd taskforcebruno/backend
   ```

2. **Create and activate a Python virtual environment:**
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure the backend environment variables:**
   Create a `.env` file in the root `taskforcebruno/` directory or inside `backend/`:
   ```env
   DJANGO_SECRET_KEY="your-secure-django-secret-key"
   DEBUG="True"
   SUPABASE_URL="https://your-supabase-project.supabase.co"
   SUPABASE_KEY="your-supabase-anon-or-service-role-key"
   FRONTEND_VERCEL_URL="http://localhost:5173"
   ```

5. **Run database migrations & start the development server:**
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   Backend will be accessible at `http://127.0.0.1:8000/`.

---

### Frontend Setup

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd taskforcebruno/frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open `http://localhost:5173` in your browser.

---

### Environment Variables Reference

| Variable | Scope | Description | Example |
| :--- | :--- | :--- | :--- |
| `DJANGO_SECRET_KEY` | Backend | Django cryptographic signing key | `django-insecure-xxx` |
| `DEBUG` | Backend | Enables debug mode for local development | `True` / `False` |
| `SUPABASE_URL` | Backend | Supabase API instance URL | `https://xyz.supabase.co` |
| `SUPABASE_KEY` | Backend | Supabase service role or anon key | `eyJh...` |
| `DATABASE_URL` | Backend (Optional) | Direct PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `FRONTEND_VERCEL_URL`| Backend | Authorized CORS frontend origin URL | `https://your-frontend.vercel.app` |

---

## 🔒 Security & Access Control

- **Domain Gate Enforcement:** Registration is exclusively limited to institutional `@cit.edu` email domains and institutional ID syntax (`XX-XXXX-XXX`).
- **Session Auto-Termination:** Global inactivity monitor actively tracks user events and terminates sessions after 15 minutes of idle time.
- **CORS Shielding:** Django middleware restricts API access strictly to whitelisted frontend origin domains.
- **Cloud Asset Isolation:** Animal photos and sighting uploads are stored in dedicated Supabase Storage buckets with structured access policies.

---

## 🏛️ Institutional Context & Acknowledgments

| Attribute | Details |
| :--- | :--- |
| **Institution** | [Cebu Institute of Technology – University (CIT-U)](https://cit.edu/) |
| **Initiative** | Task Force Bruno — Campus Companion Welfare & Management Project |
| **Project Track** | Capstone Core / Information Technology |
| **Status** | ✅ Production Ready |

Developed with pride and dedication by the **Task Force Bruno Engineering Team** to champion animal welfare, campus safety, and compassionate companion stewardship across the CIT-U campus.

<div align="center">

*🐾 In loving memory and dedication to our campus companions.*

</div>
