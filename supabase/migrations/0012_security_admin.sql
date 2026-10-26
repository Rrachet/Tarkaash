-- Security hardening and admin global control:
--   * view-only staff accounts (showcase demo admin/finance) and account blocking
--   * pre-moderation of vendor services, posts and gallery photos
--   * vendor removal, user management and data erasure for admins

-- ---------- 1. Profiles: read-only staff and blocking ----------
alter table public.profiles
  add column if not exists read_only boolean not null default false,
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_reason text;

-- Reads: staff (even view-only) unless blocked.
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'finance') and blocked_at is null from public.profiles where id = auth.uid()), false);
$$;
-- Writes: admins who are not view-only and not blocked.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' and not read_only and blocked_at is null from public.profiles where id = auth.uid()), false);
$$;
create or replace function public.is_staff_writer() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'finance') and not read_only and blocked_at is null from public.profiles where id = auth.uid()), false);
$$;
create or replace function public.is_blocked() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select blocked_at is not null from public.profiles where id = auth.uid()), false);
$$;
-- Blocked users lose vendor and customer membership in every policy and RPC.
create or replace function public.is_vendor_member(v uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.vendor_members where vendor_id = v and user_id = auth.uid()) and not public.is_blocked();
$$;
create or replace function public.my_vendor_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select vendor_id from public.vendor_members where user_id = auth.uid() and not public.is_blocked();
$$;
create or replace function public.my_customer_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from public.customers where user_id = auth.uid() and not public.is_blocked();
$$;
grant execute on function public.is_staff_writer(), public.is_blocked() to anon, authenticated;

-- Only real admins may change roles, view-only or block flags.
create or replace function public.guard_profiles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.id := old.id;
    new.read_only := old.read_only;
    new.blocked_at := old.blocked_at;
    new.blocked_reason := old.blocked_reason;
  end if;
  return new;
end $$;

-- Staff write paths that used is_staff() now require a writable account.
do $$
declare r record; def text;
begin
  for r in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('admin_add_enquiry_note', 'staff_set_payment_status')
  loop
    def := replace(pg_get_functiondef(r.oid), 'public.is_staff()', 'public.is_staff_writer()');
    execute def;
  end loop;
end $$;

drop policy if exists ledger_staff on public.platform_ledger;
create policy ledger_read on public.platform_ledger for select to authenticated using (public.is_staff());
create policy ledger_write on public.platform_ledger for insert to authenticated with check (public.is_staff_writer());
create policy ledger_update on public.platform_ledger for update to authenticated using (public.is_staff_writer()) with check (public.is_staff_writer());
drop policy if exists costs_staff on public.cost_entries;
create policy costs_read on public.cost_entries for select to authenticated using (public.is_staff());
create policy costs_write on public.cost_entries for insert to authenticated with check (public.is_staff_writer());
create policy costs_update on public.cost_entries for update to authenticated using (public.is_staff_writer()) with check (public.is_staff_writer());
create policy costs_delete on public.cost_entries for delete to authenticated using (public.is_staff_writer());

-- ---------- 2. Content moderation ----------
alter table public.services
  add column if not exists moderation public.moderation_status not null default 'approved',
  add column if not exists moderation_note text,
  add column if not exists moderated_by uuid references auth.users (id) on delete set null,
  add column if not exists moderated_at timestamptz;
alter table public.vendor_updates
  add column if not exists moderation public.moderation_status not null default 'approved',
  add column if not exists moderation_note text,
  add column if not exists moderated_by uuid references auth.users (id) on delete set null,
  add column if not exists moderated_at timestamptz;
alter table public.vendor_media
  add column if not exists moderation public.moderation_status not null default 'approved',
  add column if not exists moderation_note text,
  add column if not exists moderated_by uuid references auth.users (id) on delete set null,
  add column if not exists moderated_at timestamptz;
-- Existing rows stay approved (defaults above); new vendor content defaults to pending via the trigger.
create index if not exists services_moderation_idx on public.services (moderation) where moderation <> 'approved';
create index if not exists vendor_updates_moderation_idx on public.vendor_updates (moderation) where moderation <> 'approved';
create index if not exists vendor_media_moderation_idx on public.vendor_media (moderation) where moderation <> 'approved';
create index if not exists services_moderated_by_idx on public.services (moderated_by);
create index if not exists vendor_updates_moderated_by_idx on public.vendor_updates (moderated_by);
create index if not exists vendor_media_moderated_by_idx on public.vendor_media (moderated_by);

insert into public.settings (key, value, is_public, description)
values ('moderation', '{"require_approval": true}'::jsonb, false, 'New or edited vendor services, posts and photos wait for admin approval before going live.')
on conflict (key) do nothing;

create or replace function public.moderation_required() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (value ->> 'require_approval')::boolean from public.settings where key = 'moderation'), true);
$$;

-- Vendors cannot approve their own content; new or changed content goes back to review.
create or replace function public.guard_moderation() returns trigger
language plpgsql security definer set search_path = public as $$
declare changed boolean := false;
begin
  if auth.uid() is null then return new; end if;            -- server maintenance / seed
  if public.is_admin() then
    if tg_op = 'INSERT' and new.moderation = 'pending' then new.moderation := 'approved'; end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    changed := true;
  elsif tg_table_name = 'services' then
    changed := (new.title, new.description, new.image_url, new.attributes, new.price_amount, new.price_unit, new.price_type)
               is distinct from (old.title, old.description, old.image_url, old.attributes, old.price_amount, old.price_unit, old.price_type);
  elsif tg_table_name = 'vendor_updates' then
    changed := (new.title, new.body) is distinct from (old.title, old.body);
  elsif tg_table_name = 'vendor_media' then
    changed := (new.url, new.caption) is distinct from (old.url, old.caption);
  end if;
  if changed then
    new.moderation := case when public.moderation_required() then 'pending'::public.moderation_status else 'approved'::public.moderation_status end;
    new.moderation_note := null; new.moderated_by := null; new.moderated_at := null;
  else
    new.moderation := old.moderation; new.moderation_note := old.moderation_note;
    new.moderated_by := old.moderated_by; new.moderated_at := old.moderated_at;
  end if;
  return new;
end $$;
drop trigger if exists services_moderation on public.services;
create trigger services_moderation before insert or update on public.services for each row execute function public.guard_moderation();
drop trigger if exists vendor_updates_moderation on public.vendor_updates;
create trigger vendor_updates_moderation before insert or update on public.vendor_updates for each row execute function public.guard_moderation();
drop trigger if exists vendor_media_moderation on public.vendor_media;
create trigger vendor_media_moderation before insert or update on public.vendor_media for each row execute function public.guard_moderation();

-- Public sees only approved content from active vendors; owners and staff see everything.
drop policy if exists services_read on public.services;
create policy services_read on public.services for select to anon, authenticated
  using (
    (active and moderation = 'approved' and exists (select 1 from public.vendors v where v.id = vendor_id and v.status = 'active'))
    or public.is_vendor_member(vendor_id) or public.is_staff()
  );
drop policy if exists vendor_media_read on public.vendor_media;
create policy vendor_media_read on public.vendor_media for select to anon, authenticated
  using (
    (moderation = 'approved' and exists (select 1 from public.vendors v where v.id = vendor_id and v.status = 'active'))
    or public.is_vendor_member(vendor_id) or public.is_staff()
  );
drop policy if exists vendor_updates_read on public.vendor_updates;
create policy vendor_updates_read on public.vendor_updates for select to anon, authenticated
  using (
    (moderation = 'approved' and exists (select 1 from public.vendors v where v.id = vendor_id and v.status = 'active'))
    or public.is_vendor_member(vendor_id) or public.is_staff()
  );

create or replace function public.admin_moderate(p_kind text, p_id uuid, p_action text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_vendor uuid; v_title text; v_table text;
begin
  if not public.is_admin() then raise exception 'Not authorised' using errcode = '42501'; end if;
  v_table := case p_kind when 'service' then 'services' when 'update' then 'vendor_updates' when 'media' then 'vendor_media' end;
  if v_table is null then raise exception 'Unknown content type'; end if;
  if p_action not in ('approve', 'reject', 'delete') then raise exception 'Unknown action'; end if;
  if p_action in ('reject', 'delete') and coalesce(length(trim(p_note)), 0) < 3 then
    raise exception 'Please give a short reason';
  end if;
  execute format('select vendor_id, %s from public.%I where id = $1',
                 case p_kind when 'service' then 'title' when 'update' then 'title' else 'coalesce(caption, ''Photo'')' end, v_table)
    into v_vendor, v_title using p_id;
  if v_vendor is null then raise exception 'Content not found'; end if;

  if p_action = 'delete' then
    execute format('delete from public.%I where id = $1', v_table) using p_id;
  else
    execute format('update public.%I set moderation = $1, moderation_note = $2, moderated_by = auth.uid(), moderated_at = now() where id = $3', v_table)
      using (case p_action when 'approve' then 'approved' else 'rejected' end)::public.moderation_status, nullif(trim(p_note), ''), p_id;
  end if;

  perform public.notify('vendor', v_vendor, null,
    case p_action when 'approve' then 'Approved: ' when 'reject' then 'Not approved: ' else 'Removed by Tarkaash: ' end || coalesce(v_title, p_kind),
    p_note, case p_kind when 'service' then '/vendor/services' when 'update' then '/vendor/followers' else '/vendor/profile' end);
  perform public.write_audit('content.' || p_action, p_kind, p_id::text, jsonb_build_object('vendor_id', v_vendor, 'title', v_title, 'note', p_note));
end $$;

-- ---------- 3. Vendor removal ----------
alter table public.vendors
  add column if not exists removed_at timestamptz,
  add column if not exists removed_reason text;

-- Vendors cannot undo a removal themselves.
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
    new.removed_at := old.removed_at;
    new.removed_reason := old.removed_reason;
  end if;
  return new;
end $$;

create or replace function public.admin_remove_vendor(p_vendor uuid, p_reason text, p_permanent boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare v public.vendors; o record; n_orders int; n_payments int;
begin
  if not public.is_admin() then raise exception 'Not authorised' using errcode = '42501'; end if;
  if coalesce(length(trim(p_reason)), 0) < 5 then raise exception 'Please give a reason (at least 5 characters)'; end if;
  select * into v from public.vendors where id = p_vendor for update;
  if not found then raise exception 'Vendor not found'; end if;

  select count(*) into n_orders from public.orders where vendor_id = p_vendor;
  select count(*) into n_payments from public.payments p join public.orders x on x.id = p.order_id where x.vendor_id = p_vendor;

  -- Members lose vendor access (kept as customers) unless they belong to another active vendor.
  update public.profiles pr set role = 'customer'
   where pr.role = 'vendor'
     and pr.id in (select user_id from public.vendor_members where vendor_id = p_vendor)
     and not exists (select 1 from public.vendor_members m join public.vendors x on x.id = m.vendor_id
                     where m.user_id = pr.id and m.vendor_id <> p_vendor and x.status = 'active');

  if p_permanent and n_orders = 0 and n_payments = 0 then
    perform public.write_audit('vendor.deleted', 'vendor', p_vendor::text, jsonb_build_object('name', v.name, 'reason', p_reason));
    delete from public.vendors where id = p_vendor;
    return 'deleted';
  end if;

  -- Open work is cancelled and the enquiries go back to the admin queue for reassignment.
  for o in select * from public.orders where vendor_id = p_vendor and status in ('new', 'accepted', 'in_progress') for update loop
    update public.orders set status = 'cancelled' where id = o.id;
    insert into public.order_status_history (order_id, from_status, to_status, actor_id, actor_role, note)
    values (o.id, o.status, 'cancelled', auth.uid(), 'admin', 'Vendor removed by Tarkaash');
    update public.enquiries set status = 'new', vendor_id = null, assigned_at = null where id = o.enquiry_id and status <> 'closed';
    insert into public.enquiry_events (enquiry_id, actor_id, action, from_status, to_status, vendor_id, note)
    values (o.enquiry_id, auth.uid(), 'returned', 'assigned', 'new', p_vendor, 'Vendor removed; needs reassignment');
  end loop;

  update public.vendors set status = 'removed', removed_at = now(), removed_reason = trim(p_reason) where id = p_vendor;
  perform public.notify('vendor', p_vendor, null, 'Your listing has been removed', p_reason, '/vendor/profile');
  perform public.write_audit('vendor.removed', 'vendor', p_vendor::text,
    jsonb_build_object('name', v.name, 'reason', p_reason, 'orders', n_orders, 'permanent_requested', p_permanent));
  return case when p_permanent then 'archived' else 'removed' end;
end $$;

-- ---------- 4. Users ----------
create or replace function public.admin_list_users(p_search text default null, p_role public.app_role default null,
                                                   p_blocked boolean default null, p_limit int default 50, p_offset int default 0)
returns table (id uuid, email text, full_name text, phone text, role public.app_role, read_only boolean,
               blocked_at timestamptz, blocked_reason text, created_at timestamptz, last_sign_in_at timestamptz,
               enquiries bigint, vendor_name text, total bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Not authorised' using errcode = '42501'; end if;
  return query
  select p.id, coalesce(u.email, p.email)::text, p.full_name, p.phone, p.role, p.read_only, p.blocked_at, p.blocked_reason,
         p.created_at, u.last_sign_in_at,
         (select count(*) from public.enquiries e where e.user_id = p.id),
         (select string_agg(v.name, ', ') from public.vendor_members m join public.vendors v on v.id = m.vendor_id where m.user_id = p.id),
         count(*) over ()
    from public.profiles p
    left join auth.users u on u.id = p.id
   where (p_role is null or p.role = p_role)
     and (p_blocked is null or (p.blocked_at is not null) = p_blocked)
     and (p_search is null or p_search = '' or
          coalesce(u.email, p.email, '') ilike '%' || p_search || '%' or coalesce(p.full_name, '') ilike '%' || p_search || '%'
          or coalesce(p.phone, '') ilike '%' || p_search || '%')
   order by p.created_at desc
   limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0);
end $$;

create or replace function public.admin_set_user_blocked(p_user uuid, p_blocked boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorised' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'You cannot block your own account'; end if;
  if p_blocked and coalesce(length(trim(p_reason)), 0) < 3 then raise exception 'Please give a reason'; end if;
  update public.profiles set blocked_at = case when p_blocked then now() end,
                             blocked_reason = case when p_blocked then trim(p_reason) end
   where id = p_user;
  if not found then raise exception 'User not found'; end if;
  perform public.write_audit(case when p_blocked then 'user.blocked' else 'user.unblocked' end, 'user', p_user::text,
                             jsonb_build_object('reason', p_reason));
end $$;

-- DPDP-style erasure: removes personal details from profile and customer records and blocks the login.
create or replace function public.admin_erase_user(p_user uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorised' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'You cannot erase your own account'; end if;
  if coalesce(length(trim(p_reason)), 0) < 3 then raise exception 'Please give a reason'; end if;
  update public.profiles set full_name = 'Erased user', phone = null, email = null,
                             blocked_at = coalesce(blocked_at, now()), blocked_reason = 'Personal data erased'
   where id = p_user;
  if not found then raise exception 'User not found'; end if;
  update public.customers set name = 'Erased customer', email = null, phone = null, comm_prefs = '{}'::jsonb where user_id = p_user;
  perform public.write_audit('user.erased', 'user', p_user::text, jsonb_build_object('reason', p_reason));
end $$;

-- Role changes cannot target your own account.
create or replace function public.admin_set_role(p_user uuid, p_role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
declare v_old public.app_role;
begin
  if not public.is_admin() then raise exception 'Not authorised' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'You cannot change your own role'; end if;
  select role into v_old from public.profiles where id = p_user;
  if not found then raise exception 'User not found'; end if;
  update public.profiles set role = p_role where id = p_user;
  perform public.write_audit('user.role', 'user', p_user::text, jsonb_build_object('from', v_old, 'to', p_role));
end $$;

-- ---------- 5. Grants ----------
revoke execute on function public.admin_moderate(text, uuid, text, text), public.admin_remove_vendor(uuid, text, boolean),
  public.admin_list_users(text, public.app_role, boolean, int, int), public.admin_set_user_blocked(uuid, boolean, text),
  public.admin_erase_user(uuid, text), public.admin_set_role(uuid, public.app_role),
  public.moderation_required(), public.guard_moderation()
  from public, anon;
grant execute on function public.admin_moderate(text, uuid, text, text), public.admin_remove_vendor(uuid, text, boolean),
  public.admin_list_users(text, public.app_role, boolean, int, int), public.admin_set_user_blocked(uuid, boolean, text),
  public.admin_erase_user(uuid, text), public.admin_set_role(uuid, public.app_role)
  to authenticated;

-- ---------- 6. Showcase staff accounts are view-only ----------
update public.profiles set read_only = true
 where email in ('tarkaash.admin@example.com', 'tarkaash.finance@example.com');
