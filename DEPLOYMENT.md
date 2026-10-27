# Tarkkash deployment and hosting runbook

## Live environment

| Piece | Where |
| --- | --- |
| Website | https://www.tarkkash.com (GoDaddy domain; `tarkkash.com` and `tarkaash.vercel.app` redirect here. Vercel project `tarkaash`, team "Amar's projects") |
| Functions region | `bom1` Mumbai, next to the database |
| Database / Auth / Storage | Supabase project `tarkaash` (`mimlefjoxiagejvyopfd`, ap-south-1 Mumbai) |
| Source | GitHub `Rrachet/Tarkkash`, branch `main` (Vercel production branch) |

Every push to the production branch builds and deploys automatically. GitHub Actions runs lint, typecheck, unit tests and build on each push.

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Key | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mimlefjoxiagejvyopfd.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | Browser-safe; row level security protects data. No service-role key is used anywhere. |
| `NEXT_PUBLIC_SITE_URL` | `https://www.tarkkash.com` | Canonical address: page links, sitemap, share previews and auth email links. |
| `NEXT_PUBLIC_DEMO_MODE` | `1` | Shows demo-account buttons on `/login`. **Remove for real launch.** |
| `DEMO_PASSWORD` | demo password (sensitive, server only) | Used by the one-click demo sign-in on the server. Never exposed to the browser. **Remove for real launch.** |

After changing env vars, redeploy (Vercel → Deployments → ⋯ → Redeploy).

## Supabase settings

**Authentication → URL Configuration**
- Site URL: `https://www.tarkkash.com`
- Redirect URLs: `https://www.tarkkash.com/**`, `https://tarkkash.com/**`, `https://tarkaash.vercel.app/**` (add `http://localhost:3000/**` for local development)

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

- [ ] Remove `NEXT_PUBLIC_DEMO_MODE` and `DEMO_PASSWORD`; redeploy.
- [ ] Rotate passwords of all `@example.com` demo accounts (or delete them) and remove demo data (`is_demo = true`) when ready.
- [ ] Create real admin accounts: sign up normally, then `update profiles set role = 'admin' where email = '…'` in the SQL editor.
- [ ] Configure SMTP, then turn *Confirm email* back on.
- [ ] Approve in Admin → Settings: Tarkkash Assist fee, commission %, contact details (tick "confirmed" to publish).
- [ ] Approve verification checklist and badge wording; complete checks for each real vendor.
- [ ] Legal review of `/privacy` and `/terms`; data retention and deletion process.
- [ ] Replace founder photos with approved high-resolution images (`public/images/founders/`) and vendor images with vendor-owned photos.
- [ ] Decide vendor-visible vs admin-only analytics.

## Health & monitoring

- `GET /api/health` returns database reachability and latency.
- Vercel → Observability / Logs for runtime errors; Supabase → Logs for database and auth.
- End-to-end checks: `DEMO_PASSWORD=… APP_URL=https://www.tarkkash.com npm run smoke` and `node scripts/e2e.mjs`.

## SEO, AEO and GEO launch checklist

The site ships with full SEO (keyword-targeted category and area pages, structured data, sitemap, `llms.txt` for AI assistants) but stays **noindex** until you switch it on, so demo vendors and sample reviews never appear in Google.

Before flipping indexing on:
1. Replace demo vendors and reviews with real ones (or remove rows where `is_demo = true`).
2. Custom domain: done (`www.tarkkash.com`).
3. Confirm contact details in Admin > Settings so they appear on the Contact page.

Go live:
1. In Vercel, set `NEXT_PUBLIC_ALLOW_INDEXING=1` and redeploy. `/robots.txt` then allows crawlers (including AI search bots) and links the sitemap.
2. Add the site to Google Search Console, set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, and submit `/sitemap.xml`. Do the same in Bing Webmaster Tools (Bing also feeds ChatGPT search).
3. Create a Google Business Profile for Tarkkash in Hyderabad with the same name, logo and description as the site.
4. List Tarkkash consistently on Justdial, Sulekha, IndiaMART, LinkedIn and Instagram. Consistent details help both local ranking and AI answers.
5. Encourage providers to link to their Tarkkash profile from Instagram and WhatsApp Business.

Pages built for search:
- `/services/<category>`: one landing page per category, for example "Home Bakers and Custom Cakes in Hyderabad", with an intro, provider list, area links and FAQs. Copy lives in `lib/content/seo.ts`.
- `/hyderabad/<area>`: one page per neighbourhood (Kondapur, Gachibowli, Madhapur and more). Only areas with providers are listed in the sitemap.
- `/vendors/<slug>`: LocalBusiness structured data with services and prices. Star ratings are marked up only for real (non-demo) providers.
- `/llms.txt`: plain text summary of Tarkkash, its categories, areas, providers and FAQs for AI assistants.

## Security model

- **Database:** row level security on every table. All privileged changes go through database functions that check the caller's role and write to an append-only audit log. The app uses only the publishable key.
- **Staff accounts:** `profiles.read_only` makes a staff account view only (the demo Admin and Finance accounts). Real admins are created by an existing admin from Admin > Users & access, or by SQL.
- **Blocking:** Admin > Users & access can block an account (signed out, cannot sign in) or erase a person's personal data on request.
- **Vendor content:** new or edited services, posts and photos wait in Admin > Content approval until approved (switch in Admin > Settings). Rejected items show the reason to the vendor.
- **Removing a vendor:** Admin > Vendors > vendor > Danger zone. Open orders are cancelled and their enquiries return to the queue. Permanent deletion is allowed only when the vendor has no orders.
- **Demo sign-in:** one-click buttons use the server-only `DEMO_PASSWORD`; it is never sent to the browser.
- **Headers:** Content-Security-Policy, HSTS (2 years, preload), X-Frame-Options DENY, COOP, nosniff, strict referrer and permissions policies (`next.config.ts`).
- **Dependencies:** CI fails on high or critical `npm audit` findings.

Dashboard settings to turn on (Supabase > Authentication):
- Leaked password protection (Password security).
- Minimum password length 10 (the app already enforces 10).
- Decide on "Confirm email" (Providers > Email).
