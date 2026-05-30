# Task Force Bruno

Integrated Campus Pet Management & Stray Welfare Tracking System for the CIT-U community — a unified animal welfare ecosystem for resident pets, campus strays, donations, medical history, and social reporting.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-informational)](#)
[![React](https://img.shields.io/badge/react-19.x-blue)](#)
[![Django](https://img.shields.io/badge/django-5.x-green)](#)
[![Supabase](https://img.shields.io/badge/supabase-Postgres-orange)](#)

---

## Quick description
A production-oriented, privacy-conscious platform to register and track campus pets and strays, scan collars/QRs, match AI-predicted traits, accept and audit GCash remittances, maintain clinical timelines, and manage supply inventory — tailored for academic campus operations.

---

## Tech stack (confirmed from repository)
- Frontend: React (Vite) + Tailwind CSS, jsQR for client-side QR decoding
- Backend: Django 5 + Django REST Framework (djangorestframework)
- Database & Auth & Storage: Supabase (PostgreSQL, GoTrue, Storage)
- Key libraries (selected): psycopg2-binary, supabase-py, httpx, PyJWT

---

## Core features (detailed)
1. Master Animal Registry & Listings
   - Full pet and stray profiles (PET-XXXX / STRAY-XXXX)
   - Vital statistics: name, sex, age/estimated, color, microchip/collar IDs, location sightings
   - TNR sterilization records and vaccination badges per animal
   - Photo gallery and status (resident, fostered, adopted, deceased)

2. Dual-Card QR Scanner Viewport
   - Left viewport: hardware camera or file-upload QR decoding (jsQR)
   - Supports PET-XXXX and STRAY-XXXX canonical IDs
   - Right viewport: AI-assisted trait-matching token search (predictive filters, similar animals)

3. Self-Reported GCash Donation Hub
   - Manual remittance logging form capturing reference numbers and amounts
   - Admin audit triage queue for verification and reconciliation
   - Live verified ticker streams and aggregated donation totals

4. Unified Newsfeed & Social Streams
   - Campus bulletins, sightings feed, announcement logs
   - Social interactions: likes, nested comments, threaded discussion

5. Clinical Medical Timelines
   - Medicine records, treatment notes, vaccination history timelines
   - Attachments for prescriptions, lab reports, and vet notes

6. Warehouse Supply Hub
   - Inventory ledger for materials and consumables
   - Stock tracking, transactions (in/out), low-stock alerts

---

## Database schema (Supabase - summary)
Core tables (examples):
- pets
  - id (uuid)
  - canonical_id (string, e.g., PET-0001)
  - name, species, breed, sex, dob_estimated, color
  - status (resident|stray|adopted|fostered|deceased)
  - photos (storage paths)
  - created_at, updated_at

- medical_records
  - id, pet_id (fk -> pets.id), date, type (vax|treatment|med), notes, attachments

- vaccination_logs
  - id, pet_id, vaccine_name, date_given, administered_by, batch_no

- monetary_donations
  - id, donor_name (optional), amount, currency, reference, status (pending|verified|rejected), logged_at, verified_by

- inventory
  - id, sku, name, quantity_on_hand, location, unit

- users
  - id, email, role (admin|staff|volunteer|public), supabase_user_id

Note: actual Supabase table/column names may vary — use the schema dashboard to inspect exact column names for migrations.

---

## Local development (setup)
Prerequisites:
- Python 3.11+
- Node.js 18+ and npm
- Git
- (Optional) Docker for reproducible Postgres / Supabase local emulation

Backend
```bash
# create & activate venv (recommended)
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # Windows
pip install --upgrade pip
pip install -r ..\requirements.txt
# environment variables (example)
# set these in a .env file or your shell environment
# SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, PAYMONGO_SECRET_KEY
copy ..\.env.example .env
# run migrations and start server (if using Django project)
python manage.py migrate
python manage.py runserver
```

Frontend
```bash
cd frontend
npm install
npm run dev
# opens Vite dev server (see terminal for URL, typically http://localhost:5173)
```

Environment variables (important)
- SUPABASE_URL — your Supabase project URL
- SUPABASE_KEY — anon/public API key for client or service role key for server operations
- SUPABASE_SERVICE_ROLE_KEY — (server-only) high-privilege key; keep secret
- PAYMONGO_SECRET_KEY — (if PayMongo integration used for payments)
- DJANGO_SECRET_KEY — Django secret key (backend)
- DATABASE_URL — optional Postgres connection string for Django when not using Supabase

Security note: never commit service_role or other secrets into git. Use environment secrets management in production.

---

## Repository layout
```
\ (repo root)
├─ backend\            # Django backend, DRF endpoints
├─ frontend\           # React + Vite + Tailwind frontend
├─ requirements.txt     # consolidated Python deps (for reference)
└─ README.md
```

---

## Deployment notes (production-grade)
- Use Supabase for DB and Storage; host backend with a WSGI server (Gunicorn) behind HTTPS
- Serve static frontend via CDN or Vercel/Netlify; point API to secure backend
- Use Supabase RLS policies and server-side verification for donation webhooks and audit flows
- Monitor with Sentry/Prometheus and set automated backups for Postgres

---

If anything here needs correcting (exact table names or additional environment variables), provide the paths to the files to scan and the preferred format for secrets management. Thank you!

---

(Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>)