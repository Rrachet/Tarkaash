-- Tarkkash demo seed.
-- Every row created here has is_demo = true and is shown in the app with a "Sample data" label.
-- Prices, reviews, verification states, fees and metrics are illustrative until validated.
--
-- Usage (password is never committed):
--   select set_config('seed.password', '<demo password>', false);
--   \i supabase/seed/demo_seed.sql

select setseed(0.4242);

insert into public.categories (slug, name, icon, description, sort) values
  ('home-care', 'Home Care', 'house', 'Cleaning, pest control and help around the home', 10),
  ('tutors', 'Tutors', 'graduation-cap', 'School tuition, languages and exam preparation', 20),
  ('beauty-wellness', 'Beauty & Wellness', 'flower-2', 'Makeup, salon-at-home and wellness', 30),
  ('repairs', 'Repairs', 'wrench', 'Electricians, plumbers and appliance repair', 40),
  ('fitness', 'Fitness', 'dumbbell', 'Personal trainers, yoga and coaching', 50),
  ('food-baking', 'Food & Baking', 'cake-slice', 'Home bakers, cakes, snacks and treats', 60),
  ('events', 'Events', 'party-popper', 'Decor, planning and celebrations', 70),
  ('travel-tours', 'Travel & Tours', 'plane', 'Tour packages and custom itineraries', 80),
  ('home-kitchen', 'Home Kitchen', 'soup', 'Tiffins, home meals and bulk orders', 90)
on conflict (slug) do nothing;

-- ---------- helpers (session-only) ----------
create or replace function pg_temp.seed_user(p_email text, p_name text, p_pw text, p_role public.app_role)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;
  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
            extensions.crypt(p_pw, extensions.gen_salt('bf')), now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb, jsonb_build_object('full_name', p_name),
            now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text,
            jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
            'email', now(), now(), now());
  end if;
  update public.profiles set role = p_role, full_name = p_name where id = v_id;
  return v_id;
end $$;

create or replace function pg_temp.pick(arr text[]) returns text language sql volatile as $$
  select arr[1 + floor(random() * array_length(arr, 1))::int];
$$;

-- ---------- accounts ----------
do $$
declare pw text := current_setting('seed.password');
begin
  perform pg_temp.seed_user('tarkaash.admin@example.com', 'Tarkkash Admin', pw, 'admin');
  perform pg_temp.seed_user('tarkaash.finance@example.com', 'Tarkkash Finance', pw, 'finance');
  perform pg_temp.seed_user('priya.customer@example.com', 'Priya Sharma', pw, 'customer');
  for i in 1..60 loop
    perform pg_temp.seed_user('demo.customer' || i || '@example.com', 'Demo Customer ' || i,
                              encode(sha256((pw || i)::bytea), 'hex'), 'customer');
  end loop;
end $$;

-- ---------- vendors & services ----------
create temp table seed_vendor_meta (vendor_id uuid, pop numeric, conv numeric, resp_minutes numeric, cancel_rate numeric);

do $$
declare
  pw text := current_setting('seed.password');
  data jsonb := $json$[
  {"slug": "meeras-home-baking", "name": "Meera's Home Baking", "cat": "food-baking",
   "tagline": "Homemade Cakes | Cookies | Snacks", "locality": "Kondapur", "area": ["Kondapur", "Gachibowli", "Madhapur", "Within 2 km of Green Valley Apartments"],
   "desc": "Meera bakes everything to order in her home kitchen at Green Valley Apartments: birthday and anniversary cakes, cookies, brownies and evening snacks. Eggless options on request, fresh ingredients and careful packaging for delivery within 2 km.",
   "years": 6, "langs": ["English", "Hindi", "Telugu"], "highlights": ["Freshly baked", "Quality ingredients", "Homemade goodness"],
   "terms": "Custom cakes need 2 to 3 days notice. Delivery within 2 km; pickup available.",
   "owner": "meera.baking@example.com", "owner_name": "Meera Iyer", "verified": true,
   "pop": 30, "conv": 0.055, "resp": 40, "cancel": 0.03,
   "services": [
     {"title": "Custom Cakes", "desc": "Birthday, anniversary and special-occasion cakes. Choose your flavour, design and size.", "ptype": "from", "price": 800, "unit": "per kg", "lead": "2 to 3 days", "delivery": ["delivery", "pickup"], "attrs": {"flavours": ["Chocolate truffle", "Red velvet", "Black forest", "Pineapple"], "eggless": true}},
     {"title": "Cookies (Pack of 6)", "desc": "Choco chip, oats, butter or walnut. Perfect for gifting or everyday treats.", "ptype": "fixed", "price": 250, "unit": "per pack", "lead": "Ready in 1 day", "delivery": ["delivery", "pickup"], "attrs": {}},
     {"title": "Evening Snacks", "desc": "Veg puff, paneer roll and bread pakoda made fresh in small batches.", "ptype": "from", "price": 150, "unit": "per box", "lead": "Ready in 1 day", "delivery": ["delivery", "pickup"], "attrs": {}},
     {"title": "Brownies (Pack of 4)", "desc": "Classic chocolate or nutty brownies.", "ptype": "fixed", "price": 300, "unit": "per pack", "lead": "Ready in 1 day", "delivery": ["delivery", "pickup"], "attrs": {}}
   ]},
  {"slug": "wings-in-air-tours-and-travel", "name": "Wings in Air Tours and Travel", "cat": "travel-tours",
   "tagline": "Your Journey. Our Passion.", "locality": "Begumpet", "area": ["Hyderabad", "Secunderabad", "Online across India"],
   "desc": "Wings in Air is a Hyderabad-based travel company with 7+ years of experience creating memorable trips across India and abroad. Personalised itineraries, reliable partners and end-to-end support, from family holidays and honeymoons to group tours.",
   "years": 7, "langs": ["English", "Hindi", "Telugu"], "highlights": ["Custom itineraries", "Trusted partners", "Group & family tours", "International holidays"],
   "terms": "All prices are indicative per person and confirmed only after availability check. Visa and flight costs quoted separately.",
   "owner": "wingsinair@example.com", "owner_name": "Kiran Rao", "verified": true,
   "pop": 22, "conv": 0.04, "resp": 75, "cancel": 0.06,
   "services": [
     {"title": "Domestic Tour Packages", "desc": "Weekend getaways, pilgrimages and hill stations.", "ptype": "from", "price": 8999, "unit": "per person", "lead": "Plan 2+ weeks ahead", "delivery": ["online"], "attrs": {"inclusions": ["Hotel stays", "Local transfers", "Sightseeing"], "destinations": ["Coorg", "Ooty", "Tirupati", "Goa"]}},
     {"title": "International Packages", "desc": "Thailand, Dubai, Singapore, Europe and more.", "ptype": "from", "price": 39999, "unit": "per person", "lead": "Plan 4+ weeks ahead", "delivery": ["online"], "attrs": {"inclusions": ["Hotels", "Transfers", "Visa assistance"], "destinations": ["Thailand", "Dubai", "Singapore", "Europe"]}},
     {"title": "Honeymoon Packages", "desc": "Specially curated trips for couples.", "ptype": "from", "price": 49999, "unit": "per couple", "lead": "Plan 3+ weeks ahead", "delivery": ["online"], "attrs": {"inclusions": ["Romantic stays", "Candle-light dinner", "Private transfers"]}},
     {"title": "Group Tours", "desc": "Family, friends and corporate groups.", "ptype": "from", "price": 19999, "unit": "per person", "lead": "Plan 3+ weeks ahead", "delivery": ["online"], "attrs": {"min_group": 8}},
     {"title": "Custom Itinerary", "desc": "Tell us where and when, and we design the trip around you.", "ptype": "quote", "price": null, "unit": null, "lead": "Quote within 24 hours", "delivery": ["online"], "attrs": {}}
   ]},
  {"slug": "rohans-home-kitchen", "name": "Rohan's Home Kitchen", "cat": "home-kitchen",
   "tagline": "Authentic Homemade Food", "locality": "Banjara Hills", "area": ["Banjara Hills", "Jubilee Hills", "Within 3 km"],
   "desc": "Rohan has been cooking for over 8 years and brings authentic home-cooked flavours to your plate: North Indian, South Indian and regional dishes made with fresh ingredients and a focus on hygiene.",
   "years": 8, "langs": ["English", "Hindi"], "highlights": ["Hygienic kitchen", "Fresh ingredients", "Timely delivery"],
   "terms": "Tiffin subscriptions need a minimum of 5 meals. Bulk orders need 2 days notice.",
   "owner": "rohan.kitchen@example.com", "owner_name": "Rohan Mehta", "verified": true,
   "pop": 25, "conv": 0.06, "resp": 25, "cancel": 0.03,
   "services": [
     {"title": "Daily Tiffin Service", "desc": "Veg or non-veg lunch and dinner tiffins.", "ptype": "from", "price": 120, "unit": "per meal", "lead": "Start next day", "delivery": ["delivery"], "attrs": {"min_quantity": 5, "meal_types": ["Veg", "Non-veg"], "dietary_note": null}},
     {"title": "Custom Meal Orders", "desc": "Family dinners and small events.", "ptype": "from", "price": 250, "unit": "per person", "lead": "1 day", "delivery": ["delivery", "pickup"], "attrs": {"min_quantity": 4}},
     {"title": "Festive Specials", "desc": "Sweets and snacks for festivals.", "ptype": "from", "price": 300, "unit": "per box", "lead": "2 days", "delivery": ["delivery", "pickup"], "attrs": {}},
     {"title": "Corporate Orders", "desc": "Bulk lunches for offices and meetings.", "ptype": "quote", "price": null, "unit": null, "lead": "2 days", "delivery": ["delivery"], "attrs": {"min_quantity": 20}}
   ]},
  {"slug": "brightsteps-tutors", "name": "BrightSteps Tutors", "cat": "tutors",
   "tagline": "Maths, Science & English for Classes 4 to 10", "locality": "Madhapur", "area": ["Madhapur", "Kondapur", "Online"],
   "desc": "Small-group and one-to-one tuition for school students, with regular progress updates for parents. CBSE and state board.",
   "years": 5, "langs": ["English", "Hindi", "Telugu"], "highlights": ["Small batches", "Progress reports", "Online or at home"],
   "terms": "Monthly fees payable in advance. One free trial class.",
   "owner": "brightsteps@example.com", "owner_name": "Sunita Reddy", "verified": "partial",
   "pop": 14, "conv": 0.05, "resp": 180, "cancel": 0.05,
   "services": [
     {"title": "Maths & Science Tuition", "desc": "Classes 4 to 10, CBSE and state board.", "ptype": "from", "price": 3000, "unit": "per month", "lead": "Start this week", "delivery": ["at_home", "online"], "attrs": {}},
     {"title": "Spoken English", "desc": "Confidence-building conversation classes.", "ptype": "fixed", "price": 2500, "unit": "per month", "lead": "Next batch Monday", "delivery": ["online"], "attrs": {}},
     {"title": "Exam Preparation", "desc": "Board exam revision and mock tests.", "ptype": "from", "price": 4000, "unit": "per month", "lead": "Start this week", "delivery": ["at_home", "online"], "attrs": {}}
   ]},
  {"slug": "sparkle-home-cleaning", "name": "Sparkle Home Cleaning", "cat": "home-care",
   "tagline": "Deep cleaning by a trained local team", "locality": "Gachibowli", "area": ["Gachibowli", "Nanakramguda", "Financial District"],
   "desc": "A small trained team offering deep cleaning for apartments and villas, with eco-friendly products and their own equipment.",
   "years": 4, "langs": ["Hindi", "Telugu"], "highlights": ["Own equipment", "Eco-friendly products"],
   "terms": "Prices for up to 2BHK; larger homes quoted on visit.", "verified": true,
   "pop": 12, "conv": 0.06, "resp": 60, "cancel": 0.05,
   "services": [
     {"title": "Full Home Deep Cleaning", "desc": "Kitchen, bathrooms, floors and windows.", "ptype": "from", "price": 2499, "unit": "per visit", "lead": "Next available slot", "delivery": ["at_home"], "attrs": {}},
     {"title": "Kitchen Deep Cleaning", "desc": "Degreasing, chimney exterior and cabinets.", "ptype": "fixed", "price": 1299, "unit": "per visit", "lead": "Next available slot", "delivery": ["at_home"], "attrs": {}},
     {"title": "Sofa Shampooing", "desc": "Per seat, fabric sofas.", "ptype": "per_unit", "price": 299, "unit": "per seat", "lead": "Next available slot", "delivery": ["at_home"], "attrs": {}}
   ]},
  {"slug": "fixit-pro-repairs", "name": "FixIt Pro Repairs", "cat": "repairs",
   "tagline": "AC, plumbing and electrical, same week", "locality": "Kukatpally", "area": ["Kukatpally", "KPHB", "Miyapur"],
   "desc": "Experienced technicians for AC servicing, plumbing and electrical work. Visit charge adjusted against the final bill.",
   "years": 9, "langs": ["Hindi", "Telugu"], "highlights": ["Visit charge adjusted", "Spare parts billed at cost"],
   "terms": "Spare parts billed separately.", "verified": true,
   "pop": 16, "conv": 0.05, "resp": 1900, "cancel": 0.08,
   "services": [
     {"title": "AC Service", "desc": "Split or window AC servicing.", "ptype": "fixed", "price": 599, "unit": "per unit", "lead": "Within 2 days", "delivery": ["at_home"], "attrs": {}},
     {"title": "Plumbing Visit", "desc": "Leaks, taps and fittings.", "ptype": "from", "price": 299, "unit": "per visit", "lead": "Within 2 days", "delivery": ["at_home"], "attrs": {}},
     {"title": "Electrician Visit", "desc": "Wiring, switches and fixtures.", "ptype": "from", "price": 249, "unit": "per visit", "lead": "Within 2 days", "delivery": ["at_home"], "attrs": {}}
   ]},
  {"slug": "glow-by-ananya", "name": "Glow by Ananya", "cat": "beauty-wellness",
   "tagline": "Bridal & party makeup at home", "locality": "Jubilee Hills", "area": ["Jubilee Hills", "Banjara Hills", "Film Nagar"],
   "desc": "Certified makeup artist offering bridal, engagement and party looks at your home, using premium products.",
   "years": 6, "langs": ["English", "Hindi", "Telugu"], "highlights": ["Certified artist", "Premium products"],
   "terms": "Bridal bookings need a 25% advance.", "verified": true,
   "pop": 15, "conv": 0.035, "resp": 90, "cancel": 0.04,
   "services": [
     {"title": "Bridal Makeup", "desc": "Includes hairstyling and draping.", "ptype": "from", "price": 15000, "unit": "per event", "lead": "Book 3+ weeks ahead", "delivery": ["at_home"], "attrs": {}},
     {"title": "Party Makeup", "desc": "Evening and party looks.", "ptype": "from", "price": 3500, "unit": "per person", "lead": "Book 2+ days ahead", "delivery": ["at_home"], "attrs": {}},
     {"title": "At-home Facial", "desc": "Relaxing facial with premium products.", "ptype": "fixed", "price": 1200, "unit": "per session", "lead": "Next day", "delivery": ["at_home"], "attrs": {}}
   ]},
  {"slug": "fitlife-with-arjun", "name": "FitLife with Arjun", "cat": "fitness",
   "tagline": "Personal training & yoga", "locality": "HITEC City", "area": ["HITEC City", "Madhapur", "Online"],
   "desc": "Certified trainer offering one-to-one strength training, weight-loss plans and weekend yoga groups.",
   "years": 5, "langs": ["English", "Hindi"], "highlights": ["Certified trainer", "Diet guidance"],
   "terms": "Sessions rescheduled with 12 hours notice.", "verified": false,
   "pop": 6, "conv": 0.05, "resp": 120, "cancel": 0.05,
   "services": [
     {"title": "Personal Training", "desc": "One-to-one sessions at your gym or home.", "ptype": "fixed", "price": 800, "unit": "per session", "lead": "Start this week", "delivery": ["at_home"], "attrs": {}},
     {"title": "Weekend Yoga Group", "desc": "Saturday and Sunday mornings.", "ptype": "fixed", "price": 2500, "unit": "per month", "lead": "Next weekend", "delivery": ["at_home", "online"], "attrs": {}},
     {"title": "Online Fitness Plan", "desc": "Custom plan with weekly check-ins.", "ptype": "quote", "price": null, "unit": null, "lead": "Plan in 2 days", "delivery": ["online"], "attrs": {}}
   ]},
  {"slug": "utsav-events-and-decor", "name": "Utsav Events & Decor", "cat": "events",
   "tagline": "Birthdays, haldi and small celebrations", "locality": "Secunderabad", "area": ["Secunderabad", "Begumpet", "Trimulgherry"],
   "desc": "Theme decor and planning for birthdays, haldi, mehendi and small corporate events.",
   "years": 3, "langs": ["Hindi", "Telugu"], "highlights": ["Theme decor", "Balloon art"],
   "terms": "50% advance to confirm the date.", "verified": false,
   "pop": 10, "conv": 0.06, "resp": 150, "cancel": 0.35,
   "services": [
     {"title": "Birthday Decor", "desc": "Balloons, backdrop and table setup.", "ptype": "from", "price": 4999, "unit": "per event", "lead": "Book 3+ days ahead", "delivery": ["at_home"], "attrs": {}},
     {"title": "Haldi & Mehendi Setup", "desc": "Marigold decor, seating and props.", "ptype": "from", "price": 12000, "unit": "per event", "lead": "Book 1+ week ahead", "delivery": ["at_home"], "attrs": {}},
     {"title": "Corporate Events", "desc": "Office celebrations and team events.", "ptype": "quote", "price": null, "unit": null, "lead": "Quote in 2 days", "delivery": ["at_home"], "attrs": {}}
   ]},
  {"slug": "annapurna-tiffins", "name": "Annapurna Tiffins", "cat": "home-kitchen",
   "tagline": "Simple South Indian meals", "locality": "Ameerpet", "area": ["Ameerpet", "SR Nagar", "Punjagutta"],
   "desc": "Home-style South Indian lunch tiffins for students and working professionals.",
   "years": 10, "langs": ["Telugu", "Tamil"], "highlights": ["Pure veg"],
   "terms": "Weekly or monthly plans.", "verified": true,
   "pop": 9, "conv": 0.07, "resp": 45, "cancel": 0.02,
   "services": [
     {"title": "Lunch Tiffin", "desc": "Rice, sambar, rasam, curry and curd.", "ptype": "fixed", "price": 100, "unit": "per meal", "lead": "Start next day", "delivery": ["delivery"], "attrs": {"min_quantity": 5, "meal_types": ["Veg"]}},
     {"title": "Monthly Meal Plan", "desc": "22 working-day lunches.", "ptype": "fixed", "price": 2000, "unit": "per month", "lead": "Start next Monday", "delivery": ["delivery"], "attrs": {"min_quantity": 22}}
   ]},
  {"slug": "sugar-and-spice-bakes", "name": "Sugar & Spice Bakes", "cat": "food-baking",
   "tagline": "Cupcakes and tea cakes", "locality": "Manikonda", "area": [],
   "desc": "Cupcakes.", "years": 1, "langs": ["English"], "highlights": [],
   "terms": null, "verified": false,
   "pop": 3, "conv": 0.04, "resp": 200, "cancel": 0.05,
   "services": [
     {"title": "Cupcakes (Box of 6)", "desc": "Assorted flavours.", "ptype": "from", "price": null, "unit": "per box", "lead": null, "delivery": ["pickup"], "attrs": {}}
   ]},
  {"slug": "little-scholars-tutoring", "name": "Little Scholars Tutoring", "cat": "tutors",
   "tagline": "Primary-school tuition and phonics", "locality": "Miyapur", "area": ["Miyapur", "Chandanagar"],
   "desc": "Patient, activity-based tuition for primary-school children, including phonics and handwriting.",
   "years": 4, "langs": ["English", "Telugu"], "highlights": ["Activity-based learning"],
   "terms": "Monthly fees.", "verified": false,
   "pop": 5, "conv": 0.05, "resp": 240, "cancel": 0.05,
   "services": [
     {"title": "Primary Tuition (Classes 1 to 3)", "desc": "All subjects, small groups.", "ptype": "fixed", "price": 2000, "unit": "per month", "lead": "Start this week", "delivery": ["at_home"], "attrs": {}},
     {"title": "Phonics & Handwriting", "desc": "8-week course.", "ptype": "fixed", "price": 3500, "unit": "per course", "lead": "Next batch", "delivery": ["at_home", "online"], "attrs": {}}
   ]},
  {"slug": "henna-art-by-zoya", "name": "Henna Art by Zoya", "cat": "beauty-wellness",
   "tagline": "Bridal and festive mehendi", "locality": "Tolichowki", "area": ["Tolichowki", "Mehdipatnam"],
   "desc": "Intricate bridal and festive mehendi designs using natural henna.", "years": 5, "langs": ["Urdu", "Hindi", "English"], "highlights": ["Natural henna"],
   "terms": null, "owner": "zoya.henna@example.com", "owner_name": "Zoya Khan", "verified": false, "status": "pending",
   "pop": 0, "conv": 0, "resp": 0, "cancel": 0,
   "services": [
     {"title": "Bridal Mehendi", "desc": "Full hands and feet.", "ptype": "from", "price": 5000, "unit": "per event", "lead": "Book 1+ week ahead", "delivery": ["at_home"], "attrs": {}}
   ]}
  ]$json$::jsonb;
  v jsonb; s jsonb;
  v_id uuid; v_cat uuid; v_owner uuid; v_checks jsonb; i int := 0;
begin
  for v in select * from jsonb_array_elements(data) loop
    select id into v_cat from public.categories where slug = v ->> 'cat';
    v_owner := null;
    if v ? 'owner' then
      v_owner := pg_temp.seed_user(v ->> 'owner', v ->> 'owner_name', pw,
                                   case when coalesce(v ->> 'status', 'active') = 'active' then 'vendor' else 'customer' end::public.app_role);
    end if;
    v_checks := case
      when v ->> 'verified' = 'true' then '{"identity": true, "address": true, "licence": true, "quality": true}'::jsonb
      when v ->> 'verified' = 'partial' then '{"identity": true, "address": true, "licence": false, "quality": false}'::jsonb
      else '{}'::jsonb end;

    insert into public.vendors (owner_user_id, slug, name, tagline, description, locality, city, service_area,
                                primary_category_id, years_experience, languages, highlights, key_terms, status,
                                verification, verification_checks, verified_at, is_demo, created_at)
    values (v_owner, v ->> 'slug', v ->> 'name', v ->> 'tagline', v ->> 'desc', v ->> 'locality', 'Hyderabad',
            array(select jsonb_array_elements_text(v -> 'area')), v_cat, (v ->> 'years')::int,
            array(select jsonb_array_elements_text(v -> 'langs')), array(select jsonb_array_elements_text(v -> 'highlights')),
            v ->> 'terms', coalesce(v ->> 'status', 'active')::public.vendor_status,
            case when v ->> 'verified' = 'true' then 'verified' when v ->> 'verified' = 'partial' then 'pending' else 'unverified' end::public.verification_status,
            v_checks, case when v ->> 'verified' = 'true' then now() - interval '60 days' end, true,
            now() - interval '120 days' + make_interval(days => i))
    on conflict (slug) do nothing
    returning id into v_id;
    if v_id is null then continue; end if;
    i := i + 1;

    insert into public.vendor_categories (vendor_id, category_id) values (v_id, v_cat);
    if v_owner is not null then
      insert into public.vendor_members (vendor_id, user_id, member_role) values (v_id, v_owner, 'owner');
    end if;

    for s in select * from jsonb_array_elements(v -> 'services') loop
      insert into public.services (vendor_id, category_id, title, description, price_type, price_amount, price_unit,
                                   lead_time, delivery_options, attributes, is_demo)
      values (v_id, v_cat, s ->> 'title', s ->> 'desc', s ->> 'ptype', (s ->> 'price')::numeric, s ->> 'unit',
              s ->> 'lead', array(select jsonb_array_elements_text(s -> 'delivery')), coalesce(s -> 'attrs', '{}'::jsonb), true);
    end loop;

    insert into seed_vendor_meta values (v_id, (v ->> 'pop')::numeric, (v ->> 'conv')::numeric,
                                         (v ->> 'resp')::numeric, (v ->> 'cancel')::numeric);
  end loop;

  -- pending application ticket
  insert into public.support_tickets (topic, name, email, message, linked_type, linked_id, user_id, queue, consent_at, is_demo)
  select 'listing', 'Zoya Khan', 'zoya.henna@example.com', 'New provider application: Henna Art by Zoya', 'vendor', v2.id,
         v2.owner_user_id, 'onboarding', now() - interval '2 days', true
    from public.vendors v2 where v2.slug = 'henna-art-by-zoya';
end $$;

-- ---------- 90 days of profile views ----------
insert into public.analytics_events (event_type, session_id, vendor_id, source, created_at, is_demo)
select 'profile_view',
       'demo-' || floor(random() * 6000)::int,
       m.vendor_id,
       pg_temp.pick(array['search', 'search', 'category', 'category', 'home_recommended', 'direct', 'whatsapp_share']),
       least(now(), (current_date - d) + random() * interval '1 day'),
       true
from seed_vendor_meta m
cross join generate_series(0, 89) d
cross join lateral generate_series(1, greatest(0, round(m.pop * (0.5 + random()) * (1 - d / 200.0)))::int) n
where m.pop > 0;

insert into public.analytics_events (event_type, session_id, source, meta, created_at, is_demo)
select 'search', 'demo-' || floor(random() * 6000)::int, 'home',
       jsonb_build_object('q', pg_temp.pick(array['cake', 'tiffin', 'tuition', 'ac service', 'makeup', 'tour package', 'cleaning', 'yoga'])),
       least(now(), (current_date - d) + random() * interval '1 day'), true
from generate_series(0, 89) d cross join lateral generate_series(1, 25 + floor(random() * 20)::int) n;

-- ---------- enquiries, orders, payments, ledger, reviews ----------
do $$
declare
  first_names text[] := array['Priya','Rahul','Ananya','Vikram','Sneha','Arjun','Kavya','Rohit','Divya','Karthik','Meghana','Sai','Lakshmi','Aditya','Pooja','Naveen','Swathi','Harsha','Ritu','Imran','Fatima','Joseph','Neha','Varun','Deepika','Suresh','Anjali','Manoj','Shreya','Farhan'];
  last_names text[] := array['Sharma','Reddy','Rao','Iyer','Khan','Gupta','Naidu','Verma','Patel','Menon','Joshi','Kumar','Das','Singh','Varma'];
  localities text[] := array['Kondapur','Gachibowli','Madhapur','Banjara Hills','Jubilee Hills','Kukatpally','Begumpet','Secunderabad','Ameerpet','Miyapur','Manikonda','HITEC City'];
  times text[] := array['Morning (9 to 12)','Afternoon (12 to 4)','Evening (4 to 8)','Flexible'];
  m record; d int; n int; k int;
  v_cust uuid; v_enq uuid; v_ord uuid; v_srv record; v_cat uuid; v_slug text;
  t_created timestamptz; t_assigned timestamptz; t_resp timestamptz; t_done timestamptz;
  r numeric; v_final public.order_status; v_amount numeric; v_name text; v_user uuid;
  v_assist boolean; v_req text; v_details jsonb; v_pref date; v_age numeric;
  v_commission numeric := 10; v_customer_users uuid[];
begin
  select array_agg(id) into v_customer_users from auth.users where email like 'demo.customer%@example.com';

  for m in select sm.*, v.slug, v.primary_category_id from seed_vendor_meta sm join public.vendors v on v.id = sm.vendor_id where sm.pop > 0 loop
    for d in 0..89 loop
      n := floor(m.pop * m.conv * (0.4 + random() * 1.2) * (1 - d / 200.0) + random())::int;
      for k in 1..n loop
        select * into v_srv from public.services where vendor_id = m.vendor_id order by random() limit 1;
        v_name := pg_temp.pick(first_names) || ' ' || pg_temp.pick(last_names);
        v_user := case when random() < 0.35 then v_customer_users[1 + floor(random() * array_length(v_customer_users, 1))::int] end;
        t_created := least(now() - interval '5 minutes', (current_date - d) + interval '8 hours' + random() * interval '13 hours');
        v_age := extract(epoch from now() - t_created) / 86400.0;
        v_assist := random() < 0.25;
        v_pref := (t_created + make_interval(days => 1 + floor(random() * 10)::int))::date;

        v_details := case m.slug
          when 'wings-in-air-tours-and-travel' then jsonb_build_object('destination', pg_temp.pick(array['Thailand','Dubai','Goa','Kerala','Singapore','Coorg']),
                         'travellers', 2 + floor(random() * 4)::int, 'nights', 3 + floor(random() * 5)::int)
          when 'rohans-home-kitchen' then jsonb_build_object('quantity', 5 + floor(random() * 20)::int, 'meal_preference', pg_temp.pick(array['Veg','Non-veg','Mixed']),
                         'fulfilment', pg_temp.pick(array['delivery','pickup']))
          when 'annapurna-tiffins' then jsonb_build_object('quantity', 5 + floor(random() * 20)::int, 'meal_preference', 'Veg', 'fulfilment', 'delivery')
          when 'meeras-home-baking' then jsonb_build_object('occasion', pg_temp.pick(array['Birthday','Anniversary','Office party','Just because']),
                         'quantity', pg_temp.pick(array['1 kg','1.5 kg','2 kg','1 pack','2 packs']), 'fulfilment', pg_temp.pick(array['delivery','pickup']))
          else '{}'::jsonb end;
        v_req := case m.slug
          when 'meeras-home-baking' then pg_temp.pick(array['Chocolate truffle cake with "Happy Birthday Aarav" on top.','Eggless red velvet for an anniversary, simple white design.','Two packs of choco chip cookies for a kids party.','Brownies and evening snacks for 10 people.'])
          when 'wings-in-air-tours-and-travel' then pg_temp.pick(array['Family trip in December, need hotel near the beach and airport transfers.','Honeymoon package, 5 nights, mid-range budget.','Weekend getaway for a group of friends.','Looking for a pilgrimage tour with parents, comfortable travel.'])
          when 'rohans-home-kitchen' then pg_temp.pick(array['Daily lunch tiffin for two working adults, less oil please.','Dinner for 8 guests on Saturday, North Indian menu.','Festive sweets box for Diwali gifting.','Office lunch for 25 people next Friday.'])
          else pg_temp.pick(array['Please share availability and price for this service.','Need this done this week if possible.','Looking for a reliable provider nearby, please call in the evening.','Want to book for next weekend.']) end;

        insert into public.customers (user_id, name, email, phone, consent_at, is_demo, created_at)
        values (v_user, v_name, lower(replace(v_name, ' ', '.')) || floor(random() * 900 + 100)::int || '@example.com',
                '9' || lpad(floor(random() * 1000000000)::text, 9, '0'), t_created, true, t_created)
        returning id into v_cust;

        -- outcome
        r := random();
        if v_age < 0.3 and r < 0.5 then v_final := null;                         -- still in admin queue
        elsif v_age < 1 and r < 0.6 then v_final := 'new';                         -- assigned, awaiting vendor
        elsif r < 0.07 then v_final := 'declined';
        elsif r < 0.07 + m.cancel then v_final := 'cancelled';
        elsif v_age < 2 then v_final := pg_temp.pick(array['accepted','in_progress'])::public.order_status;
        elsif v_age < 5 then v_final := pg_temp.pick(array['in_progress','completed','payment_recorded'])::public.order_status;
        elsif v_age < 10 then v_final := pg_temp.pick(array['completed','payment_recorded','submitted','closed','closed'])::public.order_status;
        else v_final := case when random() < 0.93 then 'closed' else 'submitted' end;
        end if;

        insert into public.enquiries (customer_id, user_id, requested_vendor_id, service_id, category_id, request,
                                      preferred_date, preferred_time, locality, details, assist_opt_in, assist_fee,
                                      source, status, vendor_id, assigned_at, is_demo, created_at, updated_at)
        values (v_cust, v_user, m.vendor_id, v_srv.id, m.primary_category_id, v_req, v_pref, pg_temp.pick(times),
                pg_temp.pick(localities), v_details, v_assist, case when v_assist then 49 else 0 end,
                pg_temp.pick(array['web','web','web','mobile_web','whatsapp_qr']),
                case when v_final is null then 'new'
                     when v_final = 'new' then 'assigned'
                     when v_final = 'declined' then (case when v_age < 1 then 'new' else 'cancelled' end)::public.enquiry_status
                     when v_final = 'cancelled' then 'cancelled'
                     when v_final = 'closed' then 'closed'
                     else 'in_fulfilment' end,
                case when v_final is null or v_final in ('declined') then null else m.vendor_id end,
                null, true, t_created, t_created)
        returning id into v_enq;

        insert into public.enquiry_events (enquiry_id, action, to_status, vendor_id, note, created_at)
        values (v_enq, 'created', 'new', m.vendor_id, 'Submitted via web', t_created);
        insert into public.analytics_events (event_type, session_id, vendor_id, service_id, source, created_at, is_demo)
        values ('enquiry_submitted', 'demo-' || floor(random() * 6000)::int, m.vendor_id, v_srv.id, 'web', t_created, true);

        continue when v_final is null;

        t_assigned := t_created + make_interval(mins => 5 + floor(random() * 50)::int);
        t_resp := t_assigned + make_interval(mins => greatest(3, round(m.resp_minutes * (0.3 + random() * 1.4)))::int);
        if t_resp > now() then t_resp := null; end if;
        if v_final <> 'new' and t_resp is null then t_resp := least(now(), t_assigned + interval '10 minutes'); end if;
        if v_final = 'new' then t_resp := null; end if;

        v_amount := case
          when v_srv.price_amount is null then 1000 * (2 + floor(random() * 20))
          when v_srv.price_unit in ('per meal') then v_srv.price_amount * (5 + floor(random() * 20))
          when v_srv.price_unit in ('per person') and v_srv.price_amount > 5000 then v_srv.price_amount * (2 + floor(random() * 3))
          when v_srv.price_unit in ('per person') then v_srv.price_amount * (4 + floor(random() * 10))
          when v_srv.price_unit in ('per kg') then v_srv.price_amount * (1 + floor(random() * 2))
          when v_srv.price_unit in ('per seat') then v_srv.price_amount * (3 + floor(random() * 5))
          else v_srv.price_amount * (1 + floor(random() * 2)) end;

        update public.enquiries set assigned_at = t_assigned where id = v_enq;
        insert into public.enquiry_events (enquiry_id, action, from_status, to_status, vendor_id, note, created_at)
        values (v_enq, 'assigned', 'new', 'assigned', m.vendor_id, 'Assigned to requested provider', t_assigned);

        insert into public.orders (enquiry_id, vendor_id, customer_id, service_id, customer_display_name, title, scope,
                                   agreed_amount, scheduled_for, status, first_response_at, is_demo, created_at, updated_at)
        values (v_enq, m.vendor_id, v_cust, v_srv.id, split_part(v_name, ' ', 1), v_srv.title, v_req,
                case when v_final in ('new', 'declined') then null else v_amount end,
                v_pref::timestamptz + interval '11 hours', v_final, t_resp, true, t_assigned, coalesce(t_resp, t_assigned))
        returning id into v_ord;

        insert into public.order_status_history (order_id, from_status, to_status, actor_role, note, created_at)
        values (v_ord, null, 'new', 'admin', 'Assigned by Tarkkash', t_assigned);

        if v_final = 'declined' then
          update public.orders set declined_at = t_resp where id = v_ord;
          insert into public.order_status_history (order_id, from_status, to_status, actor_role, note, created_at)
          values (v_ord, 'new', 'declined', 'vendor', 'Fully booked on the requested date', t_resp);
          insert into public.enquiry_events (enquiry_id, action, from_status, to_status, vendor_id, note, created_at)
          values (v_enq, 'returned', 'assigned', 'new', m.vendor_id, 'Fully booked on the requested date', t_resp);
          continue;
        end if;
        continue when v_final = 'new';

        -- accepted
        update public.orders set accepted_at = t_resp where id = v_ord;
        insert into public.order_status_history (order_id, from_status, to_status, actor_role, created_at)
        values (v_ord, 'new', 'accepted', 'vendor', t_resp);
        insert into public.enquiry_events (enquiry_id, action, from_status, to_status, vendor_id, created_at)
        values (v_enq, 'accepted', 'assigned', 'in_fulfilment', m.vendor_id, t_resp);

        if v_final = 'cancelled' then
          t_done := least(now(), t_resp + make_interval(hours => 2 + floor(random() * 40)::int));
          update public.orders set cancelled_at = t_done where id = v_ord;
          insert into public.order_status_history (order_id, from_status, to_status, actor_role, note, created_at)
          values (v_ord, 'accepted', 'cancelled', 'vendor', pg_temp.pick(array['Customer changed plans','Date clash','Customer unreachable']), t_done);
          insert into public.enquiry_events (enquiry_id, action, from_status, to_status, vendor_id, created_at)
          values (v_enq, 'cancelled', 'in_fulfilment', 'cancelled', m.vendor_id, t_done);
          continue;
        end if;
        continue when v_final = 'accepted';

        t_done := least(now(), t_resp + make_interval(hours => 3 + floor(random() * 20)::int));
        insert into public.order_status_history (order_id, from_status, to_status, actor_role, created_at)
        values (v_ord, 'accepted', 'in_progress', 'vendor', t_done);
        continue when v_final = 'in_progress';

        t_done := least(now(), t_done + make_interval(hours => 6 + floor(random() * 60)::int));
        update public.orders set completed_at = t_done where id = v_ord;
        insert into public.order_status_history (order_id, from_status, to_status, actor_role, created_at)
        values (v_ord, 'in_progress', 'completed', 'vendor', t_done);
        continue when v_final = 'completed';

        t_done := least(now(), t_done + make_interval(hours => 1 + floor(random() * 24)::int));
        insert into public.payments (order_id, amount, method, transaction_ref, recorded_by, status, is_demo, created_at, updated_at)
        select v_ord, v_amount, meth, case when meth = 'cash' then null else 'UPI' || floor(random() * 1e9)::bigint end,
               (select owner_user_id from public.vendors where id = m.vendor_id),
               case when v_final = 'closed' then 'verified' else 'recorded' end::public.payment_status, true, t_done, t_done
          from (select pg_temp.pick(array['upi','upi','upi','cash','bank_transfer']) as meth) q;
        insert into public.order_status_history (order_id, from_status, to_status, actor_role, note, created_at)
        values (v_ord, 'completed', 'payment_recorded', 'vendor', 'Payment of ₹' || v_amount || ' recorded', t_done);
        continue when v_final = 'payment_recorded';

        t_done := least(now(), t_done + make_interval(hours => 1 + floor(random() * 12)::int));
        update public.orders set submitted_at = t_done where id = v_ord;
        insert into public.order_status_history (order_id, from_status, to_status, actor_role, created_at)
        values (v_ord, 'payment_recorded', 'submitted', 'vendor', t_done);
        continue when v_final = 'submitted';

        t_done := least(now(), t_done + make_interval(hours => 2 + floor(random() * 30)::int));
        update public.orders set closed_at = t_done where id = v_ord;
        insert into public.order_status_history (order_id, from_status, to_status, actor_role, created_at)
        values (v_ord, 'submitted', 'closed', 'admin', t_done);
        insert into public.enquiry_events (enquiry_id, action, from_status, to_status, vendor_id, created_at)
        values (v_enq, 'closed', 'in_fulfilment', 'closed', m.vendor_id, t_done);

        insert into public.platform_ledger (txn_type, order_id, enquiry_id, vendor_id, amount, basis, reconciliation,
                                            recognized_on, note, is_demo, created_at)
        values ('commission', v_ord, v_enq, m.vendor_id, round(v_amount * v_commission / 100, 2),
                case when t_done < now() - interval '30 days' then 'actual' else 'accrued' end,
                case when t_done < now() - interval '30 days' then 'reconciled' else 'pending' end,
                (t_done at time zone 'Asia/Kolkata')::date, v_commission || '% commission on closed order', true, t_done);
        if v_assist then
          insert into public.platform_ledger (txn_type, order_id, enquiry_id, vendor_id, amount, direct_cost, basis, reconciliation,
                                              recognized_on, note, is_demo, created_at)
          values ('assist_fee', v_ord, v_enq, m.vendor_id, 49, 8,
                  case when t_done < now() - interval '30 days' then 'actual' else 'accrued' end,
                  case when t_done < now() - interval '30 days' then 'reconciled' else 'pending' end,
                  (t_done at time zone 'Asia/Kolkata')::date, 'Tarkkash Assist fee (₹8 coordination cost)', true, t_done);
        end if;

        if random() < 0.35 then
          insert into public.reviews (vendor_id, order_id, customer_id, user_id, author_name, rating, body, status, is_demo, created_at)
          values (m.vendor_id, v_ord, v_cust, v_user, split_part(v_name, ' ', 1),
                  case when m.slug = 'utsav-events-and-decor' then 2 + floor(random() * 3)::int
                       when random() < 0.7 then 5 when random() < 0.8 then 4 else 3 end,
                  pg_temp.pick(array['Lovely experience, everything was on time.','Great quality and very polite.','Good service, would book again.','Tarkkash coordination made it easy.','Exactly what we asked for.','Slight delay but the result was worth it.']),
                  'approved', true, t_done + interval '1 day');
        end if;
      end loop;
    end loop;
  end loop;

  -- A couple of reviews awaiting moderation
  update public.reviews set status = 'pending' where id in (select id from public.reviews order by created_at desc limit 3);
end $$;

-- ---------- Priya's own enquiries (demo customer account) ----------
do $$
declare
  v_user uuid := (select id from auth.users where email = 'priya.customer@example.com');
  v_cust uuid;
  v_meera uuid := (select id from public.vendors where slug = 'meeras-home-baking');
  v_srv uuid := (select id from public.services where vendor_id = v_meera and title = 'Custom Cakes');
  v_enq uuid; v_ord uuid; t timestamptz := now() - interval '6 days';
begin
  insert into public.customers (user_id, name, email, phone, consent_at, is_demo)
  values (v_user, 'Priya Sharma', 'priya.customer@example.com', '9876500001', t, true) returning id into v_cust;

  -- completed & closed cake order (eligible for a review)
  insert into public.enquiries (customer_id, user_id, requested_vendor_id, service_id, category_id, request, preferred_date,
                                preferred_time, locality, details, status, vendor_id, assigned_at, is_demo, created_at)
  values (v_cust, v_user, v_meera, v_srv, (select primary_category_id from public.vendors where id = v_meera),
          'Chocolate truffle cake (1 kg) with "Happy Birthday Aarav" on top.', (t + interval '2 days')::date, 'Evening (4 to 8)',
          'Kondapur', '{"occasion": "Birthday", "quantity": "1 kg", "fulfilment": "delivery"}', 'closed', v_meera,
          t + interval '10 minutes', true, t)
  returning id into v_enq;
  insert into public.orders (enquiry_id, vendor_id, customer_id, service_id, customer_display_name, title, scope, agreed_amount,
                             scheduled_for, status, first_response_at, accepted_at, completed_at, submitted_at, closed_at, is_demo, created_at)
  values (v_enq, v_meera, v_cust, v_srv, 'Priya', 'Custom Cakes', 'Chocolate truffle cake (1 kg) with "Happy Birthday Aarav" on top.',
          1250, t + interval '2 days 17 hours', 'closed', t + interval '40 minutes', t + interval '40 minutes',
          t + interval '2 days 18 hours', t + interval '2 days 20 hours', t + interval '3 days', true, t + interval '10 minutes')
  returning id into v_ord;
  insert into public.order_status_history (order_id, from_status, to_status, actor_role, note, created_at) values
    (v_ord, null, 'new', 'admin', 'Assigned by Tarkkash', t + interval '10 minutes'),
    (v_ord, 'new', 'accepted', 'vendor', null, t + interval '40 minutes'),
    (v_ord, 'accepted', 'in_progress', 'vendor', null, t + interval '1 day'),
    (v_ord, 'in_progress', 'completed', 'vendor', 'Delivered to customer', t + interval '2 days 18 hours'),
    (v_ord, 'completed', 'payment_recorded', 'vendor', 'Payment of ₹1250 recorded (upi)', t + interval '2 days 19 hours'),
    (v_ord, 'payment_recorded', 'submitted', 'vendor', null, t + interval '2 days 20 hours'),
    (v_ord, 'submitted', 'closed', 'admin', null, t + interval '3 days');
  insert into public.payments (order_id, amount, method, transaction_ref, status, is_demo, created_at)
  values (v_ord, 1250, 'upi', 'UPI458812309', 'verified', true, t + interval '2 days 19 hours');
  insert into public.platform_ledger (txn_type, order_id, enquiry_id, vendor_id, amount, basis, recognized_on, note, is_demo)
  values ('commission', v_ord, v_enq, v_meera, 125, 'accrued', (t + interval '3 days')::date, '10% commission on closed order', true);

  -- open enquiry still with Tarkkash
  insert into public.enquiries (customer_id, user_id, requested_vendor_id, category_id, request, preferred_date, preferred_time,
                                locality, details, status, is_demo, created_at)
  values (v_cust, v_user, (select id from public.vendors where slug = 'wings-in-air-tours-and-travel'),
          (select id from public.categories where slug = 'travel-tours'),
          'Family trip to Kerala in December: 2 adults, 1 child, 5 nights.', (now() + interval '45 days')::date, 'Flexible',
          'Kondapur', '{"destination": "Kerala", "travellers": 3, "nights": 5}', 'new', true, now() - interval '2 hours');

  insert into public.likes (user_id, vendor_id) values (v_user, v_meera) on conflict do nothing;
  insert into public.follows (user_id, vendor_id) values (v_user, v_meera) on conflict do nothing;
end $$;

-- ---------- likes & follows from demo customers ----------
insert into public.likes (user_id, vendor_id, created_at)
select u.id, m.vendor_id, now() - random() * interval '90 days'
from auth.users u cross join seed_vendor_meta m
where u.email like 'demo.customer%@example.com' and m.pop > 0 and random() < m.pop / 45.0
on conflict do nothing;

insert into public.follows (user_id, vendor_id, notify_updates, created_at)
select u.id, m.vendor_id, random() < 0.8, now() - random() * interval '90 days'
from auth.users u cross join seed_vendor_meta m
where u.email like 'demo.customer%@example.com' and m.pop > 0 and random() < m.pop / 60.0
on conflict do nothing;

-- ---------- vendor updates ----------
insert into public.vendor_updates (vendor_id, title, body, created_at)
select id, 'Diwali hampers now open', 'Pre-order festive cookie and brownie hampers. Limited slots each day.', now() - interval '3 days'
from public.vendors where slug = 'meeras-home-baking'
union all
select id, 'December Kerala departures', 'A few family slots left for our 5-night Kerala package.', now() - interval '6 days'
from public.vendors where slug = 'wings-in-air-tours-and-travel'
union all
select id, 'New: millet lunch option', 'Add a millet roti and salad to any tiffin plan.', now() - interval '10 days'
from public.vendors where slug = 'rohans-home-kitchen';

-- ---------- platform costs (illustrative) ----------
insert into public.cost_entries (cost_type, label, amount, incurred_on, basis, is_demo)
select c.cost_type, c.label, c.amount, (date_trunc('month', current_date) - make_interval(months => mo))::date + 4,
       case when mo = -1 then 'forecast' else 'actual' end, true
from generate_series(-1, 2) mo
cross join (values
  ('operating', 'Hosting & software', 4500),
  ('operating', 'Operations staff (part-time)', 30000),
  ('operating', 'Local marketing', 15000),
  ('direct', 'Payment and messaging fees', 2200),
  ('direct', 'Coordination calls', 1800)
) as c(cost_type, label, amount);

insert into public.platform_ledger (txn_type, amount, basis, recognized_on, note, is_demo)
values ('commission', 6500, 'forecast', (date_trunc('month', current_date) + interval '1 month')::date + 15, 'Next month commission forecast', true);

-- ---------- support tickets ----------
insert into public.support_tickets (topic, name, email, message, status, queue, consent_at, is_demo, created_at) values
  ('support', 'Rahul Verma', 'rahul.v@example.com', 'I submitted an enquiry yesterday for AC service but have not heard back yet.', 'open', 'support', now() - interval '20 hours', true, now() - interval '20 hours'),
  ('feature', 'Sneha Reddy', 'sneha.r@example.com', 'It would be great to save multiple delivery addresses in my account.', 'open', 'product', now() - interval '3 days', true, now() - interval '3 days'),
  ('partnership', 'Green Valley RWA', 'rwa.greenvalley@example.com', 'Our residents association would like to partner for a weekend local-makers market.', 'in_progress', 'partnerships', now() - interval '5 days', true, now() - interval '5 days'),
  ('general', 'Imran Khan', 'imran.k@example.com', 'Do you plan to cover Secunderabad cantonment area for home kitchens?', 'resolved', 'operations', now() - interval '9 days', true, now() - interval '9 days');

-- ---------- a few admin notifications ----------
insert into public.notifications (audience, title, body, link, created_at)
select 'admin', 'New enquiry ' || e.ref_code, coalesce(v.name, 'General request'), '/admin/enquiries/' || e.id, e.created_at
from public.enquiries e left join public.vendors v on v.id = e.requested_vendor_id
where e.status = 'new' order by e.created_at desc limit 10;

drop table seed_vendor_meta;
