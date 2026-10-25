-- Performance pass from the Supabase advisor:
-- 1) evaluate auth.uid() once per query, 2) one permissive policy per table/action, 3) index foreign keys.

-- ---------- 1. auth.uid() as an init-plan ----------
drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_staff());
drop policy profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin()) with check (id = (select auth.uid()) or public.is_admin());

drop policy customers_select on public.customers;
create policy customers_select on public.customers for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
drop policy customers_update on public.customers;
create policy customers_update on public.customers for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());

drop policy enquiries_select on public.enquiries;
create policy enquiries_select on public.enquiries for select to authenticated
  using (
    user_id = (select auth.uid())
    or customer_id in (select public.my_customer_ids())
    or vendor_id in (select public.my_vendor_ids())
    or public.is_staff()
  );

drop policy enquiry_events_select on public.enquiry_events;
create policy enquiry_events_select on public.enquiry_events for select to authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.enquiries e where e.id = enquiry_id
               and (e.user_id = (select auth.uid()) or e.vendor_id in (select public.my_vendor_ids())))
  );

drop policy tickets_select on public.support_tickets;
create policy tickets_select on public.support_tickets for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

drop policy reviews_read on public.reviews;
create policy reviews_read on public.reviews for select to anon, authenticated
  using (status = 'approved' or user_id = (select auth.uid()) or public.is_vendor_member(vendor_id) or public.is_staff());

drop policy notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated
  using (
    (audience = 'user' and user_id = (select auth.uid()))
    or (audience = 'vendor' and vendor_id in (select public.my_vendor_ids()))
    or (audience = 'admin' and public.is_staff())
  );

-- ---------- 2. One permissive policy per action ----------
-- vendor_members
drop policy vendor_members_read on public.vendor_members;
drop policy vendor_members_admin on public.vendor_members;
create policy vendor_members_select on public.vendor_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
create policy vendor_members_insert on public.vendor_members for insert to authenticated with check (public.is_admin());
create policy vendor_members_update on public.vendor_members for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy vendor_members_delete on public.vendor_members for delete to authenticated using (public.is_admin());

-- follows
drop policy follows_own on public.follows;
drop policy follows_vendor_read on public.follows;
create policy follows_select on public.follows for select to authenticated
  using (user_id = (select auth.uid()) or public.is_vendor_member(vendor_id) or public.is_staff());
create policy follows_insert on public.follows for insert to authenticated with check (user_id = (select auth.uid()));
create policy follows_update on public.follows for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy follows_delete on public.follows for delete to authenticated using (user_id = (select auth.uid()));

-- likes
drop policy likes_own on public.likes;
drop policy likes_vendor_read on public.likes;
create policy likes_select on public.likes for select to authenticated
  using (user_id = (select auth.uid()) or public.is_vendor_member(vendor_id) or public.is_staff());
create policy likes_insert on public.likes for insert to authenticated with check (user_id = (select auth.uid()));
create policy likes_delete on public.likes for delete to authenticated using (user_id = (select auth.uid()));

-- categories (public read; admin write)
drop policy categories_admin on public.categories;
create policy categories_insert on public.categories for insert to authenticated with check (public.is_admin());
create policy categories_update on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy categories_delete on public.categories for delete to authenticated using (public.is_admin());

-- services (read policy already covers members and staff)
drop policy services_write on public.services;
create policy services_insert on public.services for insert to authenticated
  with check (public.is_vendor_member(vendor_id) or public.is_admin());
create policy services_update on public.services for update to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_admin())
  with check (public.is_vendor_member(vendor_id) or public.is_admin());
create policy services_delete on public.services for delete to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_admin());

-- vendor_categories, vendor_media, vendor_updates (public read; member/admin write)
drop policy vendor_categories_write on public.vendor_categories;
create policy vendor_categories_insert on public.vendor_categories for insert to authenticated
  with check (public.is_vendor_member(vendor_id) or public.is_admin());
create policy vendor_categories_delete on public.vendor_categories for delete to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_admin());

drop policy vendor_media_write on public.vendor_media;
create policy vendor_media_insert on public.vendor_media for insert to authenticated
  with check (public.is_vendor_member(vendor_id) or public.is_admin());
create policy vendor_media_update on public.vendor_media for update to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_admin())
  with check (public.is_vendor_member(vendor_id) or public.is_admin());
create policy vendor_media_delete on public.vendor_media for delete to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_admin());

drop policy vendor_updates_write on public.vendor_updates;
create policy vendor_updates_insert on public.vendor_updates for insert to authenticated
  with check (public.is_vendor_member(vendor_id) or public.is_admin());
create policy vendor_updates_update on public.vendor_updates for update to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_admin())
  with check (public.is_vendor_member(vendor_id) or public.is_admin());
create policy vendor_updates_delete on public.vendor_updates for delete to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_admin());

-- ---------- 3. Foreign-key indexes ----------
create index if not exists analytics_events_service_idx on public.analytics_events (service_id);
create index if not exists analytics_events_user_idx on public.analytics_events (user_id);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id);
create index if not exists cost_entries_created_by_idx on public.cost_entries (created_by);
create index if not exists enquiries_category_idx on public.enquiries (category_id);
create index if not exists enquiries_service_idx on public.enquiries (service_id);
create index if not exists enquiry_events_actor_idx on public.enquiry_events (actor_id);
create index if not exists enquiry_events_vendor_idx on public.enquiry_events (vendor_id);
create index if not exists notifications_user_idx on public.notifications (user_id);
create index if not exists notifications_vendor_idx on public.notifications (vendor_id);
create index if not exists order_history_actor_idx on public.order_status_history (actor_id);
create index if not exists orders_service_idx on public.orders (service_id);
create index if not exists payments_recorded_by_idx on public.payments (recorded_by);
create index if not exists payments_verified_by_idx on public.payments (verified_by);
create index if not exists ledger_created_by_idx on public.platform_ledger (created_by);
create index if not exists ledger_enquiry_idx on public.platform_ledger (enquiry_id);
create index if not exists ledger_vendor_idx on public.platform_ledger (vendor_id);
create index if not exists reviews_customer_idx on public.reviews (customer_id);
create index if not exists reviews_user_idx on public.reviews (user_id);
create index if not exists settings_updated_by_idx on public.settings (updated_by);
create index if not exists support_tickets_owner_idx on public.support_tickets (owner_id);
create index if not exists support_tickets_user_idx on public.support_tickets (user_id);
create index if not exists vendor_categories_category_idx on public.vendor_categories (category_id);
create index if not exists vendors_owner_idx on public.vendors (owner_user_id);
