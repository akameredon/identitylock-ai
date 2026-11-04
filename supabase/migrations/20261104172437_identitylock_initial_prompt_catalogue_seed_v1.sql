-- Idempotent initial IdentityLock prompt catalogue seed. Existing versions are never overwritten.
DO $seed$
DECLARE
 v_common text := 'ROLE AND OBJECTIVE

You are a professional identity-preserving photo editor and wardrobe transformation specialist. Edit the supplied reference photograph into the requested attire look below. This is an edit of the original person or people, not a request to generate new people who merely resemble them.

IDENTITY PRESERVATION IS THE HIGHEST PRIORITY.

Use the supplied photograph as the identity source. Preserve the subject''s exact facial geometry and recognizable facial features, complexion and skin texture, apparent age, natural expression, eyes, nose, lips, jawline, cheeks, ears, hairline, hairstyle, hair texture, colour, length and volume. Preserve the head, neck, shoulders, body shape, build, proportions, limbs, hands, pose, posture and stance.

FACE LOCK: Do not reconstruct, beautify, reinterpret, replace, reshape, smooth, rejuvenate or otherwise modify the face. Do not change the eyes, nose, lips, jaw, cheeks, forehead, ears, smile, expression or skin tone. Do not create a lookalike.

BODY LOCK: Do not slim, enlarge, reduce, reshape, lengthen, shorten or alter any body part. Preserve the original build, proportions, shoulders, waist, hips, arms, legs, hands, posture and natural anatomy.

HAIR LOCK: Preserve the original hairline, hairstyle, texture, colour, length and volume. Do not cut, grow, recolour, straighten, curl, restyle or replace the hair. If the attire direction includes headwear, place it naturally without changing the hair underneath.

AUTHORIZED CHANGES ONLY: Change the garments and the specifically requested wardrobe accessories, footwear, jewellery, headwear or bag. Do not alter makeup, facial hair, body shape, hair, background or other scene details unless the user separately authorizes that exact change.

ATTIRE DIRECTION

{{ATTIRE_DIRECTION}}

FIT, MATERIAL AND REALISM: Fit every garment naturally to the person''s existing body. Respect the original body proportions; tailor the clothing to the body rather than reshaping the body to fit the clothing. Render believable fabric weight, weave, embroidery, seams, folds, draping, beadwork, stitching and natural shadows. Accessories must sit in physically plausible positions and must not obscure or distort facial features.

COMPOSITION LOCK: Preserve the original camera angle, crop, framing, perspective, subject placement, pose, background, environment, lighting direction and overall photographic character. Do not add people, remove people, change the location or invent unrelated props. When multiple people appear, preserve each person''s identity separately and apply attire only to the role specified by the user or clearly identified in the reference. Never swap, merge or reassign identities.

NEGATIVE INSTRUCTIONS: No face swap, no new face, no identity reinterpretation, no facial reconstruction, no beauty filter, no skin-tone change, no age change, no body reshaping, no slimming, no limb alteration, no hairstyle change, no hairline change, no extra fingers, no missing fingers, no distorted hands, no extra people, no missing people, no background replacement, no watermark, no text or logo.

FINAL VALIDATION: Compare the edited result with the original reference. Confirm that every person''s face, body, hair, expression, pose and identity remain faithful. If the requested wardrobe change causes identity drift, reduce the styling change and preserve the original person.

FINAL PRIORITY: IDENTITY FIRST. BODY SECOND. AUTHORIZED STYLING THIRD. AESTHETIC ENHANCEMENT LAST.';
 v_category_id uuid;
 v_prompt_id uuid;
 v_version_id uuid;
 v_has_version boolean;
 rec record;
BEGIN
 INSERT INTO public.identitylock_prompt_categories (slug,name,description,sort_order,is_active)
 VALUES
 ('traditional-cultural','Traditional & Cultural','Nigerian traditional wedding and cultural attire transformations',10,true),
('professional-corporate','Professional & Corporate','Executive, business and professional wardrobe transformations',20,true),
('celebrations-milestones','Celebrations & Milestones','Graduation, birthday and special milestone styling',30,true),
('weddings-formal','Weddings & Formal Occasions','Bridal, groom and wedding guest wardrobe looks',40,true),
('luxury-evening','Luxury & Evening','Elegant dinner, gala and premium evening attire',50,true)
 ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,sort_order=EXCLUDED.sort_order,is_active=true;
 FOR rec IN
  SELECT * FROM (VALUES
  ('igbo-traditional-wedding-look','Igbo Traditional Wedding Look','Igbo wedding styling with George wrapper, lace, coral beads and Isi Agu details','traditional-cultural',10,ARRAY['igbo','traditional','wedding']::text[],'For a bride, style a refined George wrapper and matching blouse with elegant lace or embroidered fabric, coordinated coral beads, a traditional bridal head adornment and a tasteful clutch. For a groom, use a well-fitted Isi Agu top with traditional trousers or wrapper, a red cap, coordinated coral beads and appropriate traditional footwear; a horsetail whisk may be included only when it suits the reference and requested styling. Apply bride or groom details only to the person identified in the reference or by the user. Keep every face, body and hairstyle unchanged.'),
('yoruba-traditional-wedding-look','Yoruba Traditional Wedding Look','Yoruba wedding attire with aso-oke, iro and buba, gele and agbada styling','traditional-cultural',20,ARRAY['yoruba','aso-oke','wedding']::text[],'For a bride, create an elegant iro and buba or coordinated aso-oke ensemble with a beautifully draped ipele, a structured gele and refined traditional jewellery. For a groom, use a richly textured agbada or coordinated buba and sokoto with a fila and tasteful beads or ipele. Use culturally coherent colours and fabrics with realistic embroidery and draping. Do not change the subject''s hair, face, body, expression or pose; place the gele or fila as wardrobe headwear without restyling the hair.'),
('hausa-traditional-attire','Hausa Traditional Attire','Elegant Hausa-inspired babban riga, kaftan, wrapper and headwear options','traditional-cultural',30,ARRAY['hausa','traditional','kaftan']::text[],'For a man, style a beautifully embroidered babban riga over a coordinated kaftan or traditional outfit, with a suitable hula and refined footwear. For a woman, use an elegant modest traditional ensemble with coordinated fabric, refined embroidery and an appropriate headscarf or head covering only as a wardrobe accessory. Keep styling respectful, polished and coherent; do not assume or change the subject''s identity, gender or cultural background. Preserve the original hair beneath any added headwear.'),
('efik-ibibio-traditional-look','Efik / Ibibio Traditional Look','Efik and Ibibio-inspired ceremonial wrappers, beadwork and accessories','traditional-cultural',40,ARRAY['efik','ibibio','ceremonial']::text[],'Create an elegant Efik or Ibibio-inspired ceremonial wardrobe using a beautifully coordinated wrapper and blouse or traditional men''s attire, with tasteful coral or traditional bead accessories and a refined head adornment where appropriate. Keep the styling balanced and respectful, with realistic fabric folds and bead placement. Apply the requested attire only; do not invent a new identity or alter the person''s face, body, hair, expression or posture.'),
('traditional-ceremonial-attire','Traditional Ceremonial Attire','A refined Nigerian traditional ceremonial outfit with embroidery and accessories','traditional-cultural',50,ARRAY['nigerian','traditional','ceremony']::text[],'Create a dignified Nigerian traditional ceremonial look using a well-tailored embroidered robe, agbada, kaftan, wrapper or coordinated traditional garments appropriate to the user''s requested style. Add restrained traditional jewellery, footwear and headwear only where suitable. Do not assign a specific ethnic identity when the user has not named one; keep the design broadly ceremonial and culturally respectful. Preserve the original person''s identity and all physical features.'),
('nigerian-corporate-executive','Nigerian Corporate Executive','Premium executive suit, formal shirt or blouse, shoes and restrained accessories','professional-corporate',10,ARRAY['corporate','executive','nigeria']::text[],'Dress the subject in a premium Nigerian corporate executive outfit: a sharply tailored dark or neutral business suit, a crisp shirt or refined blouse, a coordinated tie or modest neck accessory where appropriate, polished formal shoes and a restrained watch or professional accessory. Keep the fit natural to the existing body. The result should look confident and boardroom-ready without changing facial expression, posture, hairstyle or body proportions.'),
('modern-corporate-professional','Modern Corporate Professional','Contemporary smart business attire with blazer and tailored separates','professional-corporate',20,ARRAY['corporate','modern','professional']::text[],'Create a contemporary professional wardrobe using a well-fitted blazer with tailored trousers, a skirt or smart separates, a clean shirt or blouse and polished shoes. Use understated colours and minimal accessories for a modern workplace appearance. Keep the person''s original pose, hair, face, body and expression exactly as in the reference. Tailor the clothing to the existing body rather than altering the body.'),
('executive-headshot-styling','Executive Headshot Styling','Polished leadership portrait wardrobe with blazer and collared shirt','professional-corporate',30,ARRAY['headshot','leadership','business']::text[],'Upgrade only the wardrobe for a polished executive headshot: a premium blazer or suit jacket, a clean collared shirt or refined blouse and understated professional accessories. Use a coordinated, timeless colour palette and realistic fabric texture. Preserve the original crop, camera angle, background, lighting, facial expression, hair and body exactly. Do not generate a different headshot or reconstruct the face.'),
('graduation-portrait-look','Graduation Portrait Look','Academic gown, cap, stole and graduation accessories','celebrations-milestones',10,ARRAY['graduation','academic','milestone']::text[],'Style the subject for a graduation portrait with a realistic academic gown, correctly fitted graduation cap, a tasteful stole or sash and appropriate formal footwear. Add only the academic accessories requested or suitable to the existing composition. Keep the original face, hair, body, pose and background unchanged. Do not invent a school crest, qualification, award or written text.'),
('birthday-photoshoot-look','Birthday Photoshoot Look','Elegant birthday outfit with celebratory polish and accessories','celebrations-milestones',20,ARRAY['birthday','celebration','photoshoot']::text[],'Create an elegant birthday photoshoot outfit suited to the subject and the original pose: a refined celebratory dress, coordinated set or tailored suit with tasteful accessories and footwear. Use a premium, camera-ready finish without adding decorations, balloons, numbers, signs or changing the background unless separately requested. Preserve the person''s identity, face, body proportions, hair, expression and pose.'),
('luxury-dinner-look','Luxury Dinner Look','Sophisticated eveningwear with premium fabrics and restrained accessories','luxury-evening',10,ARRAY['luxury','dinner','evening']::text[],'Transform only the wardrobe into a sophisticated luxury dinner look: an elegant evening dress or refined tailored suit, premium fabric, tasteful jewellery or a watch, a coordinated bag and polished footwear. Keep the styling upscale but natural to the subject and setting. Do not add a restaurant, table, food, lighting effects or props; preserve the original environment and all physical identity details.'),
('church-wedding-guest-look','Church Wedding Guest Look','Modest, refined wedding guest attire with formal accessories','weddings-formal',10,ARRAY['church','wedding','guest']::text[],'Style the subject as a well-dressed church wedding guest in modest, refined formal attire: a tasteful dress or tailored suit, coordinated shoes and restrained accessories. A hat or fascinator may be added only if appropriate to the requested look. Do not dress the subject as the bride or groom unless explicitly requested. Preserve the original face, body, hair, expression, pose and background.'),
('bridal-wedding-look','Bridal Wedding Look','Elegant bridal gown, veil and accessories while preserving the original person','weddings-formal',20,ARRAY['bridal','wedding','gown']::text[],'If the subject is identified as the bride, style the outfit as an elegant wedding gown with realistic fabric, refined lace or embroidery, a tasteful veil and coordinated bridal shoes and jewellery. Place the veil naturally without changing the original hairline, hairstyle or hair. If the subject is not identified as the bride, do not impose bridal styling; ask the user to specify the intended role. Preserve the face, body, expression and pose.'),
('groom-wedding-look','Groom Wedding Look','Formal groom suit or tuxedo with coordinated shoes and accessories','weddings-formal',30,ARRAY['groom','wedding','suit']::text[],'If the subject is identified as the groom, style a premium groom outfit such as a well-tailored suit or tuxedo with a crisp shirt, coordinated tie or bow tie, polished shoes and a subtle boutonniere or pocket detail. A culturally specific groom outfit may be used only when requested. Do not change the subject''s gender, face, hair, body, expression or pose. If the role is unclear, do not assume it.'),
('elegant-wedding-guest-look','Elegant Wedding Guest Look','Premium formal guest outfit without bridal or groom styling','weddings-formal',40,ARRAY['wedding','formal','guest']::text[],'Create an elegant wedding guest wardrobe: a sophisticated formal dress, coordinated two-piece or tailored suit with tasteful shoes, jewellery and a small clutch or professional accessory. Keep the outfit appropriate for a guest rather than a bride or groom. Use refined colour and fabric choices while preserving the person''s identity, body proportions, hairstyle, expression and original scene.'),
('evening-gala-look','Evening Gala Look','Black-tie eveningwear with refined formal accessories','luxury-evening',20,ARRAY['gala','black-tie','evening']::text[],'Dress the subject for a black-tie gala in a refined evening gown, formal tuxedo or elegant tailored suit appropriate to the person and the user''s instructions. Add restrained jewellery, a clutch or formal shoes where suitable. Keep the result sophisticated and realistic, with natural fabric folds and no exaggerated body shaping. Preserve the original face, hair, body, pose, background and lighting.')
  ) AS seed(slug,title,short_description,category_slug,sort_order,tags,attire_direction)
 LOOP
  SELECT id INTO v_category_id FROM public.identitylock_prompt_categories WHERE slug=rec.category_slug;
  INSERT INTO public.identitylock_prompts (slug,title,short_description,category_id,status,sort_order,tags)
  VALUES (rec.slug,rec.title,rec.short_description,v_category_id,'draft',rec.sort_order,rec.tags)
  ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO v_prompt_id FROM public.identitylock_prompts WHERE slug=rec.slug;
  SELECT id INTO v_version_id FROM public.identitylock_prompt_versions WHERE prompt_id=v_prompt_id AND version_number=1;
  v_has_version := v_version_id IS NOT NULL;
  IF NOT v_has_version THEN
   INSERT INTO public.identitylock_prompt_versions (prompt_id,version_number,prompt_text,change_note)
   VALUES (v_prompt_id,1,replace(v_common,'{{ATTIRE_DIRECTION}}',rec.attire_direction),'Initial productized attire variant using IdentityLock identity-first rules')
   RETURNING id INTO v_version_id;
  END IF;
  UPDATE public.identitylock_prompts
   SET current_version_id=COALESCE(current_version_id,v_version_id),
       status=CASE WHEN v_has_version THEN status ELSE 'published' END,
       updated_at=now()
   WHERE id=v_prompt_id;
 END LOOP;
END;
$seed$;