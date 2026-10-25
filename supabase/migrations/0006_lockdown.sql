-- Lock down: internal helpers are not callable from the API
revoke execute on function public._assign_enquiry(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.hit_rate_limit(text, int, interval) from public, anon, authenticated;
revoke execute on function public.notify(text, uuid, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.write_audit(text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

alter table public.vendors alter column city set default 'Hyderabad';
revoke execute on function public._range_start(date) from public, anon;
revoke execute on function public._range_end(date) from public, anon;
