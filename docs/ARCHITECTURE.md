# Architecture

Tarkaash is a Next.js 16 application on Vercel backed by Supabase (Postgres, Auth, Storage). The defining design choice: **the database is the security and business-rules boundary**. The web tier holds no privileged credentials.

## System overview

```mermaid
flowchart TB
  subgraph Client
    B[Browser]
  end
  subgraph Edge["Vercel"]
    PX[proxy.ts]
    SC[Server Components]
    SA[Server Actions]
    RH[Route handlers]
  end
  subgraph Data["Supabase"]
    AU[Auth]
    PG[(Postgres + RLS)]
    RPC[Database functions]
    S3[Storage]
  end
  B --> PX
  PX -->|refresh session, guard /vendor /admin /account, end blocked sessions| SC
  B -->|forms| SA
  B -->|CSV, health, llms.txt| RH
  SC -->|select under RLS| PG
  SA -->|rpc| RPC
  RPC --> PG
  RH --> PG
  SA --> AU
  B -->|upload to own folder| S3
```

| Layer | Responsibility |
| --- | --- |
| `proxy.ts` | Refreshes the Supabase session cookie, enforces route-level role guards, signs out blocked accounts, redirects legacy URLs |
| Server Components (`app/**/page.tsx`, `lib/data/*`) | Read data with the user's session; row level security decides what each role sees |
| Server Actions (`lib/actions/*`) | Validate input with zod, call database functions, map database errors to friendly messages, revalidate pages |
| Route handlers (`app/api/*`, `app/llms.txt`) | CSV exports (staff only), health check, AI-assistant summary |
| Database functions (`supabase/migrations/0003`, `0004`, `0012`) | Every privileged write: role check, validation, rate limit, state transition, audit entry |

## Request lifecycle: a customer enquiry

```mermaid
sequenceDiagram
  actor C as Customer
  participant P as Vendor page
  participant A as submitEnquiry (server action)
  participant F as submit_enquiry (database function)
  participant Q as Admin queue
  C->>P: choose service, fill form
  P->>A: enquiry + idempotency key
  A->>A: zod validation
  A->>F: rpc
  F->>F: consent check, rate limit, find or create customer
  F->>F: insert enquiry (ref TK-YYMM-XXXXXX), event, admin notification
  F-->>A: ref code (or existing ref if duplicate)
  A-->>C: redirect to /enquiry/{ref}
  Q->>Q: admin assigns provider (admin_assign_enquiry creates order)
```

## Data model (core)

```mermaid
erDiagram
  PROFILES ||--o{ VENDOR_MEMBERS : "belongs to"
  VENDORS ||--o{ VENDOR_MEMBERS : has
  CATEGORIES ||--o{ VENDORS : "primary category"
  VENDORS ||--o{ SERVICES : offers
  VENDORS ||--o{ VENDOR_MEDIA : gallery
  VENDORS ||--o{ VENDOR_UPDATES : posts
  CUSTOMERS ||--o{ ENQUIRIES : sends
  SERVICES ||--o{ ENQUIRIES : "about"
  ENQUIRIES ||--o{ ENQUIRY_EVENTS : timeline
  ENQUIRIES ||--o{ ORDERS : "becomes"
  VENDORS ||--o{ ORDERS : fulfils
  ORDERS ||--o{ ORDER_STATUS_HISTORY : history
  ORDERS ||--o{ PAYMENTS : "paid by"
  ORDERS ||--o| REVIEWS : "reviewed in"
  ORDERS ||--o{ PLATFORM_LEDGER : "books"
```

Supporting tables: `order_transitions` (allowed state changes), `analytics_events`, `cost_entries`, `support_tickets`, `notifications`, `follows`, `likes`, `settings` (configurable fees, thresholds, moderation), `audit_log` (append only) and `rate_limits`.

## Roles

| Role | Reads | Writes |
| --- | --- | --- |
| Visitor | Live vendors, approved services, posts, photos and reviews, public settings | `submit_enquiry`, `submit_ticket`, `log_event` |
| Customer | Own enquiries, orders and account | Likes, follows, reviews on own completed orders, vendor application |
| Vendor | Own listing, services, assigned orders, own analytics | Listing and content (moderated), order transitions, payments; customer contact after accepting |
| Admin | Everything | Assignment, approvals, verification, moderation, users, settings, vendor removal |
| Finance | Everything | Payment verification, ledger and costs |
| View-only staff | Everything an admin or finance user can read | Nothing (showcase demo accounts) |

## Order lifecycle

`new → accepted | declined → in_progress → completed → payment_recorded → submitted → closed`, plus `cancelled` from accepted or in progress. Allowed moves live in `order_transitions` and are enforced by `transition_order`. A decline returns the enquiry to the admin queue. Closing books commission and any Tarkaash Assist fee in `platform_ledger` exactly once.

## Analytics

Metrics are SQL functions over events and orders, so dashboards reconcile with the underlying records:

- `vendor_metrics`: views, unique viewers, enquiries, acceptance rate (with its denominator), median response time (with sample size), completion and cancellations, value, followers, rating, listing completeness
- `admin_metrics`: platform funnel, outcomes, category and locality demand, top vendors, revenue
- `boost_queue`: explainable flags (low exposure, poor conversion, slow response, high cancellations, low rating, weak listing) with the measured value and a suggested action
- `commercial_summary`: revenue by type, direct and operating costs, contribution, estimated P&L by month

## Frontend

- Design tokens in `app/globals.css` (Tailwind v4 `@theme`), Fraunces for display and Inter for text
- Motion system: page transitions, a Web Animations scroll-reveal observer that never touches React-managed DOM, pointer parallax, all disabled under `prefers-reduced-motion`
- SEO layer in `lib/seo.ts` and `lib/content/seo.ts`: per-page metadata, JSON-LD builders, keyword map, sitemap, robots and `llms.txt`
