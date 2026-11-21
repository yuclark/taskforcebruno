# Task Force Bruno — Frontend (Wildcat Welfare Portal)

React 19 + Vite 8 + Tailwind CSS v4 single-page application for CIT-U's Task Force Bruno campus animal welfare portal.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://taskforcebruno.onrender.com/api` | Base URL for the Django REST API |
| `VITE_PUBLIC_APP_URL` | `window.location.origin` | Base URL embedded in generated pet collar QR tags |

## Scripts

- `npm run dev` — Start Vite development server
- `npm run lint` — Run ESLint across the codebase
- `npm run build` — Production build with vendor and lazy route code-splitting
- `npm run preview` — Preview the production build locally

## Structure

- `src/lib/` — Shared authenticated API client (`api.js`), session/auth helpers (`auth.js`), pet/location utilities (`pets.js`), date helpers (`dates.js`), and QR decoding & 300 DPI tag rendering (`qr.js`).
- `src/components/` — Community Portal (`DashboardContainer`), Staff Portal (`StaffDashboard`), Public QR Passport (`PublicPetPassport`), Clinical Records, Inventory Control, Adoption Gallery, Sighting Triage, and Newsfeed modules.
