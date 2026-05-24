# Task Force Bruno

An institutional, enterprise-grade Pet Profile Management and Live Matrix Tracking Ecosystem designed for digital campus governance, animal care monitoring, and automated collar-based profile retrieval.

---

## 🚀 System Architecture Overview

Task Force Bruno is engineered using a robust decoupled pipeline, splitting operational loads across a high-performance frontend client framework and a secure database layer:

* **Frontend Client:** Built using **React (Vite)**, styled with utility-first **Tailwind CSS**, utilizing the premium **Poppins** typography suite, and featuring integrated client-side graphical matrix parsing via **jsQR**.
* **API Services Engine:** Powered by **Django REST Framework (DRF)** to act as the primary secure middleware pipeline handling payload cleaning, validation rules, and structural endpoint routing.
* **Database & Identity Provider:** Unified directly through **Supabase**, leveraging PostgreSQL relational data streams and secure secure JSON Web Token (JWT) user metadata caching.

---

## ✨ Active Core Features (Sprint 1 Node)

### 1. Role-Based Access Gateways (RBAC)
* **Community Portal Node:** An interface branch optimized for general students, faculty, and volunteers to seamlessly fetch animal safety cards.
* **MDC Staff Portal Panel:** A secure desktop-optimized dashboard layer wrapped around deep administrative records.

### 2. Optical Collar Scan Hub
* **Decryption Module:** Real-time client-side QR image array processing utilizing standard pixel-buffer canvas queries. No external API processing needed.
* **Hardware Fallback Engine:** Features an inline fallback terminal override console input matching standard regex algorithms (`/PET-\d+/i`) to resolve physical assets if camera optics fail.

### 3. Dynamic Registry Management (Full Staff CRUD)
* **Create:** Dynamic inline multi-field data entry sheets mapping directly to relational database parameters.
* **Read:** Expandable accordion listing drawers loading high-resolution graphic imagery buffers and behavioral analytics tracking metrics in real time.
* **Update:** Real-time asset mutation patches parsing straight through custom Django views.
* **Delete:** Enforced database cascading rows drops allowing administrative handlers to safely clear decommissioned profiles.

---

## 🛠️ Environmental Ignition & Setup

### 1. Backend Engine Initialization
Ensure your Python workspace environment is active, then initialize your local tracking server node:
```bash
cd backend
pip install -r requirements.txt
python manage.py runserver