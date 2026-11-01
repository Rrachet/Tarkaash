-- 0014: email and WhatsApp delivery for notifications, customer notifications, vendor contact details.
--
-- Every row inserted into public.notifications is handed to the `notify-dispatch` Edge Function
-- (pg_net, fire and forget). The function loads the row with the service role, sends email
-- (Resend) and WhatsApp (Meta Cloud API) and records each attempt in notification_deliveries.
-- It only sends rows that are recent and not yet dispatched, so a forged call cannot spam anyone.

create extension if not exists pg_net;

-- ---------- Customers can receive notifications ----------
alter table public.notifications drop constraint if exists notifications_audience_check;
alter table public.notifications add constraint notifications_audience_check
  check (audience in ('admin', 'vendor', 'user', 'customer'));
alter table public.notifications
  add column if not exists customer_id uuid references public.customers (id) on delete cascade,
  add column if not exists event text,
  add column if not exists dispatched_at timestamptz;
create index if not exists notifications_customer_idx on public.notifications (customer_id);

-- ---------- Delivery log ----------
create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications (id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp')),
  recipient text not null,
  redirected_from text,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  provider_id text,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists notification_deliveries_created_idx on public.notification_deliveries (created_at desc);
create index if not exists notification_deliveries_notification_idx on public.notification_deliveries (notification_id);
alter table public.notification_deliveries enable row level security;
create policy notification_deliveries_staff_read on public.notification_deliveries
  for select to authenticated using ((select public.is_staff()));
revoke insert, update, delete on public.notification_deliveries from anon, authenticated;

-- ---------- Settings ----------
insert into public.settings (key, value, is_public, description) values
  ('notifications',
   '{"email_enabled": true, "whatsapp_enabled": true, "demo_email": null, "demo_whatsapp": null}',
   false,
   'Email and WhatsApp delivery. Notifications for demo accounts go to demo_email / demo_whatsapp.')
on conflict (key) do nothing;

-- ---------- Vendor contact details ----------
alter table public.vendors
  add column if not exists phone text,
  add column if not exists address text;

-- ---------- Helper: customer notification ----------
create or replace function public.notify_customer(p_customer uuid, p_event text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (audience, customer_id, event, title, body, link)
  values ('customer', p_customer, p_event, p_title, p_body, p_link);
$$;
revoke execute on function public.notify_customer(uuid, text, text, text, text) from public, anon, authenticated;

create or replace function public._enquiry_customer_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_customer(new.customer_id, 'enquiry.received',
    'We received your enquiry ' || new.ref_code,
    'Thank you. Tarkkash will match you with a provider and confirm the details shortly.',
    '/enquiry/' || new.ref_code);
  return new;
end $$;
revoke execute on function public._enquiry_customer_notify() from public, anon, authenticated;

drop trigger if exists enquiries_customer_notify on public.enquiries;
create trigger enquiries_customer_notify after insert on public.enquiries
  for each row execute function public._enquiry_customer_notify();

create or replace function public._order_customer_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_vendor text; v_enq text;
begin
  if new.status is not distinct from old.status then return new; end if;
  select name into v_vendor from public.vendors where id = new.vendor_id;
  select ref_code into v_enq from public.enquiries where id = new.enquiry_id;
  if new.status = 'accepted' then
    perform public.notify_customer(new.customer_id, 'order.accepted',
      v_vendor || ' confirmed your request',
      'Your enquiry ' || coalesce(v_enq, new.ref_code) || ' has been accepted. The provider will contact you to finalise the details.',
      '/account');
  elsif new.status = 'completed' then
    perform public.notify_customer(new.customer_id, 'order.completed',
      'Your order with ' || v_vendor || ' is complete',
      'We hope it went well. Please take a minute to leave a review on Tarkkash.',
      '/account');
  elsif new.status = 'cancelled' then
    perform public.notify_customer(new.customer_id, 'order.cancelled',
      'Your order ' || new.ref_code || ' was cancelled',
      'Tarkkash will get in touch to help you find another provider.',
      '/account');
  end if;
  return new;
end $$;
revoke execute on function public._order_customer_notify() from public, anon, authenticated;

drop trigger if exists orders_customer_notify on public.orders;
create trigger orders_customer_notify after update of status on public.orders
  for each row execute function public._order_customer_notify();

-- ---------- Hand every new notification to the Edge Function ----------
create or replace function public._dispatch_notification() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_url text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'notify_dispatch_url';
  if v_url is null then return new; end if;
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('notification_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  return new; -- delivery must never block the workflow that created the notification
end $$;
revoke execute on function public._dispatch_notification() from public, anon, authenticated;

drop trigger if exists notifications_dispatch on public.notifications;
create trigger notifications_dispatch after insert on public.notifications
  for each row execute function public._dispatch_notification();

-- Staff can send a test notification (Admin > Settings > Notifications).
create or replace function public.admin_send_test_notification() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorised' using errcode = '42501'; end if;
  insert into public.notifications (audience, user_id, event, title, body, link)
  values ('user', auth.uid(), 'test', 'Test notification from Tarkkash',
          'If you can read this, email and WhatsApp delivery are working.', '/admin/notifications');
end $$;
revoke execute on function public.admin_send_test_notification() from public, anon;
grant execute on function public.admin_send_test_notification() to authenticated;

-- ---------- Vendor applications store phone and address ----------
create or replace function public.create_vendor_application(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_name text := nullif(trim(p ->> 'business_name'), '');
  v_cat uuid := nullif(p ->> 'category_id', '')::uuid;
  v_phone text := nullif(regexp_replace(coalesce(p ->> 'phone', ''), '[^0-9+]', '', 'g'), '');
  v_address text := nullif(trim(p ->> 'address'), '');
  v_slug text;
  v public.vendors;
  t public.support_tickets;
  prof public.profiles;
begin
  if auth.uid() is null then raise exception 'Please sign in to list your service' using errcode = '42501'; end if;
  if exists (select 1 from public.vendor_members where user_id = auth.uid()) then
    raise exception 'Your account already has a provider listing.';
  end if;
  if v_name is null or length(v_name) < 3 then raise exception 'Please enter your business name.'; end if;
  if v_cat is null or not exists (select 1 from public.categories where id = v_cat) then
    raise exception 'Please choose a category.';
  end if;
  if nullif(trim(p ->> 'locality'), '') is null then raise exception 'Please enter your locality.'; end if;
  if v_phone is not null and v_phone !~ '^\+?[0-9]{10,13}$' then raise exception 'Please enter a valid phone number.'; end if;
  if not public.hit_rate_limit('vapp:' || auth.uid(), 3, interval '1 day') then
    raise exception 'Too many applications today. Please try again tomorrow.';
  end if;

  v_slug := public.slugify(v_name);
  if v_slug = '' then v_slug := 'provider'; end if;
  if exists (select 1 from public.vendors where slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end if;

  insert into public.vendors (owner_user_id, slug, name, tagline, description, locality, city, service_area,
                              primary_category_id, status, phone, address)
  values (auth.uid(), v_slug, v_name, nullif(trim(p ->> 'tagline'), ''), nullif(trim(p ->> 'description'), ''),
          trim(p ->> 'locality'), coalesce(nullif(trim(p ->> 'city'), ''), 'Hyderabad'),
          coalesce(array(select trim(x) from unnest(string_to_array(coalesce(p ->> 'service_area', ''), ',')) x where trim(x) <> ''), '{}'),
          v_cat, 'pending', v_phone, v_address)
  returning * into v;
  insert into public.vendor_members (vendor_id, user_id, member_role) values (v.id, auth.uid(), 'owner');
  insert into public.vendor_categories (vendor_id, category_id) values (v.id, v_cat);

  if v_phone is not null then
    update public.profiles set phone = coalesce(phone, v_phone) where id = auth.uid();
  end if;
  if nullif(trim(p ->> 'full_name'), '') is not null then
    update public.profiles set full_name = coalesce(nullif(full_name, ''), trim(p ->> 'full_name')) where id = auth.uid();
  end if;

  select * into prof from public.profiles where id = auth.uid();
  insert into public.support_tickets (topic, name, email, phone, message, details, linked_type, linked_id, user_id, queue, consent_at)
  values ('listing', coalesce(prof.full_name, v_name), prof.email, v_phone,
          'New provider application: ' || v_name, p, 'vendor', v.id, auth.uid(), 'onboarding', now())
  returning * into t;

  perform public.notify('admin', null, null, 'New provider application', v_name || ' · ' || v.locality, '/admin/vendors/' || v.id);
  perform public.notify('vendor', v.id, null, 'Application received: ' || v_name,
    'Thank you for applying. Tarkkash will review your details and get back to you within 2 working days.', '/vendor/profile');
  perform public.write_audit('vendor.applied', 'vendor', v.id::text, jsonb_build_object('ticket', t.ref_code));
  return jsonb_build_object('vendor_id', v.id, 'slug', v.slug, 'ref_code', t.ref_code);
end $$;
