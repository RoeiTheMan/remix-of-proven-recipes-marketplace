
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reviews_update_listing_rating() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_request_participant(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_event(log_event_type, TEXT, TEXT, log_level, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.simulate_purchase(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.become_creator(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_offer(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_remove_listing(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_suspend_creator(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_request_participant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_event(log_event_type, TEXT, TEXT, log_level, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.simulate_purchase(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.become_creator(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_offer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_listing(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspend_creator(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
