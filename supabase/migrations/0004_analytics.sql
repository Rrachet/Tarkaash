-- Analytics derived from events, enquiries, orders and the ledger (spec §11).
-- Periods are inclusive dates in Asia/Kolkata.

create or replace function public._range_start(d date) returns timestamptz language sql immutable set search_path = public as $$
  select (d::timestamp at time zone 'Asia/Kolkata');
$$;
create or replace function public._range_end(d date) returns timestamptz language sql immutable set search_path = public as $$
  select ((d + 1)::timestamp at time zone 'Asia/Kolkata');
$$;

-- Listing completeness 0-100, used by the boost queue and vendor dashboard
create or replace function public.listing_completeness(p_vendor uuid) returns int
language sql stable security definer set search_path = public as $$
  select (
      (case when v.avatar_url is not null then 15 else 0 end)
    + (case when v.cover_url is not null then 10 else 0 end)
    + (case when length(coalesce(v.description, '')) >= 80 then 15 else 0 end)
    + (case when cardinality(v.service_area) > 0 then 10 else 0 end)
    + (case when (select count(*) from services s where s.vendor_id = v.id and s.active) >= 3 then 20
            when (select count(*) from services s where s.vendor_id = v.id and s.active) >= 1 then 10 else 0 end)
    + (case when not exists (select 1 from services s where s.vendor_id = v.id and s.active
                              and s.price_type <> 'quote' and s.price_amount is null)
             and exists (select 1 from services s where s.vendor_id = v.id and s.active) then 10 else 0 end)
    + (case when exists (select 1 from services s where s.vendor_id = v.id and s.active and s.image_url is not null) then 10 else 0 end)
    + (case when (select count(*) from vendor_media m where m.vendor_id = v.id) >= 3 then 10 else 0 end)
  )::int
  from vendors v where v.id = p_vendor;
$$;

-- ---------- Vendor dashboard ----------
create or replace function public.vendor_metrics(p_vendor uuid, p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  t0 timestamptz := public._range_start(p_from);
  t1 timestamptz := public._range_end(p_to);
  r jsonb;
begin
  if not (public.is_vendor_member(p_vendor) or public.is_staff()) then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  with ev as (
    select * from analytics_events where vendor_id = p_vendor and created_at >= t0 and created_at < t1
  ), enq as (
    select e.* from enquiries e
     where e.created_at >= t0 and e.created_at < t1
       and (e.requested_vendor_id = p_vendor
            or exists (select 1 from orders o where o.enquiry_id = e.id and o.vendor_id = p_vendor))
  ), ord as (
    select * from orders where vendor_id = p_vendor and created_at >= t0 and created_at < t1
  ), resp as (
    select extract(epoch from (first_response_at - created_at)) / 60.0 as mins from ord where first_response_at is not null
  ), days as (
    select generate_series(p_from, p_to, interval '1 day')::date as d
  )
  select jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'generated_at', now(),
    'profile_views', (select count(*) from ev where event_type = 'profile_view'),
    'unique_viewers', (select count(distinct coalesce(user_id::text, session_id)) from ev where event_type = 'profile_view'),
    'enquiries', (select count(*) from enq),
    'assigned', (select count(*) from ord),
    'accepted', (select count(*) from ord where accepted_at is not null),
    'declined', (select count(*) from ord where declined_at is not null),
    'pending_response', (select count(*) from ord where status = 'new'),
    'completed', (select count(*) from ord where completed_at is not null),
    'cancelled', (select count(*) from ord where cancelled_at is not null),
    'closed', (select count(*) from ord where closed_at is not null),
    'acceptance_rate', (select case when count(*) > 0 then round(count(*) filter (where accepted_at is not null)::numeric / count(*), 4) end from ord),
    'conversion_rate', (select case when (select count(*) from enq) > 0
                          then round((select count(*) from ord where accepted_at is not null)::numeric / (select count(*) from enq), 4) end),
    'completion_rate', (select case when count(*) filter (where accepted_at is not null) > 0
                          then round(count(*) filter (where completed_at is not null)::numeric / count(*) filter (where accepted_at is not null), 4) end from ord),
    'median_response_minutes', (select round(percentile_cont(0.5) within group (order by mins)::numeric, 1) from resp),
    'response_sample', (select count(*) from resp),
    'order_value', (select coalesce(sum(agreed_amount), 0) from ord where completed_at is not null),
    'payments_recorded', (select coalesce(sum(p.amount), 0) from payments p join orders o on o.id = p.order_id
                           where o.vendor_id = p_vendor and p.status <> 'rejected' and p.created_at >= t0 and p.created_at < t1),
    'likes_total', (select count(*) from likes where vendor_id = p_vendor),
    'likes_new', (select count(*) from likes where vendor_id = p_vendor and created_at >= t0 and created_at < t1),
    'followers_total', (select count(*) from follows where vendor_id = p_vendor),
    'followers_new', (select count(*) from follows where vendor_id = p_vendor and created_at >= t0 and created_at < t1),
    'update_subscribers', (select count(*) from follows where vendor_id = p_vendor and notify_updates),
    'rating_avg', (select round(avg(rating)::numeric, 2) from reviews where vendor_id = p_vendor and status = 'approved'),
    'rating_count', (select count(*) from reviews where vendor_id = p_vendor and status = 'approved'),
    'completeness', public.listing_completeness(p_vendor),
    'series', (select coalesce(jsonb_agg(jsonb_build_object(
                  'date', d,
                  'views', (select count(*) from ev where event_type = 'profile_view' and (created_at at time zone 'Asia/Kolkata')::date = d),
                  'enquiries', (select count(*) from enq where (created_at at time zone 'Asia/Kolkata')::date = d),
                  'orders', (select count(*) from ord where accepted_at is not null and (created_at at time zone 'Asia/Kolkata')::date = d)
                ) order by d), '[]'::jsonb) from days),
    'top_services', (select coalesce(jsonb_agg(x order by (x ->> 'enquiries')::int desc, x ->> 'title'), '[]'::jsonb) from (
                       select jsonb_build_object('id', s.id, 'title', s.title,
                         'views', (select count(*) from ev where service_id = s.id),
                         'enquiries', (select count(*) from enq where service_id = s.id),
                         'orders', (select count(*) from ord where service_id = s.id and accepted_at is not null)) x
                       from services s where s.vendor_id = p_vendor and s.active) q),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('source', src, 'count', n) order by n desc), '[]'::jsonb)
                  from (select coalesce(source, 'direct') src, count(*) n from ev where event_type = 'profile_view' group by 1) q),
    'status_breakdown', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
                           from (select status, count(*) n from ord group by status) q)
  ) into r;
  return r;
end $$;

-- ---------- Admin dashboard ----------
create or replace function public.admin_metrics(p_from date, p_to date, p_category uuid default null,
                                                p_locality text default null, p_vendor uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  t0 timestamptz := public._range_start(p_from);
  t1 timestamptz := public._range_end(p_to);
  r jsonb;
begin
  if not public.is_staff() then raise exception 'Not authorised' using errcode = '42501'; end if;

  with vend as (
    select v.* from vendors v
     where (p_category is null or v.primary_category_id = p_category
            or exists (select 1 from vendor_categories vc where vc.vendor_id = v.id and vc.category_id = p_category))
       and (p_locality is null or v.locality ilike '%' || p_locality || '%')
       and (p_vendor is null or v.id = p_vendor)
  ), enq as (
    select e.* from enquiries e
     where e.created_at >= t0 and e.created_at < t1
       and (p_category is null or e.category_id = p_category)
       and (p_locality is null or coalesce(e.locality, '') ilike '%' || p_locality || '%'
            or e.requested_vendor_id in (select id from vend))
       and (p_vendor is null or e.requested_vendor_id = p_vendor or e.vendor_id = p_vendor
            or exists (select 1 from orders o where o.enquiry_id = e.id and o.vendor_id = p_vendor))
  ), ord as (
    select o.* from orders o where o.created_at >= t0 and o.created_at < t1 and o.vendor_id in (select id from vend)
  ), resp as (
    select extract(epoch from (first_response_at - created_at)) / 60.0 as mins from ord where first_response_at is not null
  ), ev as (
    select * from analytics_events a where a.created_at >= t0 and a.created_at < t1
       and (a.vendor_id is null or a.vendor_id in (select id from vend))
  ), days as (
    select generate_series(p_from, p_to, interval '1 day')::date as d
  )
  select jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'generated_at', now(),
    'active_vendors', (select count(*) from vend where status = 'active'),
    'pending_vendors', (select count(*) from vend where status = 'pending'),
    'verified_vendors', (select count(*) from vend where status = 'active' and verification = 'verified'),
    'categories_total', (select count(*) from categories where active),
    'categories_covered', (select count(distinct c.id) from categories c
                             where c.active and exists (select 1 from vend v left join vendor_categories vc on vc.vendor_id = v.id
                               where v.status = 'active' and (v.primary_category_id = c.id or vc.category_id = c.id))),
    'profile_views', (select count(*) from ev where event_type = 'profile_view'),
    'searches', (select count(*) from ev where event_type = 'search'),
    'leads', (select count(*) from enq),
    'unassigned', (select count(*) from enquiries where status = 'new'),
    'assigned', (select count(*) from ord),
    'accepted', (select count(*) from ord where accepted_at is not null),
    'declined', (select count(*) from ord where declined_at is not null),
    'completed', (select count(*) from ord where completed_at is not null),
    'cancelled', (select count(*) from ord where cancelled_at is not null),
    'closed', (select count(*) from ord where closed_at is not null),
    'acceptance_rate', (select case when count(*) > 0 then round(count(*) filter (where accepted_at is not null)::numeric / count(*), 4) end from ord),
    'conversion_rate', (select case when (select count(*) from enq) > 0
                          then round((select count(*) from ord where accepted_at is not null)::numeric / (select count(*) from enq), 4) end),
    'completion_rate', (select case when count(*) filter (where accepted_at is not null) > 0
                          then round(count(*) filter (where completed_at is not null)::numeric / count(*) filter (where accepted_at is not null), 4) end from ord),
    'median_response_minutes', (select round(percentile_cont(0.5) within group (order by mins)::numeric, 1) from resp),
    'response_sample', (select count(*) from resp),
    'rating_avg', (select round(avg(rating)::numeric, 2) from reviews where status = 'approved' and vendor_id in (select id from vend)),
    'rating_count', (select count(*) from reviews where status = 'approved' and vendor_id in (select id from vend)),
    'gmv', (select coalesce(sum(agreed_amount), 0) from ord where completed_at is not null),
    'series', (select coalesce(jsonb_agg(jsonb_build_object(
                  'date', d,
                  'views', (select count(*) from ev where event_type = 'profile_view' and (created_at at time zone 'Asia/Kolkata')::date = d),
                  'leads', (select count(*) from enq where (created_at at time zone 'Asia/Kolkata')::date = d),
                  'accepted', (select count(*) from ord where accepted_at is not null and (created_at at time zone 'Asia/Kolkata')::date = d),
                  'completed', (select count(*) from ord where completed_at is not null and (created_at at time zone 'Asia/Kolkata')::date = d)
                ) order by d), '[]'::jsonb) from days),
    'by_category', (select coalesce(jsonb_agg(x order by (x ->> 'leads')::int desc), '[]'::jsonb) from (
                      select jsonb_build_object('id', c.id, 'name', c.name,
                        'vendors', (select count(*) from vend v where v.status = 'active' and v.primary_category_id = c.id),
                        'leads', (select count(*) from enq where category_id = c.id),
                        'accepted', (select count(*) from ord o join enq e on e.id = o.enquiry_id where e.category_id = c.id and o.accepted_at is not null),
                        'completed', (select count(*) from ord o join enq e on e.id = o.enquiry_id where e.category_id = c.id and o.completed_at is not null)) x
                      from categories c where c.active) q),
    'top_vendors', (select coalesce(jsonb_agg(x order by (x ->> 'completed')::int desc, (x ->> 'leads')::int desc), '[]'::jsonb) from (
                      select jsonb_build_object('id', v.id, 'name', v.name, 'slug', v.slug, 'locality', v.locality,
                        'views', (select count(*) from ev where vendor_id = v.id and event_type = 'profile_view'),
                        'leads', (select count(*) from enq where requested_vendor_id = v.id or vendor_id = v.id),
                        'accepted', (select count(*) from ord where vendor_id = v.id and accepted_at is not null),
                        'completed', (select count(*) from ord where vendor_id = v.id and completed_at is not null),
                        'value', (select coalesce(sum(agreed_amount), 0) from ord where vendor_id = v.id and completed_at is not null)) x
                      from vend v where v.status = 'active' limit 50) q),
    'enquiry_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
                         from (select status, count(*) n from enq group by status) q),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('source', src, 'count', n) order by n desc), '[]'::jsonb)
                  from (select source src, count(*) n from enq group by 1) q)
  ) into r;
  return r;
end $$;

-- ---------- Boost queue ----------
create or replace function public.boost_queue(p_from date, p_to date)
returns table (vendor_id uuid, vendor_name text, vendor_slug text, rule text, severity text, reason text,
               action text, metrics jsonb)
language plpgsql stable security definer set search_path = public as $$
declare
  t0 timestamptz := public._range_start(p_from);
  t1 timestamptz := public._range_end(p_to);
  cfg jsonb;
begin
  if not public.is_staff() then raise exception 'Not authorised' using errcode = '42501'; end if;
  select value into cfg from settings where key = 'boost_thresholds';

  return query
  with base as (
    select v.id, v.name, v.slug,
      (select count(*) from analytics_events a where a.vendor_id = v.id and a.event_type = 'profile_view'
         and a.created_at >= t0 and a.created_at < t1) as views,
      (select count(*) from enquiries e where e.created_at >= t0 and e.created_at < t1
         and (e.requested_vendor_id = v.id or exists (select 1 from orders o where o.enquiry_id = e.id and o.vendor_id = v.id))) as enquiries,
      (select count(*) from orders o where o.vendor_id = v.id and o.created_at >= t0 and o.created_at < t1) as assigned,
      (select count(*) from orders o where o.vendor_id = v.id and o.created_at >= t0 and o.created_at < t1 and o.accepted_at is not null) as accepted,
      (select count(*) from orders o where o.vendor_id = v.id and o.created_at >= t0 and o.created_at < t1 and o.cancelled_at is not null) as cancelled,
      (select percentile_cont(0.5) within group (order by extract(epoch from (o.first_response_at - o.created_at)) / 3600.0)
         from orders o where o.vendor_id = v.id and o.created_at >= t0 and o.created_at < t1 and o.first_response_at is not null) as median_resp_h,
      (select count(*) from orders o where o.vendor_id = v.id and o.created_at >= t0 and o.created_at < t1 and o.first_response_at is not null) as resp_n,
      (select count(*) from orders o where o.vendor_id = v.id and o.status = 'new' and o.created_at < now() - make_interval(hours => coalesce((cfg ->> 'slow_response_hours')::int, 24))) as overdue,
      (select avg(rating) from reviews r where r.vendor_id = v.id and r.status = 'approved') as rating,
      (select count(*) from reviews r where r.vendor_id = v.id and r.status = 'approved') as rating_n,
      public.listing_completeness(v.id) as completeness
    from vendors v where v.status = 'active'
  ), flagged as (
    select b.*, 'low_exposure'::text as rule, 'opportunity'::text as severity,
      format('Only %s profile views in this period with a %s%% complete listing.', b.views, b.completeness) as reason,
      'Consider better placement in category results or a community spotlight feature.'::text as action
    from base b where b.views < coalesce((cfg ->> 'low_views')::int, 30) and b.completeness >= coalesce((cfg ->> 'min_completeness')::int, 80)
    union all
    select b.*, 'low_conversion', 'improve',
      format('%s views but only %s enquiries (%s%% enquiry rate).', b.views, b.enquiries,
             round(100.0 * b.enquiries / nullif(b.views, 0), 1)),
      'Review photos, pricing clarity, service area and call-to-action before paying for a boost.'
    from base b where b.views >= coalesce((cfg ->> 'high_views')::int, 100)
      and b.enquiries::numeric / nullif(b.views, 0) < coalesce((cfg ->> 'min_enquiry_rate')::numeric, 0.02)
    union all
    select b.*, 'slow_response', 'risk',
      format('Median first response %s hours across %s assignments; %s waiting past the limit.',
             round(coalesce(b.median_resp_h, 0)::numeric, 1), b.resp_n, b.overdue),
      'Prompt the vendor, or pause new assignments until availability is confirmed.'
    from base b where (b.assigned >= coalesce((cfg ->> 'min_enquiries_for_response')::int, 3)
                       and b.median_resp_h > coalesce((cfg ->> 'slow_response_hours')::int, 24)) or b.overdue > 0
    union all
    select b.*, 'quality_risk', 'risk',
      format('%s of %s accepted orders cancelled; average rating %s from %s reviews.', b.cancelled, b.accepted,
             coalesce(round(b.rating::numeric, 1)::text, 'n/a'), b.rating_n),
      'Review with the vendor and offer support before any boosting.'
    from base b where (b.cancelled >= 2 and b.cancelled::numeric / nullif(b.accepted, 0) > coalesce((cfg ->> 'cancel_ratio')::numeric, 0.25))
       or (b.rating_n >= 3 and b.rating < coalesce((cfg ->> 'min_rating')::numeric, 3.5))
    union all
    select b.*, 'incomplete_listing', 'improve',
      format('Listing is %s%% complete.', b.completeness),
      'Help the vendor add photos, descriptions, prices and service area.'
    from base b where b.completeness < 60
  )
  select f.id, f.name, f.slug, f.rule, f.severity, f.reason, f.action,
    jsonb_build_object('views', f.views, 'enquiries', f.enquiries, 'assigned', f.assigned, 'accepted', f.accepted,
                       'cancelled', f.cancelled, 'median_response_hours', round(coalesce(f.median_resp_h, 0)::numeric, 1),
                       'response_sample', f.resp_n, 'overdue', f.overdue,
                       'rating', round(coalesce(f.rating, 0)::numeric, 2), 'rating_count', f.rating_n,
                       'completeness', f.completeness)
  from flagged f
  order by case f.severity when 'risk' then 0 when 'improve' then 1 else 2 end, f.name;
end $$;

-- ---------- Commercial ----------
create or replace function public.commercial_summary(p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_staff() then raise exception 'Not authorised' using errcode = '42501'; end if;
  with l as (
    select * from platform_ledger where recognized_on between p_from and p_to
  ), c as (
    select * from cost_entries where incurred_on between p_from and p_to
  ), months as (
    select date_trunc('month', m)::date as m from generate_series(date_trunc('month', p_from::timestamp), p_to::timestamp, interval '1 month') m
  )
  select jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'generated_at', now(),
    'revenue_by_type', (select coalesce(jsonb_object_agg(txn_type, total), '{}'::jsonb)
                          from (select txn_type, sum(amount) total from l where basis <> 'forecast' group by 1) q),
    'revenue_by_basis', (select coalesce(jsonb_object_agg(basis, total), '{}'::jsonb)
                           from (select basis, sum(amount) total from l group by 1) q),
    'revenue', (select coalesce(sum(amount), 0) from l where basis <> 'forecast'),
    'revenue_actual', (select coalesce(sum(amount), 0) from l where basis = 'actual'),
    'revenue_accrued', (select coalesce(sum(amount), 0) from l where basis = 'accrued'),
    'revenue_forecast', (select coalesce(sum(amount), 0) from l where basis = 'forecast'),
    'tax', (select coalesce(sum(tax_amount), 0) from l where basis <> 'forecast'),
    'direct_costs', (select coalesce(sum(direct_cost), 0) from l where basis <> 'forecast')
                    + (select coalesce(sum(amount), 0) from c where cost_type = 'direct' and basis <> 'forecast'),
    'operating_costs', (select coalesce(sum(amount), 0) from c where cost_type = 'operating' and basis <> 'forecast'),
    'unreconciled', (select count(*) from l where reconciliation = 'pending' and basis <> 'forecast'),
    'gmv', (select coalesce(sum(agreed_amount), 0) from orders where completed_at is not null
              and (completed_at at time zone 'Asia/Kolkata')::date between p_from and p_to),
    'monthly', (select coalesce(jsonb_agg(jsonb_build_object(
                   'month', m,
                   'revenue', (select coalesce(sum(amount), 0) from l where basis <> 'forecast' and date_trunc('month', recognized_on)::date = m),
                   'direct', (select coalesce(sum(direct_cost), 0) from l where basis <> 'forecast' and date_trunc('month', recognized_on)::date = m)
                             + (select coalesce(sum(amount), 0) from c where cost_type = 'direct' and basis <> 'forecast' and date_trunc('month', incurred_on)::date = m),
                   'operating', (select coalesce(sum(amount), 0) from c where cost_type = 'operating' and basis <> 'forecast' and date_trunc('month', incurred_on)::date = m)
                 ) order by m), '[]'::jsonb) from months)
  ) into r;
  r := r || jsonb_build_object(
    'contribution', (r ->> 'revenue')::numeric - (r ->> 'direct_costs')::numeric,
    'operating_result', (r ->> 'revenue')::numeric - (r ->> 'direct_costs')::numeric - (r ->> 'operating_costs')::numeric
  );
  return r;
end $$;
