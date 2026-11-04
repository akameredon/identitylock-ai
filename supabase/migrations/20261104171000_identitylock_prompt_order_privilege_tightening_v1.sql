-- Tighten G05 order-table grants after checking Supabase default privileges.
-- The server role needs only read/insert/update for orders and read/insert for snapshots.
REVOKE ALL ON TABLE public.identitylock_orders FROM service_role;
REVOKE ALL ON TABLE public.identitylock_order_items FROM service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.identitylock_orders TO service_role;
GRANT SELECT, INSERT ON TABLE public.identitylock_order_items TO service_role;
