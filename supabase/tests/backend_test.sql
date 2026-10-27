-- Backend acceptance test. Runs every role through the real API functions and row-level security.
-- It always ends by raising an exception so nothing it writes is kept; the message lists PASS/FAIL per check.
-- Requires the demo seed (supabase/seed/demo_seed.sql).

do $test$
declare
  results text[] := '{}';
  fails int := 0;
  r jsonb; o public.orders; n int; ok boolean; msg text;
  admin_id uuid := (select id from auth.users where email = 'tarkaash.admin@example.com');
  meera_id uuid := (select id from auth.users where email = 'meera.baking@example.com');
  wings_id uuid := (select id from auth.users where email = 'wingsinair@example.com');
  rohan_id uuid := (select id from auth.users where email = 'rohan.kitchen@example.com');
  priya_id uuid := (select id from auth.users where email = 'priya.customer@example.com');
  meera_v uuid := (select id from public.vendors where slug = 'meeras-home-baking');
  wings_v uuid := (select id from public.vendors where slug = 'wings-in-air-tours-and-travel');
  rohan_v uuid := (select id from public.vendors where slug = 'rohans-home-kitchen');
  cake uuid := (select id from public.services where vendor_id = (select id from public.vendors where slug = 'meeras-home-baking') and title = 'Custom Cakes');
  enq1 uuid; enq2 uuid; ref1 text; ord1 uuid; ord2 uuid;
begin
  -- helpers as local procedures via dynamic SQL
  -- become(role, uid)
  -- ---------------------------------------------------------------
  execute 'set local role anon';
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

  -- 1. Anonymous visitor submits an enquiry
  r := public.submit_enquiry(jsonb_build_object(
    'idempotency_key', 'test-key-1', 'name', 'Test Customer', 'phone', '9000000001', 'email', 'test.customer@example.com',
    'request', 'Test cake for an office party, chocolate.', 'service_id', cake, 'consent', true,
    'preferred_date', (current_date + 3)::text, 'assist_opt_in', true));
  ref1 := r ->> 'ref_code'; enq1 := (r ->> 'id')::uuid;
  ok := ref1 like 'TK-%' and (r ->> 'duplicate')::boolean = false;
  results := results || format('%s anon can submit enquiry (%s)', case when ok then 'PASS' else 'FAIL' end, ref1);
  if not ok then fails := fails + 1; end if;

  -- 2. Same idempotency key returns the same reference, no duplicate
  r := public.submit_enquiry(jsonb_build_object(
    'idempotency_key', 'test-key-1', 'name', 'Test Customer', 'phone', '9000000001',
    'request', 'Test cake for an office party, chocolate.', 'service_id', cake, 'consent', true));
  ok := r ->> 'ref_code' = ref1 and (r ->> 'duplicate')::boolean;
  results := results || format('%s duplicate submission returns same reference', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  -- 3. Validation rejects a bad phone number
  begin
    perform public.submit_enquiry(jsonb_build_object('name', 'X Y', 'phone', '123', 'request', 'Something long enough here', 'consent', true));
    ok := false;
  exception when others then ok := sqlerrm like '%valid 10-digit phone%';
  end;
  results := results || format('%s invalid phone is rejected', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  -- 4. Consent is required
  begin
    perform public.submit_enquiry(jsonb_build_object('name', 'X Y', 'phone', '9000000002', 'request', 'Something long enough here', 'consent', false));
    ok := false;
  exception when others then ok := sqlerrm like '%agree to be contacted%';
  end;
  results := results || format('%s consent is required', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  -- 5. Anon cannot read enquiries or call admin functions
  begin
    select count(*) into n from public.enquiries;
    ok := n = 0;
  exception when insufficient_privilege then ok := true;
  end;
  results := results || format('%s anon cannot read enquiries', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;
  begin
    perform public.admin_assign_enquiry(enq1, meera_v, null);
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  results := results || format('%s anon cannot assign enquiries', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  -- 6. Anon sees active vendors but not the pending application
  select count(*) into n from public.vendors where slug = 'henna-art-by-zoya';
  ok := n = 0;
  results := results || format('%s pending vendor hidden from public', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  -- ---------------------------------------------------------------
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);

  -- 7. Admin sees the new enquiry in the queue and assigns it
  select count(*) into n from public.enquiries where id = enq1 and status = 'new';
  ok := n = 1;
  results := results || format('%s enquiry appears in admin queue', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;
  o := public.admin_assign_enquiry(enq1, meera_v, 'Test assignment');
  ord1 := o.id;
  ok := o.status = 'new' and o.vendor_id = meera_v;
  results := results || format('%s admin assignment creates order %s', case when ok then 'PASS' else 'FAIL' end, o.ref_code);
  if not ok then fails := fails + 1; end if;

  -- ---------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', wings_id, 'role', 'authenticated')::text, true);

  -- 8. Another vendor cannot see or act on it
  select count(*) into n from public.orders where id = ord1;
  ok := n = 0;
  results := results || format('%s other vendor cannot see the order', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;
  begin
    perform public.transition_order(ord1, 'accepted', null);
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  results := results || format('%s other vendor cannot accept the order', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;
  select count(*) into n from public.customers;
  ok := n = 0;
  results := results || format('%s vendor cannot list customer contacts', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;
  begin
    perform public.vendor_metrics(meera_v, current_date - 30, current_date);
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  results := results || format('%s vendor cannot read another vendor''s analytics', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  -- ---------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', meera_id, 'role', 'authenticated')::text, true);

  -- 9. Assigned vendor works the order end to end
  r := public.order_contact(ord1);
  ok := (r ->> 'available')::boolean = false;
  results := results || format('%s contact hidden before acceptance', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  o := public.transition_order(ord1, 'accepted', null);
  r := public.order_contact(ord1);
  ok := o.status = 'accepted' and o.first_response_at is not null and r ->> 'phone' = '9000000001';
  results := results || format('%s accept records response time and releases contact', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  o := public.transition_order(ord1, 'in_progress', null);
  begin
    perform public.transition_order(ord1, 'completed', null);
    ok := false;
  exception when others then ok := sqlerrm like '%agreed price%';
  end;
  results := results || format('%s cannot complete without agreed price', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  o := public.vendor_update_order(ord1, 1500, now() + interval '3 days', 'Chocolate cake 1.5kg', 'Deliver after 5pm');
  o := public.transition_order(ord1, 'completed', 'Delivered');
  begin
    perform public.record_payment(ord1, 1500, 'upi', null, null);
    ok := false;
  exception when others then ok := sqlerrm like '%transaction reference%';
  end;
  results := results || format('%s UPI payment needs a reference', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  perform public.record_payment(ord1, 1500, 'upi', 'UPI-TEST-1', null);
  select * into o from public.orders where id = ord1;
  ok := o.status = 'payment_recorded';
  results := results || format('%s recording payment moves order to payment recorded', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  o := public.transition_order(ord1, 'submitted', null);
  begin
    perform public.transition_order(ord1, 'closed', null);
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  results := results || format('%s vendor cannot close; only Tarkkash can', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  begin
    perform public.transition_order(ord1, 'new', null);
    ok := false;
  exception when others then ok := sqlerrm like '%cannot be moved%';
  end;
  results := results || format('%s illegal status jump is blocked', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  -- 10. Vendor cannot change their own verification or status
  update public.vendors set status = 'paused', verification = 'unverified', tagline = 'Edited tagline' where id = meera_v;
  select count(*) into n from public.vendors where id = meera_v and status = 'active' and verification = 'verified' and tagline = 'Edited tagline';
  ok := n = 1;
  results := results || format('%s vendor edits profile but not status/badge', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  r := public.vendor_metrics(meera_v, current_date - 30, current_date);
  ok := (r ->> 'profile_views')::int > 0 and r ? 'median_response_minutes';
  results := results || format('%s vendor reads own analytics (%s views/30d)', case when ok then 'PASS' else 'FAIL' end, r ->> 'profile_views');
  if not ok then fails := fails + 1; end if;

  begin
    perform public.admin_metrics(current_date - 30, current_date);
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  results := results || format('%s vendor cannot read admin analytics', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  -- ---------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);

  -- 11. Admin closes; commission and assist fee are booked once
  o := public.transition_order(ord1, 'closed', null);
  select count(*) into n from public.platform_ledger where order_id = ord1;
  ok := o.status = 'closed' and n = 2
        and exists (select 1 from public.platform_ledger where order_id = ord1 and txn_type = 'commission' and amount = 150)
        and exists (select 1 from public.platform_ledger where order_id = ord1 and txn_type = 'assist_fee' and amount = 49);
  results := results || format('%s closing books commission (₹150) and assist fee (₹49)', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  select count(*) into n from public.order_status_history where order_id = ord1;
  ok := n = 7;
  results := results || format('%s full status history recorded (%s steps)', case when ok then 'PASS' else 'FAIL' end, n);
  if not ok then fails := fails + 1; end if;

  -- 12. Decline returns the enquiry for reassignment
  r := public.submit_enquiry(jsonb_build_object('name', 'Second Tester', 'email', 'second.tester@example.com',
         'request', 'Lunch for 20 people next week, veg only.', 'vendor_id', rohan_v, 'consent', true));
  enq2 := (r ->> 'id')::uuid;
  o := public.admin_assign_enquiry(enq2, rohan_v, null);
  ord2 := o.id;

  perform set_config('request.jwt.claims', json_build_object('sub', rohan_id, 'role', 'authenticated')::text, true);
  begin
    perform public.transition_order(ord2, 'declined', null);
    ok := false;
  exception when others then ok := sqlerrm like '%reason for declining%';
  end;
  results := results || format('%s decline needs a reason', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;
  perform public.transition_order(ord2, 'declined', 'Fully booked');

  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  select count(*) into n from public.enquiries where id = enq2 and status = 'new' and vendor_id is null;
  ok := n = 1;
  results := results || format('%s declined enquiry returns to admin queue', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  -- 13. Admin analytics reconcile with records
  r := public.admin_metrics(current_date - 29, current_date);
  select count(*) into n from public.enquiries
   where created_at >= public._range_start(current_date - 29) and created_at < public._range_end(current_date);
  ok := (r ->> 'leads')::int = n;
  results := results || format('%s admin leads metric reconciles (%s = %s)', case when ok then 'PASS' else 'FAIL' end, r ->> 'leads', n);
  if not ok then fails := fails + 1; end if;

  select count(*) into n from public.boost_queue(current_date - 29, current_date)
   where (vendor_slug = 'fixit-pro-repairs' and rule = 'slow_response')
      or (vendor_slug = 'sugar-and-spice-bakes' and rule = 'incomplete_listing');
  ok := n = 2;
  results := results || format('%s boost queue flags slow responder and incomplete listing', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  r := public.commercial_summary(current_date - 89, current_date);
  ok := (r ->> 'revenue')::numeric > 0 and (r ->> 'operating_result') is not null
        and (r ->> 'revenue')::numeric < (r ->> 'gmv')::numeric;
  results := results || format('%s P&L: revenue ₹%s is fees only, below order value ₹%s', case when ok then 'PASS' else 'FAIL' end, r ->> 'revenue', r ->> 'gmv');
  if not ok then fails := fails + 1; end if;

  -- ---------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', priya_id, 'role', 'authenticated')::text, true);

  -- 14. Customer sees only their own enquiries and cannot promote themselves
  select count(*) into n from public.enquiries;
  ok := n = 2;
  results := results || format('%s customer sees only own enquiries (%s)', case when ok then 'PASS' else 'FAIL' end, n);
  if not ok then fails := fails + 1; end if;
  update public.profiles set role = 'admin' where id = priya_id;
  select count(*) into n from public.profiles where id = priya_id and role = 'customer';
  ok := n = 1;
  results := results || format('%s customer cannot change own role', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;
  begin
    select count(*) into n from public.platform_ledger;
    ok := n = 0;
  exception when insufficient_privilege then ok := true;
  end;
  results := results || format('%s customer cannot read the ledger', case when ok then 'PASS' else 'FAIL' end);
  if not ok then fails := fails + 1; end if;

  msg := format(E'BACKEND TEST: %s checks, %s failed\n%s', array_length(results, 1), fails, array_to_string(results, E'\n'));
  raise exception '%', msg;  -- always roll back
end $test$;
