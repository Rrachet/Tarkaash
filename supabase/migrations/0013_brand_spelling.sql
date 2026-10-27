-- 0013: brand spelling is "Tarkkash".
-- Rewrites stored text (settings labels, notifications, order notes, vendor copy, seed data) and
-- every public function whose messages mention the brand. The audit log is immutable and stays as written.

do $$
declare
  r record;
  n bigint;
  touched text[] := '{}';
  tbl text;
begin
  -- 1. Stored text in every public table (text, varchar, text[] and jsonb columns).
  for r in
    select c.table_name, c.column_name, c.data_type, c.udt_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
    where c.table_schema = 'public'
      and c.table_name not in ('audit_log', 'rate_limits')
      and (c.data_type in ('text', 'character varying', 'jsonb') or c.udt_name = '_text')
  loop
    execute format('select count(*) from public.%I where %I::text like %L', r.table_name, r.column_name, '%Tarkaash%') into n;
    continue when n = 0;

    -- Moderation and timestamp triggers must not fire for a pure spelling fix.
    if not r.table_name = any (touched) then
      execute format('alter table public.%I disable trigger user', r.table_name);
      touched := touched || r.table_name::text;
    end if;

    execute format(
      'update public.%1$I set %2$I = replace(%2$I::text, %3$L, %4$L)::%5$s where %2$I::text like %6$L',
      r.table_name, r.column_name, 'Tarkaash', 'Tarkkash',
      case when r.udt_name = '_text' then 'text[]' when r.data_type = 'jsonb' then 'jsonb' else 'text' end,
      '%Tarkaash%'
    );
    raise notice 'updated %.% (% rows)', r.table_name, r.column_name, n;
  end loop;

  foreach tbl in array touched loop
    execute format('alter table public.%I enable trigger user', tbl);
  end loop;

  -- 2. Function bodies (error and notification messages). Grants and SECURITY DEFINER are preserved.
  for r in
    select p.oid, p.proname
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public' and p.prokind = 'f' and p.prosrc like '%Tarkaash%'
  loop
    execute replace(pg_get_functiondef(r.oid), 'Tarkaash', 'Tarkkash');
    raise notice 'rewrote function %', r.proname;
  end loop;
end $$;

-- Remaining mentions (expect 0 functions).
select count(*) as functions_still_mentioning_old_spelling
from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
where ns.nspname = 'public' and p.prosrc like '%Tarkaash%';
