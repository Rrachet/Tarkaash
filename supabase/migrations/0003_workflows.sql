-- Workflow functions. All privileged writes go through these so every change is validated and logged.

insert into public.settings (key, value, is_public, description) values
  ('verification', '{
     "badge_label": "Tarkaash Verified",
     "explanation": "Tarkaash staff have checked this provider''s identity, service area, any licence their category needs, and samples of their work. It is not a guarantee of quality.",
     "checks": [
       {"key": "identity", "label": "Identity document checked"},
       {"key": "address", "label": "Address and service area confirmed"},
       {"key": "licence", "label": "Category licence (e.g. FSSAI) checked or not applicable"},
       {"key": "quality", "label": "Sample work or catalogue reviewed"}
     ]}', true, 'Verification checklist and badge wording (pending product-owner approval).')
on conflict (key) do nothing;

-- ---------- Rate limiting ----------
create or replace function public.hit_rate_limit(p_key text, p_max int, p_window interval)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_secs double precision := extract(epoch from p_window);
  v_bucket timestamptz := to_timestamp(floor(extract(epoch from now()) / v_secs) * v_secs);
  v_hits int;
begin
  insert into public.rate_limits (key, window_start, hits) values (p_key, v_bucket, 1)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;
  return v_hits <= p_max;
end $$;

create or replace function public.notify(p_audience text, p_vendor uuid, p_user uuid, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (audience, vendor_id, user_id, title, body, link)
  values (p_audience, p_vendor, p_user, p_title, p_body, p_link);
$$;

-- ---------- Enquiries ----------
create or replace function public._assign_enquiry(p_enquiry uuid, p_vendor uuid, p_note text)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  e public.enquiries;
  v public.vendors;
  s public.services;
  c public.customers;
  o public.orders;
  v_title text;
begin
  select * into e from public.enquiries where id = p_enquiry for update;
  if not found then raise exception 'Enquiry not found'; end if;
  if e.status <> 'new' then raise exception 'This enquiry is already %', e.status; end if;
  select * into v from public.vendors where id = p_vendor;
  if not found or v.status <> 'active' then raise exception 'Choose an active vendor'; end if;
  if e.service_id is not null then
    select * into s from public.services where id = e.service_id and vendor_id = p_vendor;
  end if;
  select * into c from public.customers where id = e.customer_id;
  v_title := coalesce(s.title, (select name from public.categories where id = e.category_id) || ' request', 'Service request');

  insert into public.orders (enquiry_id, vendor_id, customer_id, service_id, customer_display_name, title, scope,
                             scheduled_for, is_demo)
  values (e.id, p_vendor, e.customer_id, s.id, split_part(c.name, ' ', 1), v_title, e.request,
          e.preferred_date::timestamptz, e.is_demo)
  returning * into o;

  insert into public.order_status_history (order_id, from_status, to_status, actor_id, actor_role, note)
  values (o.id, null, 'new', auth.uid(), 'admin', coalesce(p_note, 'Assigned by Tarkaash'));

  update public.enquiries set status = 'assigned', vendor_id = p_vendor, assigned_at = now() where id = e.id;
  insert into public.enquiry_events (enquiry_id, actor_id, action, from_status, to_status, vendor_id, note)
  values (e.id, auth.uid(), 'assigned', 'new', 'assigned', p_vendor, p_note);

  perform public.notify('vendor', p_vendor, null, 'New enquiry assigned: ' || e.ref_code,
                        v_title || coalesce(' · ' || to_char(e.preferred_date, 'DD Mon'), ''), '/vendor/orders/' || o.id);
  perform public.write_audit('enquiry.assigned', 'enquiry', e.id::text,
                             jsonb_build_object('vendor_id', p_vendor, 'order_id', o.id, 'note', p_note));
  return o;
end $$;

create or replace function public.submit_enquiry(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_key text := nullif(trim(p ->> 'idempotency_key'), '');
  v_name text := nullif(trim(p ->> 'name'), '');
  v_email text := lower(nullif(trim(p ->> 'email'), ''));
  v_phone text := nullif(regexp_replace(coalesce(p ->> 'phone', ''), '[^0-9+]', '', 'g'), '');
  v_request text := nullif(trim(p ->> 'request'), '');
  v_found record;
  v_customer uuid;
  v_vendor public.vendors;
  v_service public.services;
  v_category uuid := nullif(p ->> 'category_id', '')::uuid;
  v_assist jsonb;
  v_opt boolean := coalesce((p ->> 'assist_opt_in')::boolean, false);
  v_fee numeric := 0;
  v_cfg jsonb;
  v_enq public.enquiries;
  v_date date := nullif(p ->> 'preferred_date', '')::date;
begin
  if v_key is not null then
    select id, ref_code into v_found from public.enquiries where idempotency_key = v_key;
    if found then
      return jsonb_build_object('id', v_found.id, 'ref_code', v_found.ref_code, 'duplicate', true);
    end if;
  end if;

  if v_name is null or length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'Please enter your name.' using errcode = '22023';
  end if;
  if v_email is null and v_phone is null then
    raise exception 'Please add a phone number or email so Tarkaash can reach you.' using errcode = '22023';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  if v_phone is not null and v_phone !~ '^\+?[0-9]{10,13}$' then
    raise exception 'Please enter a valid 10-digit phone number.' using errcode = '22023';
  end if;
  if v_request is null or length(v_request) < 10 then
    raise exception 'Please describe what you need in at least 10 characters.' using errcode = '22023';
  end if;
  if length(v_request) > 2000 then
    raise exception 'Please keep your request under 2000 characters.' using errcode = '22023';
  end if;
  if coalesce((p ->> 'consent')::boolean, false) is not true then
    raise exception 'Please agree to be contacted about this enquiry.' using errcode = '22023';
  end if;
  if v_date is not null and v_date < (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'Preferred date cannot be in the past.' using errcode = '22023';
  end if;

  select value into v_cfg from public.settings where key = 'enquiry';
  if not public.hit_rate_limit('enq:' || coalesce(v_email, v_phone),
                               coalesce((v_cfg ->> 'max_per_contact_per_hour')::int, 5), interval '1 hour') then
    raise exception 'Too many enquiries from this contact. Please try again in a little while.' using errcode = 'P0429';
  end if;

  -- Resolve service / vendor / category
  if nullif(p ->> 'service_id', '') is not null then
    select s.* into v_service from public.services s join public.vendors v on v.id = s.vendor_id
     where s.id = (p ->> 'service_id')::uuid and s.active and v.status = 'active';
    if not found then raise exception 'That service is no longer available.' using errcode = '22023'; end if;
    select * into v_vendor from public.vendors where id = v_service.vendor_id;
    v_category := coalesce(v_service.category_id, v_vendor.primary_category_id);
  elsif nullif(p ->> 'vendor_id', '') is not null then
    select * into v_vendor from public.vendors where id = (p ->> 'vendor_id')::uuid and status = 'active';
    if not found then raise exception 'That provider is not currently taking enquiries.' using errcode = '22023'; end if;
    v_category := coalesce(v_category, v_vendor.primary_category_id);
  end if;

  -- Soft duplicate check: same contact, same provider, same request within 10 minutes
  select e.id, e.ref_code into v_found from public.enquiries e join public.customers c on c.id = e.customer_id
   where e.created_at > now() - interval '10 minutes'
     and (c.email = v_email or c.phone = v_phone)
     and e.requested_vendor_id is not distinct from v_vendor.id
     and e.request = v_request
   limit 1;
  if found then
    return jsonb_build_object('id', v_found.id, 'ref_code', v_found.ref_code, 'duplicate', true);
  end if;

  -- Customer record (signed-in users reuse theirs; guests get a fresh record)
  if auth.uid() is not null then
    select id into v_customer from public.customers where user_id = auth.uid() order by created_at limit 1;
    if v_customer is null then
      insert into public.customers (user_id, name, email, phone, consent_at)
      values (auth.uid(), v_name, v_email, v_phone, now()) returning id into v_customer;
    else
      update public.customers set name = v_name, email = coalesce(v_email, email), phone = coalesce(v_phone, phone),
             consent_at = now() where id = v_customer;
    end if;
  else
    insert into public.customers (name, email, phone, consent_at)
    values (v_name, v_email, v_phone, now()) returning id into v_customer;
  end if;

  select value into v_assist from public.settings where key = 'assist';
  if v_opt and coalesce((v_assist ->> 'enabled')::boolean, false) then
    v_fee := coalesce((v_assist ->> 'fee')::numeric, 0);
  else
    v_opt := false;
  end if;

  insert into public.enquiries (customer_id, user_id, requested_vendor_id, service_id, category_id, request,
                                preferred_date, preferred_time, locality, details, assist_opt_in, assist_fee,
                                source, idempotency_key)
  values (v_customer, auth.uid(), v_vendor.id, v_service.id, v_category, v_request, v_date,
          nullif(trim(p ->> 'preferred_time'), ''), nullif(trim(p ->> 'locality'), ''),
          coalesce(p -> 'details', '{}'::jsonb), v_opt, v_fee, coalesce(nullif(p ->> 'source', ''), 'web'), v_key)
  returning * into v_enq;

  insert into public.enquiry_events (enquiry_id, actor_id, action, to_status, vendor_id, note)
  values (v_enq.id, auth.uid(), 'created', 'new', v_vendor.id, 'Submitted via ' || v_enq.source);

  insert into public.analytics_events (event_type, session_id, user_id, vendor_id, service_id, source)
  values ('enquiry_submitted', nullif(p ->> 'session_id', ''), auth.uid(), v_vendor.id, v_service.id, v_enq.source);

  perform public.notify('admin', null, null, 'New enquiry ' || v_enq.ref_code,
                        coalesce(v_service.title, v_vendor.name, 'General request') || ' · ' || v_name,
                        '/admin/enquiries/' || v_enq.id);

  if v_vendor.id is not null and coalesce((v_cfg ->> 'auto_assign_requested_vendor')::boolean, false) then
    perform public._assign_enquiry(v_enq.id, v_vendor.id, 'Auto-assigned to requested provider');
  end if;

  return jsonb_build_object('id', v_enq.id, 'ref_code', v_enq.ref_code, 'duplicate', false);
end $$;

create or replace function public.admin_assign_enquiry(p_enquiry uuid, p_vendor uuid, p_note text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only Tarkaash staff can assign enquiries' using errcode = '42501'; end if;
  return public._assign_enquiry(p_enquiry, p_vendor, nullif(trim(p_note), ''));
end $$;

create or replace function public.admin_set_enquiry_status(p_enquiry uuid, p_status public.enquiry_status, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare e public.enquiries;
begin
  if not public.is_admin() then raise exception 'Not authorised' using errcode = '42501'; end if;
  select * into e from public.enquiries where id = p_enquiry for update;
  if not found then raise exception 'Enquiry not found'; end if;
  if p_status not in ('cancelled', 'spam', 'closed', 'new') then raise exception 'Use assignment to change this status'; end if;
  if p_status = 'new' and e.status not in ('cancelled', 'spam') then raise exception 'Only cancelled or spam enquiries can be reopened'; end if;
  if e.status in ('assigned', 'in_fulfilment') and exists (
       select 1 from public.orders where enquiry_id = e.id and status not in ('declined', 'cancelled', 'closed')) then
    raise exception 'This enquiry has an open order. Cancel the order first.';
  end if;
  update public.enquiries set status = p_status where id = e.id;
  insert into public.enquiry_events (enquiry_id, actor_id, action, from_status, to_status, note)
  values (e.id, auth.uid(), 'status_changed', e.status, p_status, p_note);
  perform public.write_audit('enquiry.status', 'enquiry', e.id::text, jsonb_build_object('from', e.status, 'to', p_status, 'note', p_note));
end $$;

create or replace function public.admin_add_enquiry_note(p_enquiry uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Not authorised' using errcode = '42501'; end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'Note cannot be empty'; end if;
  insert into public.enquiry_events (enquiry_id, actor_id, action, note) values (p_enquiry, auth.uid(), 'note', trim(p_note));
end $$;

-- ---------- Orders ----------
create or replace function public.transition_order(p_order uuid, p_to public.order_status, p_note text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  t public.order_transitions;
  e public.enquiries;
  v_actor text;
  v_cfg jsonb;
  v_pct numeric;
  v_note text := nullif(trim(p_note), '');
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;

  if public.is_admin() then v_actor := 'admin';
  elsif public.is_vendor_member(o.vendor_id) then v_actor := 'vendor';
  else raise exception 'You do not have access to this order' using errcode = '42501';
  end if;

  select * into t from public.order_transitions where from_status = o.status and to_status = p_to;
  if not found then
    raise exception 'An order that is % cannot be moved to %', replace(o.status::text, '_', ' '), replace(p_to::text, '_', ' ');
  end if;
  if t.actor = 'admin' and v_actor <> 'admin' then
    raise exception 'Only Tarkaash staff can make this change' using errcode = '42501';
  end if;
  if p_to = 'declined' and v_note is null then
    raise exception 'Please give a short reason for declining so Tarkaash can reassign it.';
  end if;
  if p_to = 'completed' and o.agreed_amount is null then
    raise exception 'Add the agreed price before marking the order completed.';
  end if;
  if p_to = 'payment_recorded' and not exists (
       select 1 from public.payments where order_id = o.id and status <> 'rejected') then
    raise exception 'Record a payment first.';
  end if;

  update public.orders set
    status = p_to,
    first_response_at = coalesce(first_response_at, case when o.status = 'new' then now() end),
    accepted_at  = case when p_to = 'accepted'  then now() else accepted_at end,
    declined_at  = case when p_to = 'declined'  then now() else declined_at end,
    completed_at = case when p_to = 'completed' then now() else completed_at end,
    cancelled_at = case when p_to = 'cancelled' then now() else cancelled_at end,
    submitted_at = case when p_to = 'submitted' then now() else submitted_at end,
    closed_at    = case when p_to = 'closed'    then now() else closed_at end
  where id = o.id
  returning * into o;

  insert into public.order_status_history (order_id, from_status, to_status, actor_id, actor_role, note)
  values (o.id, t.from_status, p_to, auth.uid(), v_actor, v_note);

  select * into e from public.enquiries where id = o.enquiry_id for update;

  if p_to = 'declined' then
    update public.enquiries set status = 'new', vendor_id = null, assigned_at = null where id = e.id;
    insert into public.enquiry_events (enquiry_id, actor_id, action, from_status, to_status, vendor_id, note)
    values (e.id, auth.uid(), 'returned', e.status, 'new', o.vendor_id, v_note);
    perform public.notify('admin', null, null, 'Declined, reassign ' || e.ref_code, v_note, '/admin/enquiries/' || e.id);
  elsif p_to = 'accepted' then
    update public.enquiries set status = 'in_fulfilment' where id = e.id;
    insert into public.enquiry_events (enquiry_id, actor_id, action, from_status, to_status, vendor_id)
    values (e.id, auth.uid(), 'accepted', e.status, 'in_fulfilment', o.vendor_id);
  elsif p_to = 'cancelled' then
    update public.enquiries set status = 'cancelled' where id = e.id;
    insert into public.enquiry_events (enquiry_id, actor_id, action, from_status, to_status, vendor_id, note)
    values (e.id, auth.uid(), 'cancelled', e.status, 'cancelled', o.vendor_id, v_note);
    perform public.notify('admin', null, null, 'Order cancelled ' || o.ref_code, v_note, '/admin/orders/' || o.id);
  elsif p_to = 'submitted' then
    perform public.notify('admin', null, null, 'Order submitted for closure ' || o.ref_code,
                          'Agreed ₹' || coalesce(o.agreed_amount::text, 'N/A'), '/admin/orders/' || o.id);
  elsif p_to = 'payment_recorded' and v_actor = 'admin' and t.from_status = 'submitted' then
    perform public.notify('vendor', o.vendor_id, null, 'Submission returned ' || o.ref_code, v_note, '/vendor/orders/' || o.id);
  elsif p_to = 'closed' then
    update public.enquiries set status = 'closed' where id = e.id;
    insert into public.enquiry_events (enquiry_id, actor_id, action, from_status, to_status, vendor_id)
    values (e.id, auth.uid(), 'closed', e.status, 'closed', o.vendor_id);
    select value into v_cfg from public.settings where key = 'commission';
    v_pct := coalesce((v_cfg ->> 'pct')::numeric, 0);
    if v_pct > 0 and coalesce(o.agreed_amount, 0) > 0 then
      insert into public.platform_ledger (txn_type, order_id, enquiry_id, vendor_id, amount, basis, note, created_by, is_demo)
      values ('commission', o.id, e.id, o.vendor_id, round(o.agreed_amount * v_pct / 100, 2), 'accrued',
              v_pct || '% commission on closed order', auth.uid(), o.is_demo)
      on conflict do nothing;
    end if;
    if e.assist_opt_in and e.assist_fee > 0 then
      insert into public.platform_ledger (txn_type, order_id, enquiry_id, vendor_id, amount, basis, note, created_by, is_demo)
      values ('assist_fee', o.id, e.id, o.vendor_id, e.assist_fee, 'accrued', 'Tarkaash Assist fee', auth.uid(), o.is_demo)
      on conflict do nothing;
    end if;
    perform public.notify('vendor', o.vendor_id, null, 'Order closed ' || o.ref_code, 'Thank you, this order is complete.', '/vendor/orders/' || o.id);
  end if;

  perform public.write_audit('order.' || p_to, 'order', o.id::text,
                             jsonb_build_object('from', t.from_status, 'to', p_to, 'note', v_note, 'actor_role', v_actor));
  return o;
end $$;

create or replace function public.vendor_update_order(p_order uuid, p_amount numeric, p_scheduled timestamptz,
                                                      p_scope text, p_notes text)
returns public.orders language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;
  if not (public.is_vendor_member(o.vendor_id) or public.is_admin()) then
    raise exception 'You do not have access to this order' using errcode = '42501';
  end if;
  if o.status in ('declined', 'cancelled', 'submitted', 'closed') then
    raise exception 'This order can no longer be edited.';
  end if;
  if p_amount is not null and p_amount < 0 then raise exception 'Price cannot be negative.'; end if;
  update public.orders set agreed_amount = p_amount, scheduled_for = p_scheduled,
         scope = nullif(trim(p_scope), ''), notes = nullif(trim(p_notes), '')
   where id = o.id returning * into o;
  perform public.write_audit('order.updated', 'order', o.id::text,
                             jsonb_build_object('agreed_amount', p_amount, 'scheduled_for', p_scheduled));
  return o;
end $$;

create or replace function public.record_payment(p_order uuid, p_amount numeric, p_method text,
                                                 p_ref text default null, p_evidence text default null)
returns public.payments language plpgsql security definer set search_path = public as $$
declare o public.orders; pay public.payments;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;
  if not (public.is_vendor_member(o.vendor_id) or public.is_admin()) then
    raise exception 'You do not have access to this order' using errcode = '42501';
  end if;
  if o.status not in ('completed', 'payment_recorded') then
    raise exception 'Payments can be recorded once the order is completed.';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter the amount received.'; end if;
  if p_method not in ('cash', 'upi', 'bank_transfer', 'card', 'other') then raise exception 'Choose a payment method.'; end if;
  if p_method <> 'cash' and coalesce(trim(p_ref), '') = '' then
    raise exception 'Add the transaction reference for non-cash payments.';
  end if;
  insert into public.payments (order_id, amount, method, transaction_ref, evidence_url, recorded_by, is_demo)
  values (o.id, p_amount, p_method, nullif(trim(p_ref), ''), nullif(trim(p_evidence), ''), auth.uid(), o.is_demo)
  returning * into pay;
  perform public.write_audit('payment.recorded', 'order', o.id::text,
                             jsonb_build_object('payment_id', pay.id, 'amount', p_amount, 'method', p_method));
  if o.status = 'completed' then
    perform public.transition_order(o.id, 'payment_recorded', 'Payment of ₹' || p_amount || ' recorded (' || p_method || ')');
  end if;
  return pay;
end $$;

create or replace function public.staff_set_payment_status(p_payment uuid, p_status public.payment_status)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Not authorised' using errcode = '42501'; end if;
  update public.payments set status = p_status,
         verified_by = case when p_status = 'verified' then auth.uid() else verified_by end
   where id = p_payment;
  perform public.write_audit('payment.' || p_status, 'payment', p_payment::text, '{}'::jsonb);
end $$;

-- Customer contact is released to the vendor only for an accepted, Tarkaash-managed order.
create or replace function public.order_contact(p_order uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders; c public.customers;
begin
  select * into o from public.orders where id = p_order;
  if not found then raise exception 'Order not found'; end if;
  if public.is_staff() then null;
  elsif public.is_vendor_member(o.vendor_id) then
    if o.status not in ('accepted', 'in_progress', 'completed', 'payment_recorded', 'submitted') then
      return jsonb_build_object('available', false, 'reason', 'Contact details are shared after you accept the enquiry.');
    end if;
  else
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  select * into c from public.customers where id = o.customer_id;
  perform public.write_audit('contact.viewed', 'order', o.id::text, '{}'::jsonb);
  return jsonb_build_object('available', true, 'name', c.name, 'email', c.email, 'phone', c.phone);
end $$;

-- ---------- Vendors ----------
create or replace function public.slugify(p text) returns text language sql immutable set search_path = public as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.create_vendor_application(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_name text := nullif(trim(p ->> 'business_name'), '');
  v_cat uuid := nullif(p ->> 'category_id', '')::uuid;
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
  if not public.hit_rate_limit('vapp:' || auth.uid(), 3, interval '1 day') then
    raise exception 'Too many applications today. Please try again tomorrow.';
  end if;

  v_slug := public.slugify(v_name);
  if v_slug = '' then v_slug := 'provider'; end if;
  if exists (select 1 from public.vendors where slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end if;

  insert into public.vendors (owner_user_id, slug, name, tagline, description, locality, city, service_area,
                              primary_category_id, status)
  values (auth.uid(), v_slug, v_name, nullif(trim(p ->> 'tagline'), ''), nullif(trim(p ->> 'description'), ''),
          trim(p ->> 'locality'), coalesce(nullif(trim(p ->> 'city'), ''), 'Hyderabad'),
          coalesce(array(select trim(x) from unnest(string_to_array(coalesce(p ->> 'service_area', ''), ',')) x where trim(x) <> ''), '{}'),
          v_cat, 'pending')
  returning * into v;
  insert into public.vendor_members (vendor_id, user_id, member_role) values (v.id, auth.uid(), 'owner');
  insert into public.vendor_categories (vendor_id, category_id) values (v.id, v_cat);

  select * into prof from public.profiles where id = auth.uid();
  insert into public.support_tickets (topic, name, email, phone, message, details, linked_type, linked_id, user_id, queue, consent_at)
  values ('listing', coalesce(prof.full_name, v_name), prof.email, nullif(trim(p ->> 'phone'), ''),
          'New provider application: ' || v_name, p, 'vendor', v.id, auth.uid(), 'onboarding', now())
  returning * into t;

  perform public.notify('admin', null, null, 'New provider application', v_name || ' · ' || v.locality, '/admin/vendors/' || v.id);
  perform public.write_audit('vendor.applied', 'vendor', v.id::text, jsonb_build_object('ticket', t.ref_code));
  return jsonb_build_object('vendor_id', v.id, 'slug', v.slug, 'ref_code', t.ref_code);
end $$;

create or replace function public.admin_set_vendor_status(p_vendor uuid, p_status public.vendor_status, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v public.vendors;
begin
  if not public.is_admin() then raise exception 'Not authorised' using errcode = '42501'; end if;
  select * into v from public.vendors where id = p_vendor for update;
  if not found then raise exception 'Vendor not found'; end if;
  update public.vendors set status = p_status where id = p_vendor;
  if p_status = 'active' then
    update public.profiles set role = 'vendor'
     where id in (select user_id from public.vendor_members where vendor_id = p_vendor) and role = 'customer';
  end if;
  perform public.notify('vendor', p_vendor, null, 'Listing status: ' || p_status, p_note, '/vendor/profile');
  perform public.write_audit('vendor.status', 'vendor', p_vendor::text, jsonb_build_object('from', v.status, 'to', p_status, 'note', p_note));
end $$;

create or replace function public.admin_set_verification(p_vendor uuid, p_checks jsonb)
returns public.verification_status language plpgsql security definer set search_path = public as $$
declare
  v_required text[];
  v_done int;
  v_status public.verification_status;
begin
  if not public.is_admin() then raise exception 'Not authorised' using errcode = '42501'; end if;
  select array(select c ->> 'key' from jsonb_array_elements(value -> 'checks') c) into v_required
    from public.settings where key = 'verification';
  select count(*) into v_done from unnest(v_required) k where coalesce((p_checks ->> k)::boolean, false);
  v_status := case when v_done = array_length(v_required, 1) then 'verified'
                   when v_done > 0 then 'pending' else 'unverified' end;
  update public.vendors set verification_checks = p_checks, verification = v_status,
         verified_at = case when v_status = 'verified' then coalesce(verified_at, now()) else null end
   where id = p_vendor;
  perform public.write_audit('vendor.verification', 'vendor', p_vendor::text, jsonb_build_object('checks', p_checks, 'status', v_status));
  return v_status;
end $$;

create or replace function public.admin_set_role(p_user uuid, p_role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorised' using errcode = '42501'; end if;
  if p_user = auth.uid() and p_role <> 'admin' then raise exception 'You cannot remove your own admin role.'; end if;
  update public.profiles set role = p_role where id = p_user;
  perform public.write_audit('user.role', 'profile', p_user::text, jsonb_build_object('role', p_role));
end $$;

create or replace function public.admin_link_vendor_member(p_vendor uuid, p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.is_admin() then raise exception 'Not authorised' using errcode = '42501'; end if;
  select id into v_user from public.profiles where lower(email) = lower(trim(p_email));
  if v_user is null then raise exception 'No account with that email. Ask them to sign up first.'; end if;
  insert into public.vendor_members (vendor_id, user_id, member_role) values (p_vendor, v_user, 'staff')
  on conflict do nothing;
  update public.profiles set role = 'vendor' where id = v_user and role = 'customer';
  perform public.write_audit('vendor.member_added', 'vendor', p_vendor::text, jsonb_build_object('user', v_user));
end $$;

-- ---------- Reviews ----------
create or replace function public.submit_review(p_order uuid, p_rating int, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders; c public.customers;
begin
  if auth.uid() is null then raise exception 'Please sign in' using errcode = '42501'; end if;
  select * into o from public.orders where id = p_order;
  if not found or o.customer_id not in (select public.my_customer_ids()) then
    raise exception 'You can only review your own orders' using errcode = '42501';
  end if;
  if o.status not in ('completed', 'payment_recorded', 'submitted', 'closed') then
    raise exception 'You can review once the order is completed.';
  end if;
  if p_rating not between 1 and 5 then raise exception 'Choose a rating from 1 to 5.'; end if;
  select * into c from public.customers where id = o.customer_id;
  insert into public.reviews (vendor_id, order_id, customer_id, user_id, author_name, rating, body)
  values (o.vendor_id, o.id, c.id, auth.uid(), split_part(c.name, ' ', 1), p_rating, nullif(trim(p_body), ''));
  perform public.notify('admin', null, null, 'Review awaiting moderation', o.ref_code, '/admin/reviews');
exception when unique_violation then
  raise exception 'You have already reviewed this order.';
end $$;

-- ---------- Support ----------
create or replace function public.submit_ticket(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_name text := nullif(trim(p ->> 'name'), '');
  v_email text := lower(nullif(trim(p ->> 'email'), ''));
  v_phone text := nullif(regexp_replace(coalesce(p ->> 'phone', ''), '[^0-9+]', '', 'g'), '');
  v_topic text := coalesce(nullif(p ->> 'topic', ''), 'general');
  v_msg text := nullif(trim(p ->> 'message'), '');
  t public.support_tickets;
begin
  if v_name is null or length(v_name) < 2 then raise exception 'Please enter your name.' using errcode = '22023'; end if;
  if v_email is null and v_phone is null then raise exception 'Please add an email or phone number.' using errcode = '22023'; end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  if v_phone is not null and v_phone !~ '^\+?[0-9]{10,13}$' then
    raise exception 'Please enter a valid phone number.' using errcode = '22023';
  end if;
  if v_topic not in ('listing', 'support', 'feature', 'partnership', 'general') then raise exception 'Choose a topic.'; end if;
  if v_msg is null or length(v_msg) < 10 then raise exception 'Please write a message of at least 10 characters.' using errcode = '22023'; end if;
  if length(v_msg) > 3000 then raise exception 'Please keep your message under 3000 characters.' using errcode = '22023'; end if;
  if coalesce((p ->> 'consent')::boolean, false) is not true then
    raise exception 'Please agree to the privacy notice.' using errcode = '22023';
  end if;
  if not public.hit_rate_limit('tkt:' || coalesce(v_email, v_phone), 5, interval '1 hour') then
    raise exception 'Too many messages. Please try again later.' using errcode = 'P0429';
  end if;
  insert into public.support_tickets (topic, name, email, phone, message, user_id, queue, consent_at)
  values (v_topic, v_name, v_email, v_phone, v_msg, auth.uid(),
          case v_topic when 'listing' then 'onboarding' when 'support' then 'support' when 'feature' then 'product'
                       when 'partnership' then 'partnerships' else 'operations' end, now())
  returning * into t;
  perform public.notify('admin', null, null, 'New message (' || v_topic || ') ' || t.ref_code, v_name, '/admin/support');
  return jsonb_build_object('ref_code', t.ref_code);
end $$;

create or replace function public.admin_update_ticket(p_ticket uuid, p_status public.ticket_status, p_assign_me boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorised' using errcode = '42501'; end if;
  update public.support_tickets set status = p_status, owner_id = case when p_assign_me then auth.uid() else owner_id end
   where id = p_ticket;
  perform public.write_audit('ticket.' || p_status, 'ticket', p_ticket::text, '{}'::jsonb);
end $$;

-- ---------- Events & notifications ----------
create or replace function public.log_event(p_type text, p_vendor uuid default null, p_service uuid default null,
                                            p_source text default null, p_session text default null,
                                            p_path text default null, p_meta jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_type not in ('profile_view', 'service_view', 'search', 'enquiry_start', 'cta_click', 'share', 'category_view') then
    return;
  end if;
  if not public.hit_rate_limit('evt:' || coalesce(auth.uid()::text, p_session, 'anon'), 600, interval '1 hour') then
    return;
  end if;
  insert into public.analytics_events (event_type, session_id, user_id, vendor_id, service_id, source, path, meta)
  values (p_type, left(p_session, 64), auth.uid(), p_vendor, p_service, left(p_source, 40), left(p_path, 200),
          coalesce(p_meta, '{}'::jsonb));
end $$;

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void language sql security definer set search_path = public as $$
  update public.notifications set read_at = now()
   where read_at is null
     and (p_ids is null or id = any (p_ids))
     and ((audience = 'user' and user_id = auth.uid())
          or (audience = 'vendor' and vendor_id in (select public.my_vendor_ids()))
          or (audience = 'admin' and public.is_staff()));
$$;
