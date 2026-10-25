-- Maintenance: keep rate_limits small, and schedule date-only enquiries at a sensible local time.

-- Old rate-limit buckets are only needed for a few hours; purge anything older than 2 days.
create or replace function public.purge_rate_limits() returns void
language sql security definer set search_path = public as $$
  delete from public.rate_limits where window_start < now() - interval '2 days';
$$;
revoke execute on function public.purge_rate_limits() from public, anon, authenticated;

-- Same behaviour as before, plus an occasional purge (about 1 in 100 calls) so no cron job is needed.
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
  if random() < 0.01 then
    perform public.purge_rate_limits();
  end if;
  return v_hits <= p_max;
end $$;
revoke execute on function public.hit_rate_limit(text, int, interval) from public, anon, authenticated;

-- Assignment: a preferred date becomes 11:00 IST on that day (was UTC midnight = 05:30 IST).
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
          case when e.preferred_date is not null then (e.preferred_date + time '11:00') at time zone 'Asia/Kolkata' end,
          e.is_demo)
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
revoke execute on function public._assign_enquiry(uuid, uuid, text) from public, anon, authenticated;
