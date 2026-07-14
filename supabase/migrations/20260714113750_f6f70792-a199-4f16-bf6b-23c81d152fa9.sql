
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
    {"t":"Editorial Product Photography — Ceramic Vase","d":"Warm, softly diffused studio light on a matte ceramic vase against a linen backdrop. Editorial minimalism with negative space for copy.","m":"midjourney-v7","v":"v7","ar":"4:5","it":"Product","tags":["editorial","product","minimal","warm","studio"],"ur":"commercial","p":1500,"cs":94,"fp":"warm editorial product photograph of a matte ceramic vase on a linen backdrop, diffused softbox key light 45 degrees, gentle shadow, film grain, negative space top-right for copy --ar 4:5 --style raw --stylize 200","np":"low-res, watermark, deformed, plastic look, overexposed","st":{"aspect_ratio":"4:5","stylize":200,"chaos":5},"un":"Use for hero product pages, editorial catalogs, print. Adjust color of vase in the prompt without breaking lighting."},
    {"t":"Luxury Watch Campaign — Onyx & Gold","d":"Macro-detail luxury watch on obsidian surface, rim-lit gold accents, moody cinematic ad style.","m":"gpt-image-2","v":"2","ar":"3:2","it":"Product","tags":["luxury","watch","macro","cinematic","dark"],"ur":"extended","p":2200,"cs":92,"fp":"macro shot of a luxury mechanical watch, brushed steel and gold case, black leather strap, resting on polished obsidian, single rim light from behind, warm gold reflections, ultra sharp detail, cinematic advertising aesthetic","np":"blur, low detail, plastic, cartoon","st":{"aspect_ratio":"3:2","quality":"high"},"un":"Best for landing pages and print. Swap watch brand terms freely; keep lighting words."},
    {"t":"Cinematic Sneaker Advertisement","d":"Hero sneaker shot floating over concrete, cinematic teal & orange grade, motion streaks and dust.","m":"midjourney-v7","v":"v7","ar":"16:9","it":"Product","tags":["sneaker","cinematic","dynamic","street"],"ur":"commercial","p":1800,"cs":88,"fp":"cinematic hero shot of a high-top sneaker mid-air over cracked concrete, teal and orange color grade, dust particles and light motion streaks, dramatic side rim light, ultra detailed rubber and mesh textures, 35mm lens --ar 16:9 --style raw","np":"low quality, watermark, extra shoes, blurry","st":{"aspect_ratio":"16:9","stylize":180,"chaos":6},"un":"Great for social ad hero + reels. Duplicate with different colorways to keep consistency."},
    {"t":"Soft Studio Portrait — Editorial Beauty","d":"Beauty portrait with soft north-window light, natural skin texture, muted neutral palette.","m":"nano-banana-pro","v":"pro","ar":"4:5","it":"Portrait","tags":["portrait","beauty","editorial","soft","natural"],"ur":"commercial","p":1400,"cs":95,"fp":"soft editorial beauty portrait of a model with natural skin texture, north-facing window light, muted neutral wardrobe, subtle film grain, calm expression, negative space right","np":"plastic skin, over-smoothed, heavy makeup, cartoon","st":{"aspect_ratio":"4:5","subject_consistency":"high"},"un":"Keep window light phrasing. Change wardrobe descriptors for variations."},
    {"t":"Architectural Visualization — Coastal Villa","d":"Modern coastal villa at golden hour, glass and travertine, calm ocean beyond, arch-viz quality.","m":"gpt-image-2","v":"2","ar":"16:9","it":"Architecture","tags":["architecture","archviz","golden-hour","modern","coastal"],"ur":"extended","p":2500,"cs":90,"fp":"architectural visualization of a modern coastal villa, travertine walls, floor-to-ceiling glass, infinity pool overlooking calm ocean, golden hour, warm sunlight, photorealistic materials, wide angle","np":"low quality, distorted geometry, extra windows, cartoon","st":{"aspect_ratio":"16:9","quality":"high"},"un":"Adjust material words (travertine → concrete) to reskin. Keep light phrasing."},
    {"t":"Fashion Editorial — Minimal Streetwear","d":"Full-body fashion editorial in muted urban setting, high-contrast neutrals, magazine feel.","m":"midjourney-v7","v":"v7","ar":"2:3","it":"Fashion","tags":["fashion","editorial","street","minimal"],"ur":"commercial","p":1600,"cs":89,"fp":"full body fashion editorial of a model in minimal streetwear, muted urban brutalist setting, high contrast neutral palette, natural overcast light, 35mm lens, magazine tearsheet feel --ar 2:3 --style raw","np":"low-res, plastic, extra limbs, watermark","st":{"aspect_ratio":"2:3","stylize":180,"chaos":6},"un":"Change wardrobe words. Keep light + setting phrasing intact."},
    {"t":"Premium Food Photography — Dark & Moody","d":"Overhead dark & moody plated dish, rich shadows, steam, artisan bowl and linen.","m":"nano-banana-pro","v":"pro","ar":"1:1","it":"Food","tags":["food","dark","moody","overhead","artisan"],"ur":"commercial","p":1200,"cs":91,"fp":"overhead dark and moody food photograph of a plated dish in an artisan ceramic bowl, linen napkin, rich shadows, wisps of steam, single window light from left, ultra sharp","np":"cartoon, low detail, plastic food, watermark","st":{"aspect_ratio":"1:1","subject_consistency":"high"},"un":"Swap dish description; keep light + surface words for consistency."},
    {"t":"Mobile App Mockup — Fintech Dashboard","d":"Photo-real 3D render of a modern smartphone showing a fintech dashboard UI on a soft gradient.","m":"nano-banana-2","v":"2","ar":"3:2","it":"Mockup","tags":["mockup","app","fintech","3d"],"ur":"commercial","p":900,"cs":85,"fp":"photo-real 3D render of a modern smartphone floating slightly tilted, on-screen fintech dashboard with charts and cards, soft studio background from cream to warm gray, gentle contact shadow, ultra crisp screen","np":"blurry screen, wrong aspect ratio, watermark","st":{"aspect_ratio":"3:2","text_rendering":"crisp"},"un":"Screen content can be described more specifically per project."},
    {"t":"Minimal Logo Concept — Monogram","d":"Clean vector-style monogram on off-white, thin lines, editorial identity direction.","m":"gpt-image-2","v":"2","ar":"1:1","it":"Logo","tags":["logo","monogram","minimal","vector","identity"],"ur":"extended","p":700,"cs":82,"fp":"minimal vector-style monogram logo, elegant thin serif letterforms interlocked, single ink weight, centered on off-white background, editorial identity system reference","np":"3D, drop shadow, cluttered","st":{"aspect_ratio":"1:1","quality":"high"},"un":"Replace letters in prompt. Keep vector + line-weight phrasing."},
    {"t":"Travel Poster — Retro Alpine","d":"Retro travel poster illustration of alpine village, muted palette, silkscreen texture.","m":"midjourney-v7","v":"v7","ar":"2:3","it":"Illustration","tags":["poster","travel","retro","illustration","alpine"],"ur":"commercial","p":1100,"cs":87,"fp":"retro travel poster illustration of an alpine village at dawn, muted teal and warm ochre palette, silkscreen grain texture, flat shapes, 1950s tourism poster reference --ar 2:3 --style raw","np":"3D, photoreal, cluttered","st":{"aspect_ratio":"2:3","stylize":250,"chaos":10},"un":"Swap destination + palette words for series."},
    {"t":"Automotive Campaign — Coastal Highway","d":"Cinematic automotive campaign of a coupe on coastal highway at dusk, motion blur, moody grade.","m":"nano-banana-pro","v":"pro","ar":"21:9","it":"Automotive","tags":["automotive","cinematic","dusk","coastal","campaign"],"ur":"extended","p":2400,"cs":93,"fp":"cinematic automotive campaign shot of a sleek coupe on a winding coastal highway at dusk, subtle motion blur on wheels, moody teal-orange color grade, low three-quarter angle, ocean and cliffs in background, ultra sharp car","np":"cartoon, low detail, extra wheels, watermark","st":{"aspect_ratio":"21:9","subject_consistency":"high"},"un":"Change car type; keep light + grade phrasing."},
    {"t":"Social Media Campaign — Skincare Flatlay","d":"Bright flatlay of skincare products with botanical elements, airy pastel palette.","m":"nano-banana-2","v":"2","ar":"1:1","it":"Product","tags":["skincare","flatlay","pastel","social","botanical"],"ur":"commercial","p":1000,"cs":88,"fp":"overhead flatlay of premium skincare bottles arranged with fresh botanicals, airy pastel palette of cream and sage, natural daylight, soft shadows, minimalist composition, high resolution","np":"dark, cluttered, low detail","st":{"aspect_ratio":"1:1","text_rendering":"crisp"},"un":"Substitute product type; keep palette + light words."},
    {"t":"Interior Design Render — Warm Scandinavian","d":"Photoreal interior render of a warm Scandinavian living room, oak, wool, morning light.","m":"gpt-image-2","v":"2","ar":"3:2","it":"Interior","tags":["interior","scandi","warm","render","photoreal"],"ur":"extended","p":2000,"cs":90,"fp":"photoreal interior render of a warm scandinavian living room, wide oak floors, cream wool textiles, low sofa, matte black accents, tall window with soft morning light, subtle dust motes","np":"cartoon, low detail, cluttered, distorted perspective","st":{"aspect_ratio":"3:2","quality":"high"},"un":"Swap material and palette words. Keep light phrasing."},
    {"t":"Cosmetic Product Advertisement — Glass & Gold","d":"Hero ad of a glass cosmetic bottle with gold cap, splash of serum, minimal luxe background.","m":"nano-banana-pro","v":"pro","ar":"4:5","it":"Product","tags":["cosmetic","luxury","product","glass","splash"],"ur":"commercial","p":1700,"cs":92,"fp":"hero advertisement of a glass cosmetic bottle with gold cap, subtle serum splash frozen in air, minimal luxe background of soft warm gradient, hard rim light, ultra sharp product, editorial ad campaign","np":"low-res, plastic, cartoon, watermark","st":{"aspect_ratio":"4:5","subject_consistency":"high"},"un":"Replace bottle description; keep splash + rim-light words."},
    {"t":"Fantasy Environment Concept — Twilight Forest","d":"Painterly fantasy environment concept of a twilight forest with bioluminescent flora.","m":"nano-banana-2","v":"2","ar":"16:9","it":"Concept","tags":["fantasy","environment","concept","painterly","bioluminescent"],"ur":"personal","p":800,"cs":86,"fp":"painterly fantasy environment concept art of a twilight forest, bioluminescent moss and flowers glowing soft cyan, mist between towering trees, cinematic wide shot, dramatic god rays, matte painting quality","np":"photoreal, low detail, cluttered, extra characters","st":{"aspect_ratio":"16:9","text_rendering":"none"},"un":"Change biome and palette words to fork the recipe."}
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
      '',
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
