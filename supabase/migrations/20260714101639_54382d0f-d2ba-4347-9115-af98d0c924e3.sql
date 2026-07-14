
-- Demo catalog generator + safe delete + status change for creators.

CREATE OR REPLACE FUNCTION public.set_listing_status(_listing_id uuid, _status listing_status)
RETURNS listings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.listings;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_row FROM public.listings WHERE id = _listing_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'listing_not_found'; END IF;
  IF v_row.creator_id <> auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  IF _status NOT IN ('draft','published') THEN
    RAISE EXCEPTION 'invalid_status_for_creator';
  END IF;
  UPDATE public.listings SET status = _status WHERE id = _listing_id RETURNING * INTO v_row;
  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION public.delete_listing_if_safe(_listing_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_owner uuid; v_has_purchase boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT creator_id INTO v_owner FROM public.listings WHERE id = _listing_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'listing_not_found'; END IF;
  IF v_owner <> auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  SELECT EXISTS(SELECT 1 FROM public.purchases WHERE listing_id = _listing_id AND status = 'completed')
    INTO v_has_purchase;
  IF v_has_purchase THEN RAISE EXCEPTION 'listing_has_purchases'; END IF;
  DELETE FROM public.recipe_secrets WHERE listing_id = _listing_id;
  DELETE FROM public.listing_images WHERE listing_id = _listing_id;
  DELETE FROM public.listings WHERE id = _listing_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_generate_demo_catalog()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_has_creator boolean;
  v_created int := 0;
  v_skipped int := 0;
  v_specs jsonb := '[
    {"t":"Editorial Product Photography — Ceramic Vase","d":"Warm, softly diffused studio light on a matte ceramic vase against a linen backdrop. Editorial minimalism with negative space for copy.","m":"Midjourney","v":"v6.1","ar":"4:5","it":"Product","tags":["editorial","product","minimal","warm","studio"],"ur":"commercial","p":1500,"cs":94,"pp":"warm editorial product photograph of a matte ceramic vase, linen backdrop...","fp":"warm editorial product photograph of a matte ceramic vase on a linen backdrop, diffused softbox key light 45 degrees, gentle shadow, film grain, hasselblad look, negative space top-right for copy --ar 4:5 --style raw --stylize 200","np":"low-res, watermark, deformed, plastic look, overexposed","st":{"stylize":200,"chaos":5,"seed":"12345"},"un":"Use for hero product pages, editorial catalogs, print. Adjust color of vase in the prompt without breaking lighting."},
    {"t":"Luxury Watch Campaign — Onyx & Gold","d":"Macro-detail luxury watch on obsidian surface, rim-lit gold accents, moody cinematic ad style.","m":"Flux","v":"1.1 Pro","ar":"3:2","it":"Product","tags":["luxury","watch","macro","cinematic","dark"],"ur":"extended","p":2200,"cs":92,"pp":"macro luxury watch on obsidian, rim light gold accents...","fp":"macro shot of a luxury mechanical watch, brushed steel and gold case, black leather strap, resting on polished obsidian, single rim light from behind, warm gold reflections, ultra sharp detail, cinematic advertising aesthetic, shallow depth of field","np":"blur, low detail, plastic, cartoon","st":{"steps":40,"guidance":3.5,"seed":"77"},"un":"Best for landing pages and print. Swap watch brand terms freely; keep lighting words."},
    {"t":"Cinematic Sneaker Advertisement","d":"Hero sneaker shot floating over concrete, cinematic teal & orange grade, motion streaks and dust.","m":"SDXL","v":"1.0","ar":"16:9","it":"Product","tags":["sneaker","cinematic","dynamic","street"],"ur":"commercial","p":1800,"cs":88,"pp":"cinematic hero sneaker shot on concrete, teal and orange grade...","fp":"cinematic hero shot of a high-top sneaker mid-air over cracked concrete, teal and orange color grade, dust particles and light motion streaks, dramatic side rim light, ultra detailed rubber and mesh textures, 35mm lens","np":"low quality, watermark, extra shoes, blurry","st":{"sampler":"DPM++ 2M Karras","steps":32,"cfg":6.5},"un":"Great for social ad hero + reels. Duplicate with different colorways to keep consistency."},
    {"t":"Soft Studio Portrait — Editorial Beauty","d":"Beauty portrait with soft north-window light, natural skin texture, muted neutral palette.","m":"Midjourney","v":"v6.1","ar":"4:5","it":"Portrait","tags":["portrait","beauty","editorial","soft","natural"],"ur":"commercial","p":1400,"cs":95,"pp":"soft editorial beauty portrait, north window light, natural skin...","fp":"soft editorial beauty portrait of a model with natural skin texture, north-facing window light, muted neutral wardrobe, shot on 85mm f/1.4, subtle film grain, calm expression, negative space right --ar 4:5 --style raw","np":"plastic skin, over-smoothed, heavy makeup, cartoon","st":{"stylize":150,"chaos":3},"un":"Keep window light phrasing. Change wardrobe descriptors for variations."},
    {"t":"Architectural Visualization — Coastal Villa","d":"Modern coastal villa at golden hour, glass and travertine, calm ocean beyond, arch-viz quality.","m":"Flux","v":"1.1 Pro","ar":"16:9","it":"Architecture","tags":["architecture","archviz","golden-hour","modern","coastal"],"ur":"extended","p":2500,"cs":90,"pp":"modern coastal villa, golden hour, glass and travertine...","fp":"architectural visualization of a modern coastal villa, travertine walls, floor-to-ceiling glass, infinity pool overlooking calm ocean, golden hour, warm sunlight, corona render quality, photorealistic materials, wide angle","np":"low quality, distorted geometry, extra windows, cartoon","st":{"steps":45,"guidance":3.5},"un":"Adjust material words (travertine → concrete) to reskin. Keep light phrasing."},
    {"t":"Fashion Editorial — Minimal Streetwear","d":"Full-body fashion editorial in muted urban setting, high-contrast neutrals, magazine feel.","m":"Midjourney","v":"v6.1","ar":"2:3","it":"Fashion","tags":["fashion","editorial","street","minimal"],"ur":"commercial","p":1600,"cs":89,"pp":"minimal streetwear editorial, muted urban setting...","fp":"full body fashion editorial of a model in minimal streetwear, muted urban brutalist setting, high contrast neutral palette, natural overcast light, 35mm lens, magazine tearsheet feel --ar 2:3 --style raw","np":"low-res, plastic, extra limbs, watermark","st":{"stylize":180,"chaos":6},"un":"Change wardrobe words. Keep light + setting phrasing intact."},
    {"t":"Premium Food Photography — Dark & Moody","d":"Overhead dark & moody plated dish, rich shadows, steam, artisan bowl and linen.","m":"SDXL","v":"1.0","ar":"1:1","it":"Food","tags":["food","dark","moody","overhead","artisan"],"ur":"commercial","p":1200,"cs":91,"pp":"overhead dark and moody plated dish, artisan bowl...","fp":"overhead dark and moody food photograph of a plated dish in an artisan ceramic bowl, linen napkin, rich shadows, wisps of steam, single window light from left, ultra sharp, food photography, hasselblad look","np":"cartoon, low detail, plastic food, watermark","st":{"sampler":"DPM++ 2M Karras","steps":36,"cfg":7},"un":"Swap dish description; keep light + surface words for consistency."},
    {"t":"Mobile App Mockup — Fintech Dashboard","d":"Photo-real 3D render of a modern smartphone showing a fintech dashboard UI on a soft gradient.","m":"DALL-E","v":"3","ar":"3:2","it":"Mockup","tags":["mockup","app","fintech","3d","gradient"],"ur":"commercial","p":900,"cs":85,"pp":"3D render of a modern smartphone with fintech dashboard on gradient...","fp":"photo-real 3D render of a modern smartphone floating slightly tilted, on-screen fintech dashboard with charts and cards, soft studio gradient background from cream to warm gray, gentle contact shadow, ultra crisp screen","np":"blurry screen, wrong aspect ratio, watermark","st":{},"un":"Screen content can be described more specifically per project."},
    {"t":"Minimal Logo Concept — Monogram","d":"Clean vector-style monogram on off-white, thin lines, editorial identity direction.","m":"DALL-E","v":"3","ar":"1:1","it":"Logo","tags":["logo","monogram","minimal","vector","identity"],"ur":"extended","p":700,"cs":82,"pp":"minimal vector monogram logo, thin lines, off-white background...","fp":"minimal vector-style monogram logo, elegant thin serif letterforms interlocked, single ink weight, centered on off-white background, editorial identity system reference","np":"3D, gradient, drop shadow, cluttered","st":{},"un":"Replace letters in prompt. Keep vector + line-weight phrasing."},
    {"t":"Travel Poster — Retro Alpine","d":"Retro travel poster illustration of alpine village, muted palette, silkscreen texture.","m":"Midjourney","v":"v6.1","ar":"2:3","it":"Illustration","tags":["poster","travel","retro","illustration","alpine"],"ur":"commercial","p":1100,"cs":87,"pp":"retro travel poster of alpine village, muted palette, silkscreen texture...","fp":"retro travel poster illustration of an alpine village at dawn, muted teal and warm ochre palette, silkscreen grain texture, flat shapes, subtle gradients, 1950s tourism poster reference --ar 2:3 --style raw","np":"3D, photoreal, cluttered","st":{"stylize":250,"chaos":10},"un":"Swap destination + palette words for series."},
    {"t":"Automotive Campaign — Coastal Highway","d":"Cinematic automotive campaign of a coupe on coastal highway at dusk, motion blur, moody grade.","m":"Flux","v":"1.1 Pro","ar":"21:9","it":"Automotive","tags":["automotive","cinematic","dusk","coastal","campaign"],"ur":"extended","p":2400,"cs":93,"pp":"cinematic coupe on coastal highway at dusk, motion blur...","fp":"cinematic automotive campaign shot of a sleek coupe on a winding coastal highway at dusk, subtle motion blur on wheels, moody teal-orange color grade, low three-quarter angle, ocean and cliffs in background, ultra sharp car","np":"cartoon, low detail, extra wheels, watermark","st":{"steps":45,"guidance":3.5},"un":"Change car type; keep light + grade phrasing."},
    {"t":"Social Media Campaign — Skincare Flatlay","d":"Bright flatlay of skincare products with botanical elements, airy pastel palette.","m":"SDXL","v":"1.0","ar":"1:1","it":"Product","tags":["skincare","flatlay","pastel","social","botanical"],"ur":"commercial","p":1000,"cs":88,"pp":"bright airy skincare flatlay with botanicals, pastel palette...","fp":"overhead flatlay of premium skincare bottles arranged with fresh botanicals, airy pastel palette of cream and sage, natural daylight, soft shadows, minimalist composition, high resolution","np":"dark, cluttered, low detail","st":{"sampler":"DPM++ 2M Karras","steps":30,"cfg":6},"un":"Substitute product type; keep palette + light words."},
    {"t":"Interior Design Render — Warm Scandinavian","d":"Photoreal interior render of a warm Scandinavian living room, oak, wool, morning light.","m":"Flux","v":"1.1 Pro","ar":"3:2","it":"Interior","tags":["interior","scandi","warm","render","photoreal"],"ur":"extended","p":2000,"cs":90,"pp":"warm scandinavian living room, oak floors, wool textiles, morning light...","fp":"photoreal interior render of a warm scandinavian living room, wide oak floors, cream wool textiles, low sofa, matte black accents, tall window with soft morning light, subtle dust motes, corona render quality","np":"cartoon, low detail, cluttered, distorted perspective","st":{"steps":45,"guidance":3.5},"un":"Swap material and palette words. Keep light phrasing."},
    {"t":"Cosmetic Product Advertisement — Glass & Gold","d":"Hero ad of a glass cosmetic bottle with gold cap, splash of serum, minimal luxe background.","m":"Midjourney","v":"v6.1","ar":"4:5","it":"Product","tags":["cosmetic","luxury","product","glass","splash"],"ur":"commercial","p":1700,"cs":92,"pp":"hero cosmetic bottle with gold cap, serum splash, minimal luxe background...","fp":"hero advertisement of a glass cosmetic bottle with gold cap, subtle serum splash frozen in air, minimal luxe background of soft warm gradient, hard rim light, ultra sharp product, editorial ad campaign --ar 4:5 --style raw","np":"low-res, plastic, cartoon, watermark","st":{"stylize":200,"chaos":5},"un":"Replace bottle description; keep splash + rim-light words."},
    {"t":"Fantasy Environment Concept — Twilight Forest","d":"Painterly fantasy environment concept of a twilight forest with bioluminescent flora.","m":"Gemini Image","v":"3","ar":"16:9","it":"Concept","tags":["fantasy","environment","concept","painterly","bioluminescent"],"ur":"personal","p":800,"cs":86,"pp":"painterly fantasy twilight forest with bioluminescent flora...","fp":"painterly fantasy environment concept art of a twilight forest, bioluminescent moss and flowers glowing soft cyan, mist between towering trees, cinematic wide shot, dramatic god rays, matte painting quality","np":"photoreal, low detail, cluttered, extra characters","st":{},"un":"Change biome and palette words to fork the recipe."}
  ]'::jsonb;
  v_spec jsonb; v_new_listing_id uuid; v_exists boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF NOT public.has_role(v_uid,'admin') THEN RAISE EXCEPTION 'not_admin'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.creator_profiles WHERE user_id = v_uid) INTO v_has_creator;
  IF NOT v_has_creator THEN RAISE EXCEPTION 'admin_must_be_creator'; END IF;

  FOR v_spec IN SELECT * FROM jsonb_array_elements(v_specs)
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.listings
       WHERE creator_id = v_uid
         AND title = v_spec->>'t'
         AND 'pickture-demo' = ANY(style_tags)
    ) INTO v_exists;
    IF v_exists THEN v_skipped := v_skipped + 1; CONTINUE; END IF;

    INSERT INTO public.listings (
      creator_id, title, description, model, model_version, aspect_ratio, image_type,
      style_tags, usage_rights, price_cents, partial_prompt_preview, consistency_score, status
    ) VALUES (
      v_uid,
      v_spec->>'t',
      v_spec->>'d',
      v_spec->>'m',
      v_spec->>'v',
      v_spec->>'ar',
      v_spec->>'it',
      ARRAY(SELECT jsonb_array_elements_text(v_spec->'tags')) || ARRAY['pickture-demo'],
      (v_spec->>'ur')::usage_rights,
      (v_spec->>'p')::int,
      v_spec->>'pp',
      (v_spec->>'cs')::int,
      'published'
    ) RETURNING id INTO v_new_listing_id;

    INSERT INTO public.recipe_secrets (listing_id, full_prompt, negative_prompt, settings, usage_notes)
    VALUES (v_new_listing_id, v_spec->>'fp', v_spec->>'np', COALESCE(v_spec->'st','{}'::jsonb), v_spec->>'un');

    v_created := v_created + 1;
  END LOOP;

  INSERT INTO public.logs (actor_id, event_type, entity_type, entity_id, level, payload)
  VALUES (v_uid, 'admin_action', 'catalog', NULL, 'info',
    jsonb_build_object('action','generate_demo_catalog','created',v_created,'skipped',v_skipped));

  RETURN jsonb_build_object('created', v_created, 'skipped', v_skipped);
END $$;
