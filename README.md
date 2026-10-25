# Tarkaash — Har Hunar Ko Ek Pehchaan

A local-services platform where customers discover independent providers (home bakers, home kitchens, tutors, travel planners and more) and send **Tarkaash-managed enquiries**. Tarkaash assigns each enquiry to a provider, the provider runs it through a tracked order lifecycle, and vendors and admins get analytics, a boost queue and platform P&L.

**Live demo:** https://tarkaash.vercel.app. Sign in from `/login` with the one-click demo accounts.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript, Server Actions), **Tailwind CSS v4**, Recharts, lucide icons
- **Supabase**: Postgres with row level security, Auth, Storage. Every privileged write is a validated, audited database function. The app uses only the publishable key.
- **Vercel**: hosting (Mumbai region, next to the database)

## What's inside

| Area | Routes |
| --- | --- |
| Public site | `/`, `/services`, `/vendors/[slug]` (enquiry flow), `/how-it-works`, `/about`, `/contact`, `/list-your-service` |
| Customer | `/account` (enquiries, order progress, reviews, saved providers) |
| Vendor portal | `/vendor` (dashboard), orders & lifecycle, services, profile, reviews, followers, payouts |
| Admin console | `/admin` (analytics), enquiry queue & assignment, orders, vendors & verification, boost queue, commercial P&L, moderation, support, settings, audit log |

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the Supabase URL and publishable key
npm run dev
```

## Quality checks

```bash
npm run lint && npm run typecheck && npm test && npm run build
DEMO_PASSWORD=... APP_URL=http://localhost:3000 npm run smoke      # live access-rule checks
DEMO_PASSWORD=... APP_URL=http://localhost:3000 node scripts/e2e.mjs  # full browser flow (Playwright)
```

Database setup, roles and the SQL acceptance test are documented in [`supabase/README.md`](supabase/README.md).

## Demo data

All providers, prices, reviews, verification states, fees and metrics are illustrative sample data (flagged `is_demo`) until validated. Images are from Unsplash under the Unsplash License. Product photos are used as vendor avatars. Founder photos come from the client deck and should be replaced with approved high-resolution versions.

**Before a real launch:** remove `NEXT_PUBLIC_DEMO_MODE` and `NEXT_PUBLIC_DEMO_PASSWORD` from the Vercel environment, rotate the demo account passwords, and approve fees, verification wording, privacy terms and contact details in Admin → Settings.
