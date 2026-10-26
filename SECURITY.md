# Security

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private reporting instead: open the repository's **Security** tab and choose **Report a vulnerability**. Include a description, steps to reproduce and the impact you observed. We aim to acknowledge reports within 3 working days and to fix confirmed issues promptly. Please give us reasonable time to fix an issue before disclosing it.

## Security model

**Least privilege by design**
- The application uses only the Supabase publishable key and the signed-in user's session. No service-role key exists in the codebase or the hosting environment.
- Row level security is enabled on every table. Vendors cannot read other vendors' data or the customer list. Guests cannot read enquiries at all.
- Privileged changes go through `SECURITY DEFINER` database functions that check the caller's role, validate input, enforce state transitions and write to an append-only audit log. Internal helper functions are revoked from API roles.

**Accounts and access**
- Roles: customer, vendor, admin, finance; roles can only be granted by an admin, never self-assigned (enforced by a column guard).
- View-only staff accounts can read everything and change nothing.
- Blocked accounts lose access in every policy and function, are signed out on their next request and are refused at every sign-in path.
- Personal data erasure for deletion requests anonymises profile and customer records.
- Minimum password length of 10 characters.

**Data protection**
- Customer phone and email are released to a vendor only after the vendor accepts that order, and each reveal is audited.
- Vendor services, posts and photos are pre-moderated; content from paused or removed vendors is hidden everywhere.
- CSV exports are limited to staff and never cached.
- Rate limits protect enquiries, support tickets, vendor applications and analytics events; enquiry submission is idempotent.
- Storage uploads are restricted to images under 5 MB, inside the uploading vendor's own folder.

**Web hardening**
- Content-Security-Policy (no third-party scripts, frames blocked), HSTS with preload, X-Frame-Options DENY, Cross-Origin-Opener-Policy, nosniff, strict referrer policy and a restrictive permissions policy.
- Demo-account credentials are held server-side and never sent to the browser.
- Private areas (`/admin`, `/vendor`, `/account`, auth pages, enquiry pages) are marked noindex.

**Supply chain**
- CI runs `npm audit --omit=dev --audit-level=high`, lint, typecheck, tests and a production build on every push.
- Dependabot opens weekly update pull requests.

## Recommended Supabase settings

- Authentication > Password security: enable leaked password protection and set a minimum length of 10.
- Configure custom SMTP before turning on email confirmation for production.
