-- A removed vendor is hidden everywhere and kept only for records. Separate migration because a new
-- enum value cannot be used in the same transaction that adds it.
alter type public.vendor_status add value if not exists 'removed';
