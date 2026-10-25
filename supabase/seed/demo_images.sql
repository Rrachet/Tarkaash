-- Demo imagery from Unsplash (free Unsplash License). Product photos are used as vendor avatars
-- so no real person's face is attached to a fictional vendor. Replace with vendor-owned photos before launch.
create or replace function pg_temp.u(id text, w int default 1200, h int default 0) returns text language sql immutable as $$
  select 'https://images.unsplash.com/photo-' || id || '?auto=format&fit=crop&w=' || w || case when h > 0 then '&h=' || h else '' end || '&q=80';
$$;

update public.vendors v set avatar_url = pg_temp.u(x.av, 400, 400), cover_url = pg_temp.u(x.cv, 1600, 700)
from (values
  ('meeras-home-baking', '1578985545062-69928b1d9587', '1578985545062-69928b1d9587'),
  ('wings-in-air-tours-and-travel', '1488646953014-85cb44e25828', '1552733407-5d5c46c3bb3b'),
  ('rohans-home-kitchen', '1680993032090-1ef7ea9b51e5', '1585937421612-70a008356fbe'),
  ('brightsteps-tutors', '1503676260728-1c00da094a0b', '1571260899304-425eee4c7efc'),
  ('sparkle-home-cleaning', '1581578731548-c64695cc6952', '1581578731548-c64695cc6952'),
  ('fixit-pro-repairs', '1621905251189-08b45d6a269e', '1621905251189-08b45d6a269e'),
  ('glow-by-ananya', '1487412947147-5cebf100ffc2', '1487412947147-5cebf100ffc2'),
  ('fitlife-with-arjun', '1571019613454-1cb2f99b2d8b', '1544367567-0f2fcb009e0b'),
  ('utsav-events-and-decor', '1530103862676-de8c9debad1d', '1464366400600-7168b8af9bc3'),
  ('annapurna-tiffins', '1565557623262-b51c2513a641', '1565557623262-b51c2513a641'),
  ('little-scholars-tutoring', '1497633762265-9d179a990aa6', '1503676260728-1c00da094a0b'),
  ('henna-art-by-zoya', '1730003873829-09b4b16444c1', '1505932794465-147d1f1b2c97')
) as x(slug, av, cv) where v.slug = x.slug;

update public.services s set image_url = pg_temp.u(x.img, 800, 600)
from public.vendors v, (values
  ('meeras-home-baking', 'Custom Cakes', '1578985545062-69928b1d9587'),
  ('meeras-home-baking', 'Cookies (Pack of 6)', '1499636136210-6f4ee915583e'),
  ('meeras-home-baking', 'Evening Snacks', '1601050690597-df0568f70950'),
  ('meeras-home-baking', 'Brownies (Pack of 4)', '1606313564200-e75d5e30476c'),
  ('wings-in-air-tours-and-travel', 'Domestic Tour Packages', '1524492412937-b28074a5d7da'),
  ('wings-in-air-tours-and-travel', 'International Packages', '1525625293386-3f8f99389edd'),
  ('wings-in-air-tours-and-travel', 'Honeymoon Packages', '1507525428034-b723cf961d3e'),
  ('wings-in-air-tours-and-travel', 'Group Tours', '1469854523086-cc02fe5d8800'),
  ('wings-in-air-tours-and-travel', 'Custom Itinerary', '1488646953014-85cb44e25828'),
  ('rohans-home-kitchen', 'Daily Tiffin Service', '1680993032090-1ef7ea9b51e5'),
  ('rohans-home-kitchen', 'Custom Meal Orders', '1565557623262-b51c2513a641'),
  ('rohans-home-kitchen', 'Festive Specials', '1758910536889-43ce7b3199fd'),
  ('rohans-home-kitchen', 'Corporate Orders', '1504674900247-0877df9cc836'),
  ('brightsteps-tutors', 'Maths & Science Tuition', '1511629091441-ee46146481b6'),
  ('brightsteps-tutors', 'Spoken English', '1571260899304-425eee4c7efc'),
  ('brightsteps-tutors', 'Exam Preparation', '1497633762265-9d179a990aa6'),
  ('sparkle-home-cleaning', 'Full Home Deep Cleaning', '1581578731548-c64695cc6952'),
  ('fixit-pro-repairs', 'Electrician Visit', '1621905251189-08b45d6a269e'),
  ('glow-by-ananya', 'Bridal Makeup', '1487412947147-5cebf100ffc2'),
  ('glow-by-ananya', 'Party Makeup', '1522337360788-8b13dee7a37e'),
  ('fitlife-with-arjun', 'Personal Training', '1571019613454-1cb2f99b2d8b'),
  ('fitlife-with-arjun', 'Weekend Yoga Group', '1544367567-0f2fcb009e0b'),
  ('utsav-events-and-decor', 'Birthday Decor', '1530103862676-de8c9debad1d'),
  ('utsav-events-and-decor', 'Haldi & Mehendi Setup', '1505932794465-147d1f1b2c97'),
  ('utsav-events-and-decor', 'Corporate Events', '1464366400600-7168b8af9bc3'),
  ('annapurna-tiffins', 'Lunch Tiffin', '1565557623262-b51c2513a641'),
  ('annapurna-tiffins', 'Monthly Meal Plan', '1680993032090-1ef7ea9b51e5'),
  ('little-scholars-tutoring', 'Primary Tuition (Classes 1–3)', '1503676260728-1c00da094a0b'),
  ('little-scholars-tutoring', 'Phonics & Handwriting', '1497633762265-9d179a990aa6'),
  ('henna-art-by-zoya', 'Bridal Mehendi', '1730003873829-09b4b16444c1')
) as x(slug, title, img)
where v.slug = x.slug and s.vendor_id = v.id and s.title = x.title;

insert into public.vendor_media (vendor_id, url, caption, sort)
select v.id, pg_temp.u(x.img, 1000, 750), x.caption, x.sort
from public.vendors v join (values
  ('meeras-home-baking', '1578985545062-69928b1d9587', 'Chocolate truffle celebration cake', 1),
  ('meeras-home-baking', '1499636136210-6f4ee915583e', 'Choco chip cookies', 2),
  ('meeras-home-baking', '1606313564200-e75d5e30476c', 'Fudgy brownies', 3),
  ('meeras-home-baking', '1601050690597-df0568f70950', 'Evening samosas', 4),
  ('wings-in-air-tours-and-travel', '1552733407-5d5c46c3bb3b', 'Island hopping, Thailand', 1),
  ('wings-in-air-tours-and-travel', '1512453979798-5ea266f8880c', 'Dubai skyline', 2),
  ('wings-in-air-tours-and-travel', '1525625293386-3f8f99389edd', 'Marina Bay, Singapore', 3),
  ('wings-in-air-tours-and-travel', '1524492412937-b28074a5d7da', 'Taj Mahal, Agra', 4),
  ('rohans-home-kitchen', '1680993032090-1ef7ea9b51e5', 'Home-style thali', 1),
  ('rohans-home-kitchen', '1585937421612-70a008356fbe', 'North Indian curries', 2),
  ('rohans-home-kitchen', '1565557623262-b51c2513a641', 'Butter chicken with naan', 3),
  ('rohans-home-kitchen', '1758910536889-43ce7b3199fd', 'Festive sweets', 4),
  ('glow-by-ananya', '1487412947147-5cebf100ffc2', 'Evening look', 1),
  ('glow-by-ananya', '1522337360788-8b13dee7a37e', 'Hair styling', 2),
  ('glow-by-ananya', '1505932794465-147d1f1b2c97', 'Bridal party', 3),
  ('utsav-events-and-decor', '1530103862676-de8c9debad1d', 'Balloon decor', 1),
  ('utsav-events-and-decor', '1464366400600-7168b8af9bc3', 'Table setting', 2),
  ('utsav-events-and-decor', '1505932794465-147d1f1b2c97', 'Mehendi celebration', 3)
) as x(slug, img, caption, sort) on x.slug = v.slug;

-- Service display order
update public.services s set sort = x.sort
from (values
 ('Custom Cakes',10),('Cookies (Pack of 6)',20),('Evening Snacks',30),('Brownies (Pack of 4)',40),
 ('Domestic Tour Packages',10),('International Packages',20),('Honeymoon Packages',30),('Group Tours',40),('Custom Itinerary',50),
 ('Daily Tiffin Service',10),('Custom Meal Orders',20),('Festive Specials',30),('Corporate Orders',40),
 ('Maths & Science Tuition',10),('Spoken English',20),('Exam Preparation',30),
 ('Full Home Deep Cleaning',10),('Kitchen Deep Cleaning',20),('Sofa Shampooing',30),
 ('AC Service',10),('Plumbing Visit',20),('Electrician Visit',30),
 ('Bridal Makeup',10),('Party Makeup',20),('At-home Facial',30),
 ('Personal Training',10),('Weekend Yoga Group',20),('Online Fitness Plan',30),
 ('Birthday Decor',10),('Haldi & Mehendi Setup',20),('Corporate Events',30),
 ('Lunch Tiffin',10),('Monthly Meal Plan',20)
) as x(title, sort) where s.title = x.title;
