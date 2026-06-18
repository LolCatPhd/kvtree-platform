# KV Tree Platform

Marketing site **and** operations CRM for KV Tree — a tree-felling company in
Kempton Park, South Africa. Clients request quotes (with photos), staff quote
and schedule from a Kanban board, and the whole pipeline is tracked on a map.

## Architecture

| Part | Stack | Location | Deploy target |
|------|-------|----------|---------------|
| Frontend | Next.js 16 (App Router) + Tailwind | `client/` | Netlify |
| Backend API | Node/Express + PostgreSQL | `server/` | Railway (or any Node host) |
| Database | PostgreSQL | — | Railway Postgres |

## Workflow

```
Client requests quote (public, photos)  ──►  status: Quote Requested
Admin assigns worker                     ──►  Site Visit Scheduled
Worker/admin creates quote (PDF + email/WhatsApp to client)  ──►  Quoted
Client accepts in portal                 ──►  Booked
Admin schedules job → worker completes   ──►  In Progress → Completed → Invoiced
```

Every stage is a column on the admin Kanban board and a coloured pin on the map.

## Features

- **Public marketing site** — home, services, about, portfolio, contact.
- **Quote requests** with mobile photo upload (camera or gallery).
- **Auth & roles** — client / worker / admin (JWT + bcrypt).
- **Client portal** — track requests, view quotes, accept/decline, download PDFs.
- **Admin dashboard** — drag-and-drop Kanban, stats, per-lead quoting,
  worker assignment, job scheduling, onboard workers.
- **Status map** — Leaflet/OpenStreetMap pins coloured by status, distance
  from base (no API key required; Mapbox GL is the 3D upgrade path).
- **Branded quote & invoice PDFs** generated on the server (pdfkit).
- **Invoicing & online payments** — raise invoices from a completed job;
  clients pay online via **PayFast** (the standard SA gateway) with an ITN
  webhook that reconciles payment status. Env-flagged.
- **Marketing campaigns** — segment opted-in recipients (all / clients /
  past clients) and send email blasts; **POPIA**-aware consent tracking.
- **Notifications** — email (nodemailer/SMTP) + WhatsApp (Twilio), env-flagged;
  they log instead of send until credentials are provided.
- **Geocoding** — addresses geocoded on creation (Nominatim by default).

## Local development

### Backend
```bash
cd server
cp .env.example .env      # fill in PG* and JWT_SECRET at minimum
npm install
npm run dev               # http://localhost:5000
```
On first boot it creates all tables and (if `ADMIN_EMAIL`/`ADMIN_PASSWORD`
are set) seeds an admin user.

### Frontend
```bash
cd client
npm install
# point the client at the API:
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
npm run dev               # http://localhost:3000
```

## Deployment

- **Netlify** builds `client/` (config in `netlify.toml`, base `client`,
  `@netlify/plugin-nextjs`). Set `NEXT_PUBLIC_API_URL` to the deployed API URL.
- **Railway** runs `server/` (`npm start`). Link a Postgres plugin (provides
  `PG*`/`DATABASE_URL`) and set `JWT_SECRET`, `PUBLIC_URL`, and any
  SMTP/Twilio/Maps keys you want active.

See `server/.env.example` for the full list of environment variables.

## Roadmap (not yet built)

Calendar sync, true 3D Mapbox map, AI photo-based quote estimates, and an
in-app two-way WhatsApp inbox. Uploaded files currently use the API's local
disk — move to S3/Supabase Storage for production (Railway disk is ephemeral).
```
