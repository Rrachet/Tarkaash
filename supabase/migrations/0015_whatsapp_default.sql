-- 0015: new customers get WhatsApp updates by default (they can turn it off in My account).
alter table public.customers alter column comm_prefs set default '{"email": true, "sms": false, "whatsapp": true}'::jsonb;

-- Per-project step, run once (not stored in git because the URL is project specific):
--   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/notify-dispatch', 'notify_dispatch_url');
