# Contributing

Thanks for helping improve Tarkkash. This guide covers local setup and the conventions the project follows.

## Setup

1. Node.js 22 (`nvm use` reads `.nvmrc`).
2. `npm install`
3. `cp .env.example .env.local` and fill in the Supabase URL and publishable key.
4. `npm run dev`

## Before you open a pull request

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

For changes that touch data access or workflows, also run the SQL acceptance test (`supabase/tests/backend_test.sql`) and the smoke test (`npm run smoke`).

## Conventions

- **Security first.** Never add a service-role key to the app. Privileged writes belong in a database function with a role check, validation and an audit entry. New tables need row level security policies before they ship.
- **Migrations** are append-only: add a new numbered file in `supabase/migrations`; never edit one that has been applied.
- **Server actions** validate with zod and return `ActionResult` with friendly errors (`lib/errors.ts`).
- **Copy style:** plain, warm English. No em dashes or en dashes (a unit test enforces this).
- **Accessibility:** labelled inputs, visible focus, 44px touch targets, motion that respects `prefers-reduced-motion`.
- **Commits:** short imperative subject line, a body explaining why.
