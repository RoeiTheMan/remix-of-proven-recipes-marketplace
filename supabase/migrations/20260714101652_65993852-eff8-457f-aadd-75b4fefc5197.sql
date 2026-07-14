
REVOKE EXECUTE ON FUNCTION public.set_listing_status(uuid, listing_status) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_listing_if_safe(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_generate_demo_catalog() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_listing_status(uuid, listing_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_listing_if_safe(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_generate_demo_catalog() TO authenticated;
