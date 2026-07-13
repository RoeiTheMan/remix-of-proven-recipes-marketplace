
-- =========================================================
-- Pickture M1 — schema, RLS, RPCs
-- =========================================================

-- ---------- ENUMS ----------
CREATE TYPE public.app_role AS ENUM ('buyer','creator','admin');
CREATE TYPE public.usage_rights AS ENUM ('personal','commercial','extended');
CREATE TYPE public.listing_status AS ENUM ('draft','published','removed_by_admin','suspended');
CREATE TYPE public.purchase_status AS ENUM ('pending','completed','failed','refunded');
CREATE TYPE public.request_status AS ENUM ('open','awarded','delivered','approved','closed','cancelled');
CREATE TYPE public.offer_status AS ENUM ('submitted','accepted','declined','withdrawn');
CREATE TYPE public.delivery_status AS ENUM ('delivered','revision_requested','approved');
CREATE TYPE public.report_status AS ENUM ('open','reviewing','actioned','dismissed');
CREATE TYPE public.report_reason AS ENUM ('copyright','misleading_preview','inappropriate','other');
CREATE TYPE public.log_level AS ENUM ('info','warn','error');
CREATE TYPE public.log_event_type AS ENUM (
  'login','prompt_upload','purchase','image_generation','ai_assistant_request',
  'voice_usage','email_sent','api_failure','listing_reported','admin_action'
);

-- ---------- updated_at helper ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- =========================================================
-- profiles
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by anyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles: user updates own" ON public.profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: user inserts own" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- user_roles
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles: read own" ON public.user_roles FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- =========================================================
-- creator_profiles
-- =========================================================
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tagline TEXT NOT NULL DEFAULT '',
  portfolio_url TEXT,
  reliability_score NUMERIC NOT NULL DEFAULT 0.8,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspended_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.creator_profiles TO anon;
GRANT SELECT, UPDATE ON public.creator_profiles TO authenticated;
GRANT ALL ON public.creator_profiles TO service_role;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_profiles: public non-suspended" ON public.creator_profiles FOR SELECT
  USING (is_suspended = false OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "creator_profiles: owner updates own" ON public.creator_profiles FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND is_suspended = false);
CREATE TRIGGER trg_creator_profiles_updated BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- listings
-- =========================================================
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL,
  model_version TEXT NOT NULL DEFAULT '',
  aspect_ratio TEXT NOT NULL DEFAULT '1:1',
  image_type TEXT NOT NULL DEFAULT '',
  style_tags TEXT[] NOT NULL DEFAULT '{}',
  usage_rights usage_rights NOT NULL DEFAULT 'personal',
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  partial_prompt_preview TEXT NOT NULL DEFAULT '',
  consistency_score INTEGER NOT NULL DEFAULT 80 CHECK (consistency_score BETWEEN 0 AND 100),
  avg_rating NUMERIC NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  status listing_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.listings (creator_id);
CREATE INDEX ON public.listings (status);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings: public published & creator active" ON public.listings FOR SELECT
  USING (
    status = 'published'
    AND NOT EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.user_id = listings.creator_id AND cp.is_suspended = true)
  );
CREATE POLICY "listings: owner reads own" ON public.listings FOR SELECT
  TO authenticated USING (creator_id = auth.uid());
CREATE POLICY "listings: admin reads all" ON public.listings FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "listings: owner inserts own" ON public.listings FOR INSERT
  TO authenticated WITH CHECK (creator_id = auth.uid() AND public.has_role(auth.uid(),'creator'));
CREATE POLICY "listings: owner updates own" ON public.listings FOR UPDATE
  TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "listings: admin updates all" ON public.listings FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_listings_updated BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- purchases (must exist BEFORE recipe_secrets policy references it)
-- =========================================================
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL,
  usage_rights usage_rights NOT NULL,
  status purchase_status NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.purchases (buyer_id);
CREATE INDEX ON public.purchases (listing_id);
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases: buyer reads own" ON public.purchases FOR SELECT
  TO authenticated USING (buyer_id = auth.uid());
CREATE POLICY "purchases: creator reads own listings sales" ON public.purchases FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = purchases.listing_id AND l.creator_id = auth.uid()));
CREATE POLICY "purchases: admin reads all" ON public.purchases FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_purchases_updated BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- recipe_secrets
-- =========================================================
CREATE TABLE public.recipe_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL UNIQUE REFERENCES public.listings(id) ON DELETE CASCADE,
  full_prompt TEXT NOT NULL DEFAULT '',
  negative_prompt TEXT NOT NULL DEFAULT '',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  usage_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_secrets TO authenticated;
GRANT ALL ON public.recipe_secrets TO service_role;
ALTER TABLE public.recipe_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipe_secrets: owner/buyer/admin read" ON public.recipe_secrets FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = recipe_secrets.listing_id AND l.creator_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.listing_id = recipe_secrets.listing_id AND p.buyer_id = auth.uid() AND p.status = 'completed'
    )
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "recipe_secrets: owner inserts" ON public.recipe_secrets FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = recipe_secrets.listing_id AND l.creator_id = auth.uid())
  );
CREATE POLICY "recipe_secrets: owner updates" ON public.recipe_secrets FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = recipe_secrets.listing_id AND l.creator_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = recipe_secrets.listing_id AND l.creator_id = auth.uid())
  );
CREATE TRIGGER trg_recipe_secrets_updated BEFORE UPDATE ON public.recipe_secrets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- listing_images
-- =========================================================
CREATE TABLE public.listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload','generated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.listing_images (listing_id);
GRANT SELECT ON public.listing_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_images TO authenticated;
GRANT ALL ON public.listing_images TO service_role;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_images: public when listing visible" ON public.listing_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_images.listing_id
        AND l.status = 'published'
        AND NOT EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.user_id = l.creator_id AND cp.is_suspended = true)
    )
    OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_images.listing_id AND l.creator_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "listing_images: owner writes" ON public.listing_images FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_images.listing_id AND l.creator_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_images.listing_id AND l.creator_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );

-- =========================================================
-- reviews
-- =========================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL UNIQUE REFERENCES public.purchases(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  test_generation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.reviews (listing_id);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews: public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews: buyer inserts own after purchase" ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.id = reviews.purchase_id AND p.buyer_id = auth.uid()
        AND p.listing_id = reviews.listing_id AND p.status = 'completed'
    )
  );

CREATE OR REPLACE FUNCTION public.reviews_update_listing_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE avg_r NUMERIC; cnt INTEGER;
BEGIN
  SELECT COALESCE(AVG(rating),0), COUNT(*) INTO avg_r, cnt FROM public.reviews WHERE listing_id = NEW.listing_id;
  UPDATE public.listings SET avg_rating = ROUND(avg_r::numeric, 2), rating_count = cnt WHERE id = NEW.listing_id;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_reviews_rating AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_update_listing_rating();

-- =========================================================
-- custom_requests
-- =========================================================
CREATE TABLE public.custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  brief TEXT NOT NULL DEFAULT '',
  model_preference TEXT,
  budget_cents INTEGER NOT NULL DEFAULT 0,
  deadline DATE,
  usage_rights usage_rights NOT NULL DEFAULT 'personal',
  reference_image_path TEXT,
  status request_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_requests TO anon, authenticated;
GRANT INSERT, UPDATE ON public.custom_requests TO authenticated;
GRANT ALL ON public.custom_requests TO service_role;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests: publicly visible board" ON public.custom_requests FOR SELECT
  USING (status IN ('open','awarded','delivered','approved') OR buyer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "requests: buyer inserts own" ON public.custom_requests FOR INSERT
  TO authenticated WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "requests: buyer updates own" ON public.custom_requests FOR UPDATE
  TO authenticated USING (buyer_id = auth.uid()) WITH CHECK (buyer_id = auth.uid());
CREATE TRIGGER trg_requests_updated BEFORE UPDATE ON public.custom_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- offers
-- =========================================================
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.custom_requests(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL,
  turnaround_days INTEGER NOT NULL DEFAULT 3,
  sample_direction TEXT NOT NULL DEFAULT '',
  status offer_status NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.offers (request_id);
GRANT SELECT, INSERT, UPDATE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers: stakeholders read" ON public.offers FOR SELECT
  TO authenticated USING (
    creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.custom_requests r WHERE r.id = offers.request_id AND r.buyer_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "offers: creator inserts own" ON public.offers FOR INSERT
  TO authenticated WITH CHECK (creator_id = auth.uid() AND public.has_role(auth.uid(),'creator'));
CREATE POLICY "offers: creator updates own" ON public.offers FOR UPDATE
  TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- chat_messages
-- =========================================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.custom_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachment_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.chat_messages (request_id);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_request_participant(_request_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.custom_requests r WHERE r.id = _request_id AND r.buyer_id = _user_id)
    OR EXISTS (SELECT 1 FROM public.offers o WHERE o.request_id = _request_id AND o.creator_id = _user_id AND o.status = 'accepted')
    OR public.has_role(_user_id, 'admin');
$$;
CREATE POLICY "chat: participants read" ON public.chat_messages FOR SELECT
  TO authenticated USING (public.is_request_participant(request_id, auth.uid()));
CREATE POLICY "chat: participants write" ON public.chat_messages FOR INSERT
  TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_request_participant(request_id, auth.uid()));

-- =========================================================
-- deliveries
-- =========================================================
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL UNIQUE REFERENCES public.offers(id) ON DELETE CASCADE,
  full_prompt TEXT NOT NULL DEFAULT '',
  negative_prompt TEXT NOT NULL DEFAULT '',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_image_path TEXT,
  status delivery_status NOT NULL DEFAULT 'delivered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.deliveries TO authenticated;
GRANT ALL ON public.deliveries TO service_role;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deliveries: participants read" ON public.deliveries FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.offers o JOIN public.custom_requests r ON r.id = o.request_id
      WHERE o.id = deliveries.offer_id AND (o.creator_id = auth.uid() OR r.buyer_id = auth.uid())
    ) OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "deliveries: accepted creator inserts" ON public.deliveries FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.offers o WHERE o.id = deliveries.offer_id AND o.creator_id = auth.uid() AND o.status = 'accepted')
  );
CREATE POLICY "deliveries: buyer updates status" ON public.deliveries FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.offers o JOIN public.custom_requests r ON r.id = o.request_id
      WHERE o.id = deliveries.offer_id AND r.buyer_id = auth.uid()
    )
  );
CREATE TRIGGER trg_deliveries_updated BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- reports
-- =========================================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status report_status NOT NULL DEFAULT 'open',
  admin_id UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports: reporter or admin reads" ON public.reports FOR SELECT
  TO authenticated USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reports: any auth inserts own" ON public.reports FOR INSERT
  TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports: admin updates" ON public.reports FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- notifications
-- =========================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications: user reads own" ON public.notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications: user marks own read" ON public.notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =========================================================
-- logs (append-only, admin-read)
-- =========================================================
CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  event_type log_event_type NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  level log_level NOT NULL DEFAULT 'info',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.logs TO authenticated;
GRANT ALL ON public.logs TO service_role;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs: admin reads" ON public.logs FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- Auth trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- RPCs
-- =========================================================
CREATE OR REPLACE FUNCTION public.log_event(
  _event_type log_event_type, _entity_type TEXT DEFAULT NULL, _entity_id TEXT DEFAULT NULL,
  _level log_level DEFAULT 'info', _payload JSONB DEFAULT '{}'::jsonb
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id UUID;
BEGIN
  INSERT INTO public.logs (actor_id, event_type, entity_type, entity_id, level, payload)
  VALUES (auth.uid(), _event_type, _entity_type, _entity_id, _level, _payload)
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;
GRANT EXECUTE ON FUNCTION public.log_event(log_event_type,TEXT,TEXT,log_level,JSONB) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.simulate_purchase(_listing_id UUID)
RETURNS public.purchases LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_listing public.listings; v_creator_suspended BOOLEAN; v_row public.purchases;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_listing FROM public.listings WHERE id = _listing_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'listing_not_found'; END IF;
  IF v_listing.status <> 'published' THEN RAISE EXCEPTION 'listing_not_published'; END IF;
  IF v_listing.creator_id = auth.uid() THEN RAISE EXCEPTION 'cannot_buy_own_listing'; END IF;
  SELECT is_suspended INTO v_creator_suspended FROM public.creator_profiles WHERE user_id = v_listing.creator_id;
  IF COALESCE(v_creator_suspended,false) THEN RAISE EXCEPTION 'creator_suspended'; END IF;

  SELECT * INTO v_row FROM public.purchases WHERE listing_id = _listing_id AND buyer_id = auth.uid() AND status = 'completed' LIMIT 1;
  IF FOUND THEN RETURN v_row; END IF;

  INSERT INTO public.purchases (listing_id, buyer_id, price_cents, usage_rights, status, payment_reference)
  VALUES (_listing_id, auth.uid(), v_listing.price_cents, v_listing.usage_rights, 'completed', 'sim_' || gen_random_uuid())
  RETURNING * INTO v_row;

  UPDATE public.listings SET sales_count = sales_count + 1 WHERE id = _listing_id;
  INSERT INTO public.notifications (user_id, type, payload)
    VALUES (v_listing.creator_id, 'sale', jsonb_build_object('listing_id', _listing_id, 'buyer_id', auth.uid(), 'price_cents', v_listing.price_cents));
  INSERT INTO public.logs (actor_id, event_type, entity_type, entity_id, level, payload)
    VALUES (auth.uid(), 'purchase', 'listing', _listing_id::text, 'info', jsonb_build_object('price_cents', v_listing.price_cents));
  RETURN v_row;
END $$;
GRANT EXECUTE ON FUNCTION public.simulate_purchase(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.become_creator(
  _display_name TEXT, _tagline TEXT, _portfolio_url TEXT, _bio TEXT
) RETURNS public.creator_profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.creator_profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  UPDATE public.profiles
    SET display_name = COALESCE(NULLIF(_display_name,''), display_name),
        bio = COALESCE(NULLIF(_bio,''), bio)
    WHERE id = auth.uid();
  INSERT INTO public.creator_profiles (user_id, tagline, portfolio_url)
  VALUES (auth.uid(), COALESCE(_tagline,''), _portfolio_url)
  ON CONFLICT (user_id) DO UPDATE
    SET tagline = EXCLUDED.tagline, portfolio_url = EXCLUDED.portfolio_url
  RETURNING * INTO v_row;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'creator')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN v_row;
END $$;
GRANT EXECUTE ON FUNCTION public.become_creator(TEXT,TEXT,TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_offer(_offer_id UUID)
RETURNS public.offers LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_offer public.offers; v_request public.custom_requests;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_offer FROM public.offers WHERE id = _offer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'offer_not_found'; END IF;
  IF v_offer.status <> 'submitted' THEN RAISE EXCEPTION 'offer_not_submitted'; END IF;
  SELECT * INTO v_request FROM public.custom_requests WHERE id = v_offer.request_id;
  IF v_request.buyer_id <> auth.uid() THEN RAISE EXCEPTION 'not_request_owner'; END IF;
  IF v_request.status <> 'open' THEN RAISE EXCEPTION 'request_not_open'; END IF;

  UPDATE public.offers SET status = 'accepted' WHERE id = _offer_id RETURNING * INTO v_offer;
  UPDATE public.offers SET status = 'declined' WHERE request_id = v_request.id AND id <> _offer_id AND status = 'submitted';
  UPDATE public.custom_requests SET status = 'awarded' WHERE id = v_request.id;

  INSERT INTO public.notifications (user_id, type, payload)
    VALUES (v_offer.creator_id, 'offer_accepted', jsonb_build_object('request_id', v_request.id, 'offer_id', _offer_id));
  RETURN v_offer;
END $$;
GRANT EXECUTE ON FUNCTION public.accept_offer(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_remove_listing(_listing_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not_admin'; END IF;
  UPDATE public.listings SET status = 'removed_by_admin' WHERE id = _listing_id;
  INSERT INTO public.logs (actor_id, event_type, entity_type, entity_id, level, payload)
  VALUES (auth.uid(),'admin_action','listing',_listing_id::text,'warn', jsonb_build_object('action','remove_listing'));
END $$;
GRANT EXECUTE ON FUNCTION public.admin_remove_listing(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_suspend_creator(_user_id UUID, _reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not_admin'; END IF;
  UPDATE public.creator_profiles SET is_suspended = true, suspended_reason = _reason WHERE user_id = _user_id;
  INSERT INTO public.logs (actor_id, event_type, entity_type, entity_id, level, payload)
  VALUES (auth.uid(),'admin_action','creator',_user_id::text,'warn', jsonb_build_object('action','suspend_creator','reason',_reason));
END $$;
GRANT EXECUTE ON FUNCTION public.admin_suspend_creator(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not_admin'; END IF;
  SELECT jsonb_build_object(
    'total_listings', (SELECT COUNT(*) FROM public.listings),
    'published_listings', (SELECT COUNT(*) FROM public.listings WHERE status='published'),
    'total_creators', (SELECT COUNT(*) FROM public.creator_profiles),
    'total_purchases', (SELECT COUNT(*) FROM public.purchases WHERE status='completed'),
    'total_reports_open', (SELECT COUNT(*) FROM public.reports WHERE status='open'),
    'gmv_cents', (SELECT COALESCE(SUM(price_cents),0) FROM public.purchases WHERE status='completed'),
    'listings_by_model', (SELECT COALESCE(jsonb_object_agg(model, cnt),'{}'::jsonb) FROM (SELECT model, COUNT(*) cnt FROM public.listings WHERE status='published' GROUP BY model) t),
    'rating_distribution', (SELECT COALESCE(jsonb_object_agg(rating::text, cnt),'{}'::jsonb) FROM (SELECT rating, COUNT(*) cnt FROM public.reviews GROUP BY rating) t)
  ) INTO result;
  RETURN result;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;

-- =========================================================
-- Storage RLS for bucket "listing-images"
-- Path convention: {listing_id}/{filename}
-- =========================================================
CREATE POLICY "listing-images: public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');
CREATE POLICY "listing-images: owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images' AND (
      public.has_role(auth.uid(),'admin')
      OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id::text = split_part(name,'/',1) AND l.creator_id = auth.uid())
    )
  );
CREATE POLICY "listing-images: owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'listing-images' AND (
      public.has_role(auth.uid(),'admin')
      OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id::text = split_part(name,'/',1) AND l.creator_id = auth.uid())
    )
  );
CREATE POLICY "listing-images: owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'listing-images' AND (
      public.has_role(auth.uid(),'admin')
      OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id::text = split_part(name,'/',1) AND l.creator_id = auth.uid())
    )
  );
