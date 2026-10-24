-- Public bucket for vendor-owned images. Files live under <vendor_id>/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vendor-media', 'vendor-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy vendor_media_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'vendor-media' and (
    (storage.foldername(name))[1] in (select x::text from public.my_vendor_ids() x) or public.is_admin()));
create policy vendor_media_modify on storage.objects for update to authenticated
  using (bucket_id = 'vendor-media' and (
    (storage.foldername(name))[1] in (select x::text from public.my_vendor_ids() x) or public.is_admin()));
create policy vendor_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'vendor-media' and (
    (storage.foldername(name))[1] in (select x::text from public.my_vendor_ids() x) or public.is_admin()));
