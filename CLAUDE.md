# KV Tree — Project Memory (for Claude)

Tree-felling company website + operations CRM. This file is durable memory so
context can be cleared without losing project state. Owner: Pieter Bekker
(phone/WhatsApp +27 83 302 2877). Account/admin: leslie.strydom@gmail.com.

## Architecture & deploy
- **Monorepo**: `client/` (Next.js 16.2.9, React 19, Tailwind v4) + `server/`
  (Node/Express 5, PostgreSQL).
- **client/** deploys to **Netlify** (base `client`, `npm run build` = `next build
  --webpack`). `netlify.toml` at repo root.
- **server/** deploys to **Railway** (root dir = `server`, start `node index.js`,
  listens on Railway-injected PORT e.g. 8080).
- **Database**: Railway managed **Postgres plugin** via `DATABASE_URL`. Persistent
  across redeploys/reboots. Holds all CRM data (users, leads, quotes, jobs,
  invoices, campaigns).
- **File storage**: **Cloudflare R2** (S3-compatible), bucket `kvtree-uploads`,
  public URL `https://pub-24fa5cc118344c478207b6e977221ac5.r2.dev`. CONFIGURED &
  LIVE (startup log shows `🗄️ Using S3 storage`). Photos + generated PDFs persist
  here. `server/storage.js` auto-switches to S3 when `S3_BUCKET` + keys are set.

## Git workflow
- Develop on branch `claude/pensive-carson-sa3fxj`; PR → `master`; merge.
- **Netlify and Railway both deploy from `master`.** User authorizes merging to
  master. End commit messages with the Co-Authored-By + Claude-Session trailers.

## Branding / design system (already applied site-wide)
- Tailwind v4 `@theme` in `client/src/app/globals.css`: "forest" green palette +
  `lime-accent` + `sand` neutrals. Display serif **Fraunces** + **Geist** sans.
- Helpers: `.wrap` (page width), `.eyebrow`, `.animate-rise`. Inline SVG icons in
  `client/src/components/icons.tsx`. Photos centralised in `client/src/lib/photos.ts`
  (real branded job photos). Shared service data in `client/src/lib/services.tsx`.
- All pages redesigned: home, services, about, portfolio (filter gallery),
  contact, login, admin dashboard, client portal. Admin Kanban fits 7 stages
  without horizontal scroll on desktop + per-stage colours.
- Contact page uses `AddressAutocomplete` (Google Places) + camera-friendly photo
  upload with previews; submit uploads photos and posts lead with lat/lng.

## Auth / CRM
- JWT + bcrypt. Roles: admin / worker / client. Admin seeded on first boot from
  `ADMIN_EMAIL` + `ADMIN_PASSWORD` (only if that email doesn't already exist).
- Login at `/login` → admin/worker to `/admin`, client to `/portal`.
- Pipeline statuses: Quote Requested → Site Visit Scheduled → Quoted → Booked →
  In Progress → Completed → Invoiced.

## Integrations (all env-gated; degrade to logging until configured)
Status as of last session:
- **R2 storage** — ✅ configured.
- **SMTP email** (`server/mailer.js`) — ❌ not configured (logs only).
- **WhatsApp** (`server/whatsapp.js`, Twilio API) — ❌ not configured (logs only).
- **PayFast payments** (`server/payments.js`) — ❌ not configured.
- **Google Calendar** (`server/calendar.js`, service account) — ❌ not configured.

What the notifications do (`notify()` in index.js sends email + WhatsApp):
- New lead → "thanks for your request" to the customer (+ internal email if
  `INTERNAL_NOTIFY_EMAIL`).
- **Quote created (admin) → sends the customer the quote amount + PDF link by
  email AND WhatsApp, with the PDF attached to the email** (`index.js` ~line 323).
  This is the "auto-send quotes to clients" feature — already built.

Env var reference lives in `server/.env.example` (includes R2 + Supabase recipes).

## Netlify secrets-scanning fix (important)
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is a public browser key inlined into the client
bundle by design. Netlify's scanner failed builds. `netlify.toml` sets both:
- `SECRETS_SCAN_OMIT_KEYS = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"` (explicit scan)
- `SECRETS_SCAN_SMART_DETECTION_ENABLED = "false"` (heuristic AIza… pattern)
The private server geocoding key is `GOOGLE_MAPS_API_KEY` (Railway only, never
shipped). `GEOCODER=google` selects Google geocoding; default is free Nominatim.

## Known follow-ups / notes
- Team/testimonials on the site are placeholder names except founder photo.
- Some secrets were shared in plaintext in chat (JWT_SECRET, ADMIN_PASSWORD,
  Google key) — worth rotating.
- WhatsApp business-initiated messages (e.g. cold quote sends) require an approved
  Meta template OR the customer having messaged within 24h; Twilio sandbox needs
  the recipient to join first.
