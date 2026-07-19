-- =========================================================================
-- Phase 1 security hardening (additive migration — does NOT edit history)
--
-- Contents:
--   1. Revoke anon execution of log_event (unauthenticated log injection).
--   2. Replace the world-readable listing-images storage SELECT policy with
--      one that mirrors listing visibility.
--   3. Enable Supabase Realtime for chat_messages (request chat live updates).
--
-- NOT applied automatically by pushing to GitHub. Apply manually in
-- Lovable Cloud (see PR/change notes). Rollback SQL is at the bottom.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. log_event: remove the anon grant
--
-- The original migration granted EXECUTE to `authenticated, anon`. The later
-- hardening migration revoked PUBLIC but never revoked the explicit anon
-- grant, so unauthenticated visitors can still insert arbitrary log rows
-- (actor_id NULL, attacker-controlled event_type/payload) — a log-spam and
-- log-injection vector against the admin logs evidence trail.
--
-- Impact after applying:
--   * Signed-in users: unchanged (still granted to authenticated).
--   * Anonymous visitors: log_event calls fail with a permission error.
--     The only anonymous caller in the app is the public /advisor page's
--     best-effort `ai_assistant_request` logging; the client ignores the
--     returned error, so the page keeps working — anonymous advisor queries
--     simply stop being logged. Signed-in advisor queries are still logged.
-- -------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.log_event(log_event_type, TEXT, TEXT, log_level, JSONB) FROM anon;

-- Applied 2026-07-19 (extended fix): the remix re-created all functions, which
-- restored Postgres's default EXECUTE-to-PUBLIC grant, so revoking `anon`
-- alone was not enough. Rights were reset for the whole function set:
-- REVOKE ... FROM PUBLIC, anon on every public function, then re-GRANT to
-- authenticated for the RPCs the app calls (has_role, log_event,
-- simulate_purchase, become_creator, accept_offer, admin_remove_listing,
-- admin_suspend_creator, admin_dashboard_stats, is_request_participant,
-- set_listing_status, delete_listing_if_safe, admin_generate_demo_catalog).
-- Trigger-only functions (set_updated_at, handle_new_user,
-- reviews_update_listing_rating) keep no client grants at all.
-- Verified live: anon calls to log_event/simulate_purchase/become_creator all
-- return 401.
--
-- Exception (applied 2026-07-19): has_role and is_request_participant are
-- GRANTED to anon as well — RLS policies on public tables (creator_profiles,
-- custom_requests) call has_role in their USING expressions, so anonymous
-- reads fail with "permission denied for function has_role" without it.
-- Both helpers return only booleans; no data exposure.

-- -------------------------------------------------------------------------
-- 2. listing-images storage: visibility-scoped read
--
-- Intended public-vs-private behavior (documented decision):
--   * Images of PUBLISHED listings whose creator is NOT suspended are
--     publicly readable — required so signed-out visitors browsing the
--     marketplace can load preview images (the app requests signed URLs
--     with the anon key; issuing a signed URL requires SELECT permission
--     on the object).
--   * Images of draft / removed_by_admin / suspended-creator listings are
--     readable only by the listing owner and admins.
--
-- The old policy ("listing-images: public read") allowed ANY object in the
-- bucket to be read by anyone, regardless of listing state. This policy
-- mirrors the visibility rule already used by the listing_images TABLE
-- policy, keyed on the {listing_id}/... object path convention.
--
-- Notes:
--   * Signed URLs issued BEFORE this change remain valid until their TTL
--     expires (the app uses a 1-hour TTL).
--   * Objects whose path prefix is not a known listing id become unreadable
--     to everyone except admins — intended (orphaned uploads).
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "listing-images: public read" ON storage.objects;

CREATE POLICY "listing-images: visibility-scoped read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'listing-images' AND (
      -- Admins read everything in the bucket.
      public.has_role(auth.uid(), 'admin')
      -- Owners read their own listings' images (any listing status).
      OR EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.id::text = split_part(name, '/', 1)
          AND l.creator_id = auth.uid()
      )
      -- Anyone (including anon) reads images of visible listings.
      OR EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.id::text = split_part(name, '/', 1)
          AND l.status = 'published'
          AND NOT EXISTS (
            SELECT 1 FROM public.creator_profiles cp
            WHERE cp.user_id = l.creator_id AND cp.is_suspended = true
          )
      )
    )
  );

-- -------------------------------------------------------------------------
-- 3. Realtime for request chat
--
-- Adds chat_messages to the supabase_realtime publication so the frontend
-- postgres_changes subscription on /requests/:id receives INSERT events.
-- Realtime enforces RLS: only request participants (per the existing
-- "chat: participants read" policy) receive the events.
-- Idempotent: skipped if the table is already in the publication.
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;

-- =========================================================================
-- ROLLBACK (run manually only if needed; restores the previous behavior)
-- =========================================================================
-- 1. Restore anon logging:
--    GRANT EXECUTE ON FUNCTION public.log_event(log_event_type, TEXT, TEXT, log_level, JSONB) TO anon;
--
-- 2. Restore world-readable bucket:
--    DROP POLICY IF EXISTS "listing-images: visibility-scoped read" ON storage.objects;
--    CREATE POLICY "listing-images: public read" ON storage.objects FOR SELECT
--      USING (bucket_id = 'listing-images');
--
-- 3. Disable chat realtime:
--    ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;
-- =========================================================================
