# Tarkaash backend (Supabase)

Postgres + Auth + Storage on Supabase. Every privileged write goes through a `SECURITY DEFINER` function that checks the caller's role, validates input and writes an audit trail, so the web app only needs the **publishable key**. No service-role key is used by the app.

## Apply

Run the migrations in order against a fresh project (SQL editor, `psql`, or the Supabase MCP `apply_migration`):

| File | What it does |
| --- | --- |
| `migrations/0001_schema.sql` | Tables, enums, default settings (fees, boost thresholds, contact) |
| `migrations/0002_security.sql` | Role helpers, new-user trigger, column guards, row level security |
| `migrations/0003_workflows.sql` | Enquiry submission, assignment, order lifecycle, payments, onboarding, reviews, support, event logging |
| `migrations/0004_analytics.sql` | Vendor metrics, admin metrics, boost queue, commercial P&L |
| `migrations/0005_storage.sql` | `vendor-media` bucket; vendors write only under their own folder |
| `migrations/0006_lockdown.sql` | Internal helpers not callable from the API |
| `migrations/0007_least_privilege.sql` | Anonymous visitors can only submit enquiries/messages and log events |

Then optionally load demo data:

```sql
select set_config('seed.password', '<choose a demo password>', false);
-- run supabase/seed/demo_seed.sql in the same session
```

## Roles

| Role | Can see | Can do |
| --- | --- | --- |
| Visitor (anon) | Active vendors, services, approved reviews, public settings | `submit_enquiry`, `submit_ticket`, `log_event` |
| Customer | Own enquiries, orders and history | Likes, follows, `submit_review` on own completed orders, `create_vendor_application` |
| Vendor | Own listing, services, assigned orders, own analytics | Edit profile/services, `transition_order`, `vendor_update_order`, `record_payment`, `order_contact` (after accepting) |
| Admin | Everything | Assign enquiries, approve vendors, verification checklist, moderation, close orders, settings |
| Finance | Everything read-only plus ledger and costs | Verify payments, manage ledger and cost entries |

Vendors never see other vendors' records or the customer list; customer contact is released per order only after the vendor accepts, and each view is audited.

## Order lifecycle

`new → accepted | declined → in_progress → completed → payment_recorded → submitted → closed` (plus `cancelled` from accepted/in progress). Allowed moves live in `order_transitions`. A decline sends the enquiry back to the admin queue. Closing books the commission and any Tarkaash Assist fee in `platform_ledger` exactly once.

## Demo accounts (after seeding)

All use the seed password you chose. Emails are on the reserved `example.com` domain.

- `tarkaash.admin@example.com`: admin
- `tarkaash.finance@example.com`: finance
- `meera.baking@example.com`, `wingsinair@example.com`, `rohan.kitchen@example.com`, `brightsteps@example.com`: vendors
- `priya.customer@example.com`: customer
- `zoya.henna@example.com`: pending vendor application

All seeded rows have `is_demo = true`. Prices, reviews, verification states, fees and metrics are illustrative.

## Tests

`tests/backend_test.sql` signs in as each role and exercises the real functions and policies (33 checks). It always ends with an exception, so nothing it writes is kept; the error message lists PASS/FAIL per check.
