-- Role helpers, row level security and column guards.

create or replace function public.my_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'finance') from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_vendor_member(v uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.vendor_members where vendor_id = v and user_id = auth.uid());
$$;

create or replace function public.my_vendor_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select vendor_id from public.vendor_members where user_id = auth.uid();
$$;

create or replace function public.my_customer_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from public.customers where user_id = auth.uid();
$$;

create or replace function public.write_audit(p_action text, p_entity text, p_entity_id text, p_data jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, data)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_data, '{}'::jsonb));
$$;

-- New auth user -> profile (always customer; roles are granted by admins only)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'phone', ''))
  on conflict (id) do nothing;
  -- link earlier guest enquiries made with the same email
  update public.customers set user_id = new.id
   where user_id is null and new.email is not null and lower(email) = lower(new.email);
  update public.enquiries e set user_id = new.id
    from public.customers c
   where e.customer_id = c.id and c.user_id = new.id and e.user_id is null;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Column guards: only admins (or server-side maintenance with no auth user) change privileged fields
create or replace function public.guard_profiles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.id := old.id;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profiles();

create or replace function public.guard_vendors() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.status := old.status;
    new.verification := old.verification;
    new.verification_checks := old.verification_checks;
    new.verified_at := old.verified_at;
    new.is_demo := old.is_demo;
    new.owner_user_id := old.owner_user_id;
    new.slug := old.slug;
  end if;
  return new;
end $$;
create trigger vendors_guard before update on public.vendors
  for each row execute function public.guard_vendors();

-- ---------- Enable RLS everywhere ----------
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.categories enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_members enable row level security;
alter table public.vendor_categories enable row level security;
alter table public.services enable row level security;
alter table public.vendor_media enable row level security;
alter table public.vendor_updates enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_events enable row level security;
alter table public.orders enable row level security;
alter table public.order_transitions enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.analytics_events enable row level security;
alter table public.platform_ledger enable row level security;
alter table public.cost_entries enable row level security;
alter table public.support_tickets enable row level security;
alter table public.notifications enable row level security;
alter table public.settings enable row level security;
alter table public.audit_log enable row level security;
alter table public.rate_limits enable row level security;

-- ---------- Grants (RLS still decides which rows) ----------
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.vendors, public.vendor_categories, public.services,
  public.vendor_media, public.vendor_updates, public.reviews, public.settings, public.order_transitions
  to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.rate_limits, public.audit_log, public.analytics_events,
  public.order_status_history, public.enquiry_events, public.order_transitions from authenticated;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- customers (contact details are private; vendors get contact via an RPC once an order is accepted)
create policy customers_select on public.customers for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy customers_update on public.customers for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- categories
create policy categories_read on public.categories for select to anon, authenticated using (true);
create policy categories_admin on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- vendors
create policy vendors_read on public.vendors for select to anon, authenticated
  using (status = 'active' or public.is_vendor_member(id) or public.is_staff());
create policy vendors_update on public.vendors for update to authenticated
  using (public.is_vendor_member(id) or public.is_admin())
  with check (public.is_vendor_member(id) or public.is_admin());
create policy vendors_admin_insert on public.vendors for insert to authenticated with check (public.is_admin());
create policy vendors_admin_delete on public.vendors for delete to authenticated using (public.is_admin());

create policy vendor_members_read on public.vendor_members for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy vendor_members_admin on public.vendor_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy vendor_categories_read on public.vendor_categories for select to anon, authenticated using (true);
create policy vendor_categories_write on public.vendor_categories for all to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_admin())
  with check (public.is_vendor_member(vendor_id) or public.is_admin());

-- services
create policy services_read on public.services for select to anon, authenticated
  using (
    (active and exists (select 1 from public.vendors v where v.id = vendor_id and v.status = 'active'))
    or public.is_vendor_member(vendor_id) or public.is_staff()
  );
create policy services_write on public.services for all to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_admin())
  with check (public.is_vendor_member(vendor_id) or public.is_admin());

-- media & updates
create policy vendor_media_read on public.vendor_media for select to anon, authenticated using (true);
create policy vendor_media_write on public.vendor_media for all to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_admin())
  with check (public.is_vendor_member(vendor_id) or public.is_admin());
create policy vendor_updates_read on public.vendor_updates for select to anon, authenticated using (true);
create policy vendor_updates_write on public.vendor_updates for all to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_admin())
  with check (public.is_vendor_member(vendor_id) or public.is_admin());

-- enquiries: customers see their own, vendors see enquiries assigned to them, staff see all.
-- Inserts happen only through submit_enquiry().
create policy enquiries_select on public.enquiries for select to authenticated
  using (
    user_id = auth.uid()
    or customer_id in (select public.my_customer_ids())
    or vendor_id in (select public.my_vendor_ids())
    or public.is_staff()
  );
create policy enquiries_admin_update on public.enquiries for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy enquiry_events_select on public.enquiry_events for select to authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.enquiries e where e.id = enquiry_id
               and (e.user_id = auth.uid() or e.vendor_id in (select public.my_vendor_ids())))
  );

-- orders: vendor members, the customer, and staff. Changes go through RPCs.
create policy orders_select on public.orders for select to authenticated
  using (
    vendor_id in (select public.my_vendor_ids())
    or customer_id in (select public.my_customer_ids())
    or public.is_staff()
  );

create policy order_transitions_read on public.order_transitions for select to anon, authenticated using (true);

create policy order_history_select on public.order_status_history for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (
    o.vendor_id in (select public.my_vendor_ids())
    or o.customer_id in (select public.my_customer_ids())
    or public.is_staff())));

create policy payments_select on public.payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (
    o.vendor_id in (select public.my_vendor_ids()) or public.is_staff())));
create policy payments_staff_update on public.payments for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- reviews: approved ones are public
create policy reviews_read on public.reviews for select to anon, authenticated
  using (status = 'approved' or user_id = auth.uid() or public.is_vendor_member(vendor_id) or public.is_staff());
create policy reviews_admin on public.reviews for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy reviews_admin_delete on public.reviews for delete to authenticated using (public.is_admin());

-- follows & likes: users manage their own
create policy follows_own on public.follows for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy follows_vendor_read on public.follows for select to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_staff());
create policy likes_own on public.likes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy likes_vendor_read on public.likes for select to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_staff());

-- analytics: raw events are staff-only; vendors read aggregates via vendor_metrics()
create policy analytics_staff on public.analytics_events for select to authenticated using (public.is_staff());

-- finance
create policy ledger_staff on public.platform_ledger for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy costs_staff on public.cost_entries for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- support
create policy tickets_select on public.support_tickets for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy tickets_admin on public.support_tickets for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- notifications
create policy notifications_select on public.notifications for select to authenticated
  using (
    (audience = 'user' and user_id = auth.uid())
    or (audience = 'vendor' and vendor_id in (select public.my_vendor_ids()))
    or (audience = 'admin' and public.is_staff())
  );
-- marking as read goes through mark_notifications_read()

-- settings
create policy settings_read on public.settings for select to anon, authenticated
  using (is_public or public.is_staff());
create policy settings_admin on public.settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- audit
create policy audit_staff on public.audit_log for select to authenticated using (public.is_staff());
