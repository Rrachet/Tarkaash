# Tarkaash — deployment & hosting runbook

## Live environment

| Piece | Where |
| --- | --- |
| Website | https://tarkaash.vercel.app (Vercel project `tarkaash`, team "Amar's projects") |
| Functions region | `bom1` Mumbai, next to the database |
| Database / Auth / Storage | Supabase project `tarkaash` (`mimlefjoxiagejvyopfd`, ap-south-1 Mumbai) |
| Source | GitHub `Rrachet/Tarkaash`, branch `claude/sweet-knuth-kkunv8` (Vercel production branch) |

Every push to the production branch builds and deploys automatically. GitHub Actions runs lint, typecheck, unit tests and build on each push.

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Key | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mimlefjoxiagejvyopfd.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | Browser-safe; row level security protects data. No service-role key is used anywhere. |
| `NEXT_PUBLIC_SITE_URL` | `https://tarkaash.vercel.app` | Used in auth email links. Change if you add a domain. |
| `NEXT_PUBLIC_DEMO_MODE` | `1` | Shows demo-account buttons on `/login`. **Remove for real launch.** |
| `NEXT_PUBLIC_DEMO_PASSWORD` | demo password | Enables one-click demo sign-in. **Remove for real launch.** |

After changing env vars, redeploy (Vercel → Deployments → ⋯ → Redeploy).

## Supabase settings

**Authentication → URL Configuration**
- Site URL: `https://tarkaash.vercel.app`
- Redirect URLs: `https://tarkaash.vercel.app/**` (add `http://localhost:3000/**` for local development)

**Authentication → Providers → Email**
- *Confirm email*: **off** for the demo, so signups work instantly. Supabase's built-in mailer only delivers to your own team's addresses.
- Turn it back **on** once SMTP is configured. The app handles both modes.

**Email delivery (needed for password reset, email codes, confirmations)**
1. Create a free account at resend.com and verify your sending domain (DNS records).
2. Supabase → Authentication → Emails → SMTP Settings: host `smtp.resend.com`, port `465`, user `resend`, password = Resend API key, sender e.g. `hello@yourdomain`.
3. Optionally customise the email templates under Authentication → Emails.

**Recommended:** Authentication → Attack Protection → enable *leaked password protection* (checks HaveIBeenPwned; may require the Pro plan).

## Database

Migrations live in `supabase/migrations` and are applied in order (see `supabase/README.md`). Demo data: `supabase/seed/demo_seed.sql` then `supabase/seed/demo_images.sql`.

Checks after any database change:
- Supabase → Advisors (security & performance). Remaining "SECURITY DEFINER function executable" warnings are intentional: those functions check the caller's role internally.
- Run `supabase/tests/backend_test.sql` in the SQL editor. It always ends with an error listing PASS/FAIL per check and rolls everything back.

**Backups:** free-tier projects get daily backups for 7 days; Pro adds point-in-time recovery. Before major changes, export with `pg_dump` or Supabase → Database → Backups.

## Adding a custom domain

1. Vercel → Project → Settings → Domains → add `yourdomain.in` (and `www`).
2. Add the DNS records Vercel shows (A `76.76.21.21` for the apex, CNAME `cname.vercel-dns.com` for `www`) at your registrar.
3. Update `NEXT_PUBLIC_SITE_URL`, then add the domain to Supabase Site URL and Redirect URLs. Redeploy.

## Going from demo to real launch (checklist, spec §12)

- [ ] Remove `NEXT_PUBLIC_DEMO_MODE` and `NEXT_PUBLIC_DEMO_PASSWORD`; redeploy.
- [ ] Rotate passwords of all `@example.com` demo accounts (or delete them) and remove demo data (`is_demo = true`) when ready.
- [ ] Create real admin accounts: sign up normally, then `update profiles set role = 'admin' where email = '…'` in the SQL editor.
- [ ] Configure SMTP, then turn *Confirm email* back on.
- [ ] Approve in Admin → Settings: Tarkaash Assist fee, commission %, contact details (tick "confirmed" to publish).
- [ ] Approve verification checklist and badge wording; complete checks for each real vendor.
- [ ] Legal review of `/privacy` and `/terms`; data retention and deletion process.
- [ ] Replace founder photos with approved high-resolution images (`public/images/founders/`) and vendor images with vendor-owned photos.
- [ ] Decide vendor-visible vs admin-only analytics.

## Health & monitoring

- `GET /api/health` returns database reachability and latency.
- Vercel → Observability / Logs for runtime errors; Supabase → Logs for database and auth.
- End-to-end checks: `DEMO_PASSWORD=… APP_URL=https://tarkaash.vercel.app npm run smoke` and `node scripts/e2e.mjs`.
