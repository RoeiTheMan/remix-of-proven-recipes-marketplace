DO $block$
DECLARE
  v_creator_id uuid;
  v_spec jsonb;
  v_listing_id uuid;
  v_specs jsonb := $json$
  [
    {
      "title": "Botanical Fragrance Campaign — Amber & Moss",
      "description": "Premium amber-glass fragrance photography on pale travertine with restrained moss and cedar styling, warm refraction, and clean copy space.",
      "aspect_ratio": "4:5",
      "image_type": "Product",
      "style_tags": ["fragrance", "product", "botanical", "amber", "luxury", "studio", "pickture-demo"],
      "usage_rights": "commercial",
      "price_cents": 1800,
      "consistency_score": 98,
      "full_prompt": "Use case: product-mockup. Create a premium botanical fragrance campaign image with a single unbranded amber-glass perfume bottle. Place it on a pale honed travertine plinth against a softly blurred warm-gray studio backdrop, with a restrained patch of deep green moss and one small cedar sprig beside the bottle. The bottle is rectangular with clean straight geometry, a thick glass base, warm honey-colored liquid, and a brushed bronze cylindrical cap, completely label-free. Photorealistic luxury product photography, portrait 4:5, subtle three-quarter angle, bottle centered slightly low with generous clean negative space above. Use a large softbox key from upper left and a narrow warm rim light through the glass, with controlled soft shadow. Realistic thick glass, liquid refraction, finely brushed metal, porous stone, and natural moss. Exactly one bottle. No text, label, logo, trademark, watermark, hands, extra bottles, or decorative border.",
      "negative_prompt": "floating objects, warped bottle geometry, plastic-looking glass, excessive foliage, oversaturated colors, harsh HDR, text, labels, logos, watermarks, hands, extra bottles",
      "settings": {
        "quality": "high",
        "reference_guidance": "Optional: attach one straight-on product reference and explicitly preserve bottle geometry, glass color, and cap finish.",
        "edit_instructions": "For campaign variants, change only the bottle color or botanical accent; preserve the camera angle, travertine plinth, negative space, and lighting direction.",
        "output_requirements": "Portrait 4:5; one unbranded bottle; photorealistic; no text, logos, trademarks, or watermark."
      },
      "usage_notes": "Keep the object count and lighting sentences unchanged for the most stable product geometry. Replace amber, bronze, moss, or cedar one element at a time when adapting the campaign."
    },
    {
      "title": "Café Launch Campaign — Sunlit Patisserie",
      "description": "Warm editorial café photography with an almond croissant, cappuccino, handmade ceramics, pale oak, and soft directional morning light.",
      "aspect_ratio": "4:5",
      "image_type": "Food",
      "style_tags": ["cafe", "patisserie", "croissant", "coffee", "morning-light", "editorial", "pickture-demo"],
      "usage_rights": "commercial",
      "price_cents": 1400,
      "consistency_score": 97,
      "full_prompt": "Use case: photorealistic-natural. Create a refined independent café launch image featuring a fresh almond croissant and cappuccino in soft morning light. Use a small round pale-oak café table near a tall window with a softly blurred warm cream interior. Show exactly one golden flaky almond croissant on a simple off-white ceramic plate, one cappuccino in a low off-white cup with a clean leaf-shaped foam pattern, a folded natural-linen napkin, and a small brushed-steel pastry fork. Photorealistic editorial food photography for a premium neighborhood patisserie. Portrait 4:5, three-quarter overhead view around 45 degrees, plate in the lower center and cup just behind it, with clean negative space in the upper third. Soft directional morning sunlight from the left with gentle window shadows. Emphasize crisp flaky pastry layers, sliced almonds, realistic coffee foam, handmade ceramic, natural linen, and subtle wood grain. No people, hands, text, menu, logo, trademark, watermark, extra plates, or decorative border.",
      "negative_prompt": "dark moody lighting, excessive crumbs, melted pastry, artificial gloss, clutter, oversaturation, harsh HDR, people, hands, text, logos, watermarks, extra plates",
      "settings": {
        "quality": "high",
        "reference_guidance": "If a real pastry or cup reference is attached, ask to preserve its silhouette and material while keeping the listed table, window, and light direction.",
        "edit_instructions": "For menu variants, replace only the pastry or drink; preserve the pale-oak table, off-white ceramics, linen, camera height, and left-side morning light.",
        "output_requirements": "Portrait 4:5; exactly one pastry and one coffee; realistic food texture; no people, text, logos, or watermark."
      },
      "usage_notes": "The fixed object count and placement make this suitable for a repeatable café launch series. Swap only one food or drink item per follow-up edit."
    },
    {
      "title": "Children’s Storybook — The Moonlit Fox",
      "description": "A polished gouache picture-book scene featuring a scarf-wearing fox cub and warm lantern glow in a safe, magical moonlit forest.",
      "aspect_ratio": "4:5",
      "image_type": "Illustration",
      "style_tags": ["storybook", "fox", "gouache", "children", "moonlight", "character", "pickture-demo"],
      "usage_rights": "commercial",
      "price_cents": 1200,
      "consistency_score": 96,
      "full_prompt": "Use case: illustration-story. Create a charming children's storybook illustration of a small fox cub carrying a glowing lantern through a quiet moonlit forest. Show a gentle forest path at night with rounded tree trunks, soft ferns, tiny pale mushrooms, distant blue hills, and a crescent moon between branches. The single fox cub has rust-red fur, a round face, large dark-brown eyes, a cream muzzle and chest, cream tail tip, short rounded ears, a teal knitted scarf, and a tiny brown cross-body satchel. The fox holds one warm glowing paper lantern and walks toward the viewer with a curious, calm expression. Hand-painted gouache on lightly textured paper with softly simplified shapes and polished picture-book quality. Portrait 4:5 full-page composition, full body visible, fox centered slightly low, clear winding path, and open moonlit sky above. Warm amber lantern glow against cool indigo moonlight. Cozy, safe, and magical, never frightening. Exactly one fox and one lantern. No text, lettering, logo, watermark, border, or extra characters.",
      "negative_prompt": "photorealism, 3D render, sharp anime linework, scary expression, extra limbs, extra characters, clothing beyond scarf and satchel, excessive sparkles, horror mood, text, logos, watermarks",
      "settings": {
        "quality": "high",
        "reference_guidance": "Use the first approved fox image as a character reference and explicitly preserve the face, fur markings, teal scarf, brown satchel, and cream tail tip.",
        "edit_instructions": "For new pages, change only the fox's action and the forest moment; repeat every character detail and keep the gouache medium and warm-versus-cool lighting relationship.",
        "output_requirements": "Portrait 4:5; full-body single fox; hand-painted gouache; no text, border, logo, or watermark."
      },
      "usage_notes": "For a multi-page story, attach the approved cover as a reference for every new scene. Keep the full character-description sentence unchanged and vary one action at a time."
    },
    {
      "title": "Jewelry Campaign — Sculpted Silver",
      "description": "Macro luxury jewelry photography featuring a fluid sterling-silver ring on charcoal stone with restrained studio reflections and clean copy space.",
      "aspect_ratio": "4:5",
      "image_type": "Product",
      "style_tags": ["jewelry", "silver", "ring", "luxury", "macro", "product", "studio", "pickture-demo"],
      "usage_rights": "commercial",
      "price_cents": 1700,
      "consistency_score": 98,
      "full_prompt": "Use case: product-mockup. Create a premium jewelry campaign image showing exactly one unbranded sculptural sterling-silver ring as the hero. Place the ring upright on a small irregular slab of charcoal-black stone against a softly blurred warm-gray studio backdrop. The ring has a thick, wearable band and a fluid asymmetrical wave silhouette with believable continuous geometry. Photorealistic luxury jewelry advertising photography, portrait 4:5, macro three-quarter view, ring centered slightly low with generous clean negative space in the upper third. Use a large softbox from upper left and a narrow cool rim light, with a subtle controlled shadow. Render physically coherent mirror-polished metal, fine micro-scratches, and porous matte stone. Exactly one ring. No hands, person, box, gemstones, text, labels, logos, trademarks, border, or watermark.",
      "negative_prompt": "multiple rings, gemstones, warped band, impossible reflections, melted metal, floating object, excessive gloss, hands, people, jewelry box, text, logos, watermarks",
      "settings": {
        "quality": "high",
        "reference_guidance": "Attach a straight-on jewelry reference only when needed and explicitly preserve the ring silhouette, band thickness, and metal finish.",
        "edit_instructions": "For campaign variants, change only the metal finish or stone surface; preserve the ring geometry, camera angle, object count, and lighting direction.",
        "output_requirements": "Portrait 4:5; exactly one wearable ring; photorealistic silver; no people, text, logos, or watermark."
      },
      "usage_notes": "Keep the wearable-geometry and single-object sentences unchanged. Alter one material or backdrop element per iteration to maintain consistent shape and reflections."
    },
    {
      "title": "Boutique Hotel Editorial — Mediterranean Morning",
      "description": "Serene coastal-hotel interior photography with limewashed arches, natural linen, pale oak, olive branches, and soft Mediterranean morning light.",
      "aspect_ratio": "4:5",
      "image_type": "Interior",
      "style_tags": ["hotel", "interior", "mediterranean", "coastal", "architecture", "linen", "morning-light", "pickture-demo"],
      "usage_rights": "commercial",
      "price_cents": 1600,
      "consistency_score": 97,
      "full_prompt": "Use case: photorealistic-natural. Create a premium boutique-hotel interior campaign image of a serene white-plaster bedroom opening through one rounded arch to a small sunlit terrace and a distant calm blue sea. Include one low natural-linen bed with softly rumpled cream bedding, one pale-oak side table, one handmade ceramic vase holding a single olive branch, and one woven rug. Use limewashed walls and restrained natural materials. Photorealistic architectural editorial photography, portrait 4:5, eye-level view with the arch and sea as the focal point, believable depth and clean negative space. Warm early-morning sunlight enters from the terrace with soft directional shadows. Use chalk white, sand, pale oak, muted olive, and restrained Mediterranean blue. Preserve realistic architecture, scale, linen, plaster, wood, woven fiber, and ceramic textures. No people, clutter, television, text, signage, labels, logos, trademarks, border, or watermark.",
      "negative_prompt": "impossible architecture, warped arch, distorted bed, excessive decor, sterile CGI, harsh HDR, oversaturation, people, text, signs, logos, watermarks",
      "settings": {
        "quality": "high",
        "reference_guidance": "If using a room reference, preserve the arch position, room proportions, and window direction while applying the listed material palette.",
        "edit_instructions": "For a hotel series, change only the room type or one textile accent; preserve the limewash, pale oak, olive branch, sea view, and morning-light direction.",
        "output_requirements": "Portrait 4:5; believable coastal bedroom architecture; natural materials; no people, text, logos, or watermark."
      },
      "usage_notes": "Keep the architecture and light-direction sentences fixed across a campaign. Replace one furnishing or textile accent at a time for coherent room variants."
    },
    {
      "title": "Automotive Campaign — Obsidian Performance",
      "description": "Photorealistic charcoal performance-sedan photography inside a monumental concrete gallery with restrained skylight reflections and real production-car detail.",
      "aspect_ratio": "4:5",
      "image_type": "Automotive",
      "style_tags": ["automotive", "sedan", "performance", "black", "brutalist", "concrete", "photorealistic", "pickture-demo"],
      "usage_rights": "commercial",
      "price_cents": 2000,
      "consistency_score": 98,
      "full_prompt": "Use case: ads-marketing. Create an indistinguishably photorealistic premium automotive photograph of exactly one original, unbranded charcoal-black performance sedan inside a large brutalist concrete gallery. The vehicle has sophisticated four-door production proportions, buildable metal stamping, authentic panel gaps, functional handles, plausible headlamps, a correct glasshouse, realistic wheels, visible brake hardware, road-going tire sidewalls and a mechanically believable stance. Frame a full-car side-front three-quarter angle in portrait 4:5 with the wheels straight, as if captured on a medium-format camera with a 65mm lens. Use diffused daylight from a high concrete skylight, large physically accurate reflections across the dark paint, and a gentle floor shadow. Include subtle dust at the tire contact areas, realistic windshield tint, neutral color science, and slight sensor grain. It must look like a real production-car photo, never CGI or a configurator render. No people, props, readable plate, badges, logos, trademarks, lettering, border, or watermark.",
      "negative_prompt": "CGI, 3D render, concept car, limousine proportions, fake vents, giant wheels, paper-thin tires, distorted wheels, malformed mirrors, impossible door seams, impossible reflections, excessive gloss, people, text, logos, watermarks",
      "settings": {
        "quality": "high",
        "reference_guidance": "Optional: attach one clean production-car side reference and require preservation of wheelbase, glasshouse, panel gaps, wheel diameter, and tire sidewalls.",
        "edit_instructions": "For campaign variants, change only the paint color or concrete location; preserve the vehicle proportions, wheel design, camera height, lens character, and skylight direction.",
        "output_requirements": "Portrait 4:5; exactly one believable production sedan; full vehicle visible; no people, badges, readable plate, logos, or watermark."
      },
      "usage_notes": "The realism constraints are essential. Keep the production-proportion, wheel, tire, panel-gap, camera, and non-CGI sentences unchanged when adapting the scene."
    },
    {
      "title": "Tech Product Launch — Quiet Form Headphones",
      "description": "Minimal premium headphone photography in bone white, taupe, brushed aluminum, and limestone with calm studio light and precise product geometry.",
      "aspect_ratio": "4:5",
      "image_type": "Product",
      "style_tags": ["headphones", "technology", "audio", "product", "minimal", "limestone", "studio", "pickture-demo"],
      "usage_rights": "commercial",
      "price_cents": 1600,
      "consistency_score": 97,
      "full_prompt": "Use case: product-mockup. Create a sophisticated consumer-technology launch image featuring exactly one pair of original, unbranded over-ear headphones in matte bone white. Suspend the headphones just above a pale limestone pedestal in a believable product-display pose against a minimal warm-gray curved studio backdrop. Use a smoothly padded headband, matching circular earcups, slim brushed-aluminum hinges, and soft taupe fabric ear cushions with physically coherent construction. Photorealistic premium technology product photography, portrait 4:5, three-quarter view, entire headset visible and centered slightly low with ample negative space. Use a large diffused key light from upper left, a delicate rim highlight, and a soft controlled shadow below. Render matte polymer, brushed aluminum, fabric, and porous stone realistically. No person, hands, cable, case, text, labels, logos, trademarks, border, or watermark.",
      "negative_prompt": "broken headband, asymmetric earcups, impossible hinges, extra headphones, floating without shadow, plastic gloss, harsh HDR, people, hands, cables, text, logos, watermarks",
      "settings": {
        "quality": "high",
        "reference_guidance": "When attaching a real product reference, explicitly preserve headband curvature, earcup size, hinge placement, cushion material, and color.",
        "edit_instructions": "For launch variants, change only the colorway or pedestal material; preserve the product geometry, suspension height, camera angle, and softbox direction.",
        "output_requirements": "Portrait 4:5; exactly one coherent over-ear headset; entire product visible; no people, text, logos, or watermark."
      },
      "usage_notes": "Keep the construction and object-count sentences fixed. Change only one color or surface per iteration to retain coherent headset geometry."
    },
    {
      "title": "Travel Editorial — Desert Camp at Blue Hour",
      "description": "Luxury desert-camp photography balancing a cobalt twilight sky with warm lantern and firelight, natural textiles, and a secluded canvas pavilion.",
      "aspect_ratio": "4:5",
      "image_type": "Travel",
      "style_tags": ["travel", "desert", "glamping", "tent", "blue-hour", "hospitality", "editorial", "pickture-demo"],
      "usage_rights": "commercial",
      "price_cents": 1500,
      "consistency_score": 96,
      "full_prompt": "Use case: photorealistic-natural. Create a premium travel-editorial campaign image of a secluded desert glamping camp among soft sandstone dunes at the transition from sunset to blue hour, with distant mountains. Show exactly one elegant cream canvas pavilion tent with an open entrance, one low outdoor seating arrangement, one small lantern, restrained natural woven textiles, and one subtle fire bowl. Photorealistic luxury travel and hospitality photography, portrait 4:5, tent centered slightly low with a sweeping dune line leading toward it and generous twilight sky. Balance a cool cobalt sky with warm amber lantern and fire glow for a serene, intimate mood. Use sand, cream, terracotta, cobalt, and warm amber, with realistic canvas, woven wool, weathered wood, fine sand, and flame. No people, vehicles, extra tents, animals, text, signage, labels, logos, trademarks, border, or watermark.",
      "negative_prompt": "multiple tents, crowded campsite, people, vehicles, animals, fake fire, plastic fabric, oversaturation, harsh HDR, text, signs, logos, watermarks",
      "settings": {
        "quality": "high",
        "reference_guidance": "If using a location reference, preserve the horizon and mountain profile while applying the specified tent, textile, and blue-hour lighting design.",
        "edit_instructions": "For travel-series variants, change only the landscape or textile accent; preserve the single tent, seating layout, lantern, fire bowl, and cool-versus-warm lighting balance.",
        "output_requirements": "Portrait 4:5; exactly one cream pavilion tent; photorealistic blue hour; no people, vehicles, text, logos, or watermark."
      },
      "usage_notes": "Keep the object counts and blue-hour lighting relationship fixed. Swap one textile accent or landscape detail at a time for a consistent hospitality campaign."
    }
  ]
  $json$::jsonb;
BEGIN
  SELECT creator_id
    INTO v_creator_id
    FROM public.listings
   WHERE 'pickture-demo' = ANY(style_tags)
   ORDER BY created_at
   LIMIT 1;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'No existing Pickture demo creator was found';
  END IF;

  UPDATE public.listings
     SET model = 'nano-banana', model_version = 'latest'
   WHERE lower(model) IN ('nano-banana-2', 'nano-banana-pro', 'nano banana 2', 'nano banana pro');

  UPDATE public.custom_requests
     SET model_preference = 'nano-banana'
   WHERE lower(coalesce(model_preference, '')) IN
         ('nano-banana-2', 'nano-banana-pro', 'nano banana 2', 'nano banana pro');

  UPDATE public.listings
     SET consistency_score = CASE
       WHEN lower(model) IN ('gpt-image-2', 'chatgpt images 2')
         THEN 96 + mod(length(title), 3)
       WHEN lower(model) IN ('nano-banana', 'nano banana')
         THEN 91 + mod(length(title), 3)
       WHEN lower(model) IN ('midjourney-v7', 'midjourney v7')
         THEN 86 + mod(length(title), 3)
       ELSE consistency_score
     END;

  FOR v_spec IN SELECT * FROM jsonb_array_elements(v_specs)
  LOOP
    SELECT id INTO v_listing_id
      FROM public.listings
     WHERE creator_id = v_creator_id
       AND title = v_spec->>'title'
     LIMIT 1;

    IF v_listing_id IS NULL THEN
      INSERT INTO public.listings (
        creator_id, title, description, model, model_version, aspect_ratio,
        image_type, style_tags, usage_rights, price_cents,
        partial_prompt_preview, consistency_score, status
      ) VALUES (
        v_creator_id,
        v_spec->>'title',
        v_spec->>'description',
        'gpt-image-2',
        '2',
        v_spec->>'aspect_ratio',
        v_spec->>'image_type',
        ARRAY(SELECT jsonb_array_elements_text(v_spec->'style_tags')),
        (v_spec->>'usage_rights')::public.usage_rights,
        (v_spec->>'price_cents')::int,
        '',
        (v_spec->>'consistency_score')::int,
        'published'
      ) RETURNING id INTO v_listing_id;
    ELSE
      UPDATE public.listings
         SET description = v_spec->>'description',
             model = 'gpt-image-2',
             model_version = '2',
             aspect_ratio = v_spec->>'aspect_ratio',
             image_type = v_spec->>'image_type',
             style_tags = ARRAY(SELECT jsonb_array_elements_text(v_spec->'style_tags')),
             usage_rights = (v_spec->>'usage_rights')::public.usage_rights,
             price_cents = (v_spec->>'price_cents')::int,
             partial_prompt_preview = '',
             consistency_score = (v_spec->>'consistency_score')::int,
             status = 'published'
       WHERE id = v_listing_id;
    END IF;

    INSERT INTO public.recipe_secrets (
      listing_id, full_prompt, negative_prompt, settings, usage_notes
    ) VALUES (
      v_listing_id,
      v_spec->>'full_prompt',
      v_spec->>'negative_prompt',
      v_spec->'settings',
      v_spec->>'usage_notes'
    )
    ON CONFLICT (listing_id) DO UPDATE SET
      full_prompt = EXCLUDED.full_prompt,
      negative_prompt = EXCLUDED.negative_prompt,
      settings = EXCLUDED.settings,
      usage_notes = EXCLUDED.usage_notes;
  END LOOP;
END
$block$;