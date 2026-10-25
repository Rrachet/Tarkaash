-- Anonymous visitors only need the public entry points (enquiry, contact, event logging)
-- and the helpers that read policies depend on. Everything else is signed-in only.
revoke execute on function
  public.admin_add_enquiry_note(uuid, text),
  public.admin_assign_enquiry(uuid, uuid, text),
  public.admin_link_vendor_member(uuid, text),
  public.admin_metrics(date, date, uuid, text, uuid),
  public.admin_set_enquiry_status(uuid, public.enquiry_status, text),
  public.admin_set_role(uuid, public.app_role),
  public.admin_set_vendor_status(uuid, public.vendor_status, text),
  public.admin_set_verification(uuid, jsonb),
  public.admin_update_ticket(uuid, public.ticket_status, boolean),
  public.boost_queue(date, date),
  public.commercial_summary(date, date),
  public.create_vendor_application(jsonb),
  public.listing_completeness(uuid),
  public.mark_notifications_read(uuid[]),
  public.my_customer_ids(),
  public.my_role(),
  public.order_contact(uuid),
  public.record_payment(uuid, numeric, text, text, text),
  public.staff_set_payment_status(uuid, public.payment_status),
  public.submit_review(uuid, integer, text),
  public.transition_order(uuid, public.order_status, text),
  public.vendor_metrics(uuid, date, date),
  public.vendor_update_order(uuid, numeric, timestamptz, text, text)
from public, anon;
grant execute on function
  public.admin_add_enquiry_note(uuid, text),
  public.admin_assign_enquiry(uuid, uuid, text),
  public.admin_link_vendor_member(uuid, text),
  public.admin_metrics(date, date, uuid, text, uuid),
  public.admin_set_enquiry_status(uuid, public.enquiry_status, text),
  public.admin_set_role(uuid, public.app_role),
  public.admin_set_vendor_status(uuid, public.vendor_status, text),
  public.admin_set_verification(uuid, jsonb),
  public.admin_update_ticket(uuid, public.ticket_status, boolean),
  public.boost_queue(date, date),
  public.commercial_summary(date, date),
  public.create_vendor_application(jsonb),
  public.listing_completeness(uuid),
  public.mark_notifications_read(uuid[]),
  public.my_customer_ids(),
  public.my_role(),
  public.order_contact(uuid),
  public.record_payment(uuid, numeric, text, text, text),
  public.staff_set_payment_status(uuid, public.payment_status),
  public.submit_review(uuid, integer, text),
  public.transition_order(uuid, public.order_status, text),
  public.vendor_metrics(uuid, date, date),
  public.vendor_update_order(uuid, numeric, timestamptz, text, text)
to authenticated;

-- Trigger functions are never called directly
revoke execute on function public.guard_profiles(), public.guard_vendors() from public, anon, authenticated;

-- New functions start locked down; grant explicitly
alter default privileges in schema public revoke execute on functions from anon;
