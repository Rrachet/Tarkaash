# Tarkkash end-to-end demo

A 10 to 15 minute walkthrough of the whole product: vendor onboarding, customer enquiry, order lifecycle, and the email and WhatsApp notifications each step sends.

Live site: **https://www.tarkkash.com**. All demo accounts share one password. It is kept out of this public repo: ask the Tarkkash team for it.

| Role | Login | Lands on |
| --- | --- | --- |
| Tarkkash admin (full control) | `amarnathmishra5200@gmail.com` | `/admin` |
| Admin (view only) | `tarkkash.admin@example.com` | `/admin` |
| Vendor: Meera's Home Baking | `meera.baking@example.com` | `/vendor` |
| Customer: Priya | `priya.customer@example.com` | `/account` |

Notifications for demo accounts (`@example.com`) are delivered to the **demo inbox and demo WhatsApp number** set in Admin → Settings → Email & WhatsApp notifications. Real users always get their own.

## Before the demo (2 minutes)

1. Sign in as the full admin. Open **Settings → Email & WhatsApp notifications**.
2. Check both channels are ticked and the demo email and WhatsApp number are yours. Save.
3. Click **Send me a test notification**. Confirm the email and WhatsApp arrive.
4. Keep three windows ready: an incognito window (customer), a normal window (admin), and your phone (WhatsApp and email).

## The script

| # | Who | Do this | What arrives |
| --- | --- | --- | --- |
| 1 | New vendor | Open `/login`, click **Continue with Google**, pick a Google account. Fill **Complete your vendor profile** (name and email pre-filled; add mobile, business address, category, locality) and submit. | Vendor: "Application received" (email + WhatsApp). Admin: "New provider application". |
| 2 | Admin | **Vendors** → open the new vendor → set status **Active** and tick the verification checks. | Vendor: "Listing status: active". |
| 3 | Customer | In the incognito window open `/`, search "cake", open **Meera's Home Baking**, choose a service and send an enquiry with your phone number. The confirmation page shows the reference `TK-…`. | Customer: "We received your enquiry TK-…". Admin: "New enquiry TK-…". |
| 4 | Admin | **Enquiry queue** → open the enquiry → **Assign** to Meera's Home Baking. | Vendor: "New enquiry assigned: TK-…". |
| 5 | Vendor | Sign in as Meera → **Orders & bookings** → open the order → **Accept**, set the agreed price. | Customer: "Meera's Home Baking confirmed your request". |
| 6 | Vendor | Move it to **In progress**, then **Completed**, then **Record payment** and **Submit to Tarkkash**. | Customer: "Your order is complete, please leave a review". Admin: "Order submitted for closure". |
| 7 | Admin | **Orders** → open it → **Close**. | Vendor: "Order closed". |
| 8 | Customer | Sign in as the customer → **My account** shows the timeline; leave a review. Toggle email or WhatsApp updates on the right. | Admin: "Review awaiting moderation". |
| 9 | Admin | **Notifications → Delivery log** shows every email and WhatsApp sent in this demo, with status. | |

Tip: steps 4 to 7 work with the seeded Meera account if you don't want to wait for step 2.

## One-time setup (owner: Om)

These need accounts only the business owner can create. Each takes about 10 minutes.

### 1. Supabase: allow instant sign-ups
Supabase → Authentication → **Sign In / Providers** → Email → turn off **Confirm email** → Save.

### 2. Google sign-in
1. [Google Cloud Console](https://console.cloud.google.com/) → create project "Tarkkash".
2. **APIs & Services → OAuth consent screen**: External, app name "Tarkkash", support email, authorised domain `tarkkash.com`, logo optional. Publish the app.
3. **Credentials → Create credentials → OAuth client ID** → Web application.
   - Authorised JavaScript origins: `https://www.tarkkash.com`
   - Authorised redirect URI: `https://mimlefjoxiagejvyopfd.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client secret into Supabase → Authentication → **Sign In / Providers → Google** → enable → Save.

Google shares name, email and photo. Phone and business address are collected on the vendor profile form right after sign-in.

### 3. Email (Resend)
1. Sign up at [resend.com](https://resend.com) → **Domains → Add domain** `tarkkash.com`.
2. Add the DNS records Resend shows (TXT for SPF and DKIM, MX for bounces) in GoDaddy → DNS. Wait until Resend says **Verified**.
3. **API Keys → Create** (sending access). In Supabase → Edge Functions → **Secrets**, add:
   - `RESEND_API_KEY` = the key
   - `MAIL_FROM` = `Tarkkash <notifications@tarkkash.com>`
4. Same key fixes sign-in codes and password reset: Supabase → Authentication → **Emails → SMTP settings** → host `smtp.resend.com`, port `465`, user `resend`, password = the API key, sender `notifications@tarkkash.com`, name `Tarkkash`.

### 4. WhatsApp (Meta Cloud API)
1. [developers.facebook.com](https://developers.facebook.com/) → **Create app** → Business → add **WhatsApp**.
2. **WhatsApp → API Setup**: note the **Phone number ID** of the free test number, and add up to 5 recipient numbers (your demo phone first) under **To**.
3. Create a permanent token: Business Settings → **System users** → add admin user → **Generate token** for the app with `whatsapp_business_messaging` and `whatsapp_business_management`.
4. **WhatsApp Manager → Message templates → Create**: category **Utility**, name `tarkkash_update`, language **English**, body:
   ```
   Tarkkash: {{1}}

   {{2}}

   View details: {{3}}
   ```
   Sample values: `New enquiry assigned: TK-2611-AB12CD` / `A customer in Kondapur wants a birthday cake on Saturday.` / `https://www.tarkkash.com/vendor/orders`
5. In Supabase → Edge Functions → **Secrets**, add:
   - `WHATSAPP_TOKEN` = the system-user token
   - `WHATSAPP_PHONE_NUMBER_ID` = the phone number ID
   - `WHATSAPP_TEMPLATE` = `tarkkash_update` (until it is approved, use `hello_world`, which Meta pre-approves)

For production, register your own business number in Meta and move it out of test mode. The code does not change.

## How it works

Every workflow step writes a row to `notifications`. A database trigger hands it to the Supabase Edge Function `notify-dispatch`, which finds the right people (vendor team, Tarkkash admins, or the customer), redirects demo accounts to the demo inbox, sends a branded email through Resend and a WhatsApp template through Meta, and records each attempt in `notification_deliveries` (Admin → Notifications → Delivery log). Keys live only in Supabase secrets.
