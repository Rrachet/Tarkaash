-- Copy cleanup: notification text written by the workflow functions no longer uses long dashes.
-- Rewrites the affected function bodies in place (CREATE OR REPLACE keeps existing grants).
do $$
declare
  r record;
  def text;
begin
  for r in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) ~ '[—–]'
  loop
    def := pg_get_functiondef(r.oid);
    def := replace(def, 'Declined — reassign ', 'Declined, reassign ');
    def := replace(def, 'Thank you — this order is complete.', 'Thank you, this order is complete.');
    def := replace(def, '''—''', '''N/A''');
    def := replace(replace(replace(def, ' — ', ', '), '—', ', '), '–', '-');
    execute def;
  end loop;
end $$;
