-- Tarkaash core schema
-- Records and event logs are the single source of truth for operations and analytics.

-- ---------- Enums ----------
create type public.app_role as enum ('customer', 'vendor', 'admin', 'finance');
create type public.vendor_status as enum ('draft', 'pending', 'active', 'paused', 'rejected');
create type public.verification_status as enum ('unverified', 'pending', 'verified');
create type public.enquiry_status as enum ('new', 'assigned', 'in_fulfilment', 'closed', 'cancelled', 'spam');
create type public.order_status as enum (
  'new', 'accepted', 'declined', 'in_progress', 'completed',
  'payment_recorded', 'submitted', 'closed', 'cancelled'
);
create type public.payment_status as enum ('recorded', 'verified', 'rejected');
create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');

-- ---------- Helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.gen_ref(prefix text) returns text
language sql volatile set search_path = public as $$
  select prefix || '-' || to_char(now() at time zone 'Asia/Kolkata', 'YYMM') || '-' ||
         upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

-- ---------- People ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'customer',
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text,
  phone text,
  consent_at timestamptz,
  comm_prefs jsonb not null default '{"email": true, "sms": false, "whatsapp": false}'::jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customers_user_idx on public.customers (user_id);
create index customers_email_idx on public.customers (lower(email));
create index customers_phone_idx on public.customers (phone);
create trigger customers_updated before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------- Catalogue ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text not null default 'sparkles',
  description text,
  sort int not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete set null,
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  locality text,
  city text not null default 'Hyderabad',
  service_area text[] not null default '{}',
  primary_category_id uuid references public.categories (id),
  avatar_url text,
  cover_url text,
  years_experience int,
  languages text[] not null default '{}',
  highlights text[] not null default '{}',
  key_terms text,
  status public.vendor_status not null default 'pending',
  verification public.verification_status not null default 'unverified',
  verification_checks jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vendors_status_idx on public.vendors (status);
create index vendors_category_idx on public.vendors (primary_category_id);
create trigger vendors_updated before update on public.vendors
  for each row execute function public.set_updated_at();

create table public.vendor_members (
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  member_role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (vendor_id, user_id)
);
create index vendor_members_user_idx on public.vendor_members (user_id);

create table public.vendor_categories (
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (vendor_id, category_id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  category_id uuid references public.categories (id),
  title text not null,
  description text,
  price_type text not null default 'from' check (price_type in ('fixed', 'from', 'per_unit', 'quote')),
  price_amount numeric(12, 2),
  price_unit text,
  lead_time text,
  delivery_options text[] not null default '{}',
  availability text,
  attributes jsonb not null default '{}'::jsonb,
  image_url text,
  active boolean not null default true,
  sort int not null default 100,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_vendor_idx on public.services (vendor_id);
create index services_category_idx on public.services (category_id);
create trigger services_updated before update on public.services
  for each row execute function public.set_updated_at();

create table public.vendor_media (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  url text not null,
  caption text,
  sort int not null default 100,
  created_at timestamptz not null default now()
);
create index vendor_media_vendor_idx on public.vendor_media (vendor_id);

create table public.vendor_updates (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);
create index vendor_updates_vendor_idx on public.vendor_updates (vendor_id);

-- ---------- Enquiries & orders ----------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  ref_code text not null unique default public.gen_ref('TK'),
  customer_id uuid not null references public.customers (id),
  user_id uuid references auth.users (id) on delete set null,
  requested_vendor_id uuid references public.vendors (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  category_id uuid references public.categories (id),
  vendor_id uuid references public.vendors (id) on delete set null, -- assigned vendor; null until assigned
  request text not null,
  preferred_date date,
  preferred_time text,
  locality text,
  details jsonb not null default '{}'::jsonb,
  assist_opt_in boolean not null default false,
  assist_fee numeric(10, 2) not null default 0,
  source text not null default 'web',
  status public.enquiry_status not null default 'new',
  idempotency_key text unique,
  assigned_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index enquiries_status_idx on public.enquiries (status, created_at desc);
create index enquiries_vendor_idx on public.enquiries (vendor_id);
create index enquiries_requested_vendor_idx on public.enquiries (requested_vendor_id);
create index enquiries_customer_idx on public.enquiries (customer_id);
create index enquiries_user_idx on public.enquiries (user_id);
create trigger enquiries_updated before update on public.enquiries
  for each row execute function public.set_updated_at();

create table public.enquiry_events (
  id bigint generated always as identity primary key,
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  from_status public.enquiry_status,
  to_status public.enquiry_status,
  vendor_id uuid references public.vendors (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index enquiry_events_enquiry_idx on public.enquiry_events (enquiry_id, created_at);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  ref_code text not null unique default public.gen_ref('OR'),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id),
  customer_id uuid not null references public.customers (id),
  service_id uuid references public.services (id) on delete set null,
  customer_display_name text,
  title text not null,
  scope text,
  agreed_amount numeric(12, 2),
  scheduled_for timestamptz,
  status public.order_status not null default 'new',
  notes text,
  first_response_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  submitted_at timestamptz,
  closed_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_vendor_idx on public.orders (vendor_id, created_at desc);
create index orders_enquiry_idx on public.orders (enquiry_id);
create index orders_customer_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (status);
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_transitions (
  from_status public.order_status not null,
  to_status public.order_status not null,
  actor text not null check (actor in ('vendor', 'admin', 'any')),
  primary key (from_status, to_status)
);
insert into public.order_transitions (from_status, to_status, actor) values
  ('new', 'accepted', 'vendor'),
  ('new', 'declined', 'vendor'),
  ('accepted', 'in_progress', 'vendor'),
  ('accepted', 'cancelled', 'any'),
  ('in_progress', 'completed', 'vendor'),
  ('in_progress', 'cancelled', 'any'),
  ('completed', 'payment_recorded', 'vendor'),
  ('payment_recorded', 'submitted', 'vendor'),
  ('submitted', 'closed', 'admin'),
  ('submitted', 'payment_recorded', 'admin');

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  actor_id uuid references auth.users (id) on delete set null,
  actor_role text,
  note text,
  created_at timestamptz not null default now()
);
create index order_history_order_idx on public.order_status_history (order_id, created_at);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  method text not null check (method in ('cash', 'upi', 'bank_transfer', 'card', 'other')),
  status public.payment_status not null default 'recorded',
  transaction_ref text,
  evidence_url text,
  recorded_by uuid references auth.users (id) on delete set null,
  verified_by uuid references auth.users (id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);
create trigger payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------- Reviews & reactions ----------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  customer_id uuid references public.customers (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  body text,
  status public.moderation_status not null default 'pending',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_vendor_idx on public.reviews (vendor_id, status);
create unique index reviews_order_unique on public.reviews (order_id) where order_id is not null;

create table public.follows (
  user_id uuid not null references auth.users (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  notify_updates boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, vendor_id)
);
create index follows_vendor_idx on public.follows (vendor_id);

create table public.likes (
  user_id uuid not null references auth.users (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vendor_id)
);
create index likes_vendor_idx on public.likes (vendor_id);

-- ---------- Analytics & finance ----------
create table public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  session_id text,
  user_id uuid references auth.users (id) on delete set null,
  vendor_id uuid references public.vendors (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  source text,
  path text,
  meta jsonb not null default '{}'::jsonb,
  privacy_ok boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index analytics_events_vendor_idx on public.analytics_events (vendor_id, event_type, created_at);
create index analytics_events_type_idx on public.analytics_events (event_type, created_at);

create table public.platform_ledger (
  id uuid primary key default gen_random_uuid(),
  txn_type text not null check (txn_type in ('assist_fee', 'commission', 'subscription', 'refund', 'adjustment')),
  order_id uuid references public.orders (id) on delete set null,
  enquiry_id uuid references public.enquiries (id) on delete set null,
  vendor_id uuid references public.vendors (id) on delete set null,
  amount numeric(12, 2) not null,
  direct_cost numeric(12, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  recognized_on date not null default (now() at time zone 'Asia/Kolkata')::date,
  basis text not null default 'accrued' check (basis in ('actual', 'accrued', 'forecast')),
  reconciliation text not null default 'pending' check (reconciliation in ('pending', 'reconciled')),
  note text,
  created_by uuid references auth.users (id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index ledger_recognized_idx on public.platform_ledger (recognized_on);
create unique index ledger_order_type_unique on public.platform_ledger (order_id, txn_type)
  where order_id is not null and txn_type in ('commission', 'assist_fee');

create table public.cost_entries (
  id uuid primary key default gen_random_uuid(),
  cost_type text not null check (cost_type in ('direct', 'operating')),
  label text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  incurred_on date not null,
  basis text not null default 'actual' check (basis in ('actual', 'accrued', 'forecast')),
  created_by uuid references auth.users (id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index cost_entries_date_idx on public.cost_entries (incurred_on);

-- ---------- Support, notifications, settings, audit ----------
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ref_code text not null unique default public.gen_ref('ST'),
  topic text not null check (topic in ('listing', 'support', 'feature', 'partnership', 'general')),
  name text not null,
  email text,
  phone text,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  linked_type text,
  linked_id uuid,
  user_id uuid references auth.users (id) on delete set null,
  status public.ticket_status not null default 'open',
  owner_id uuid references auth.users (id) on delete set null,
  queue text not null default 'operations',
  consent_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index support_tickets_status_idx on public.support_tickets (status, created_at desc);
create trigger support_tickets_updated before update on public.support_tickets
  for each row execute function public.set_updated_at();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('admin', 'vendor', 'user')),
  vendor_id uuid references public.vendors (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_audience_idx on public.notifications (audience, vendor_id, created_at desc);

create table public.settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  description text,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);
create index audit_log_created_idx on public.audit_log (created_at desc);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (key, window_start)
);

-- ---------- Default settings ----------
insert into public.settings (key, value, is_public, description) values
  ('assist', '{"enabled": true, "fee": 49, "currency": "INR", "approved": false, "label": "Tarkaash Assist"}', true,
   'Optional concierge follow-up. Fee is shown to the customer before consent. Not yet approved by product owner.'),
  ('commission', '{"pct": 10, "approved": false}', false,
   'Platform commission on closed orders (percent of agreed amount). Illustrative until approved.'),
  ('boost_thresholds', '{"low_views": 30, "high_views": 100, "min_enquiry_rate": 0.02, "slow_response_hours": 24, "min_enquiries_for_response": 3, "cancel_ratio": 0.25, "min_rating": 3.5, "min_completeness": 80}', false,
   'Rules for the admin boost queue.'),
  ('contact', '{"email": null, "phone": null, "address": null, "confirmed": false}', true,
   'Public contact channels. Shown only once confirmed.'),
  ('enquiry', '{"auto_assign_requested_vendor": false, "max_per_contact_per_hour": 5}', false,
   'Enquiry routing and abuse controls.');
