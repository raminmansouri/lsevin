-- ---------------------------------------------------------------------------
-- 0022_shop_seed_healthcare.sql
--
-- Production-safe, idempotent catalogue seed for the LSevin Shop, themed around
-- the platform's domain: تجهیزات پزشکی، سلامت و زیبایی
-- (medical equipment, health monitoring, first aid, personal care, beauty &
--  skincare, supplements).
--
-- Runs through `pnpm migrate` in every environment. Safe by construction:
--   * every row has a stable UUID / natural key and uses ON CONFLICT DO NOTHING
--     or WHERE NOT EXISTS, so re-running never duplicates and never clobbers an
--     edit made in the admin panel;
--   * it only *adds* rows — it does not delete or rewrite any existing catalogue;
--   * finance currencies / FX / rounding are NOT touched (Finance owns those);
--   * it no-ops cleanly if the shop schema is somehow not present yet.
--
-- Deterministic id prefixes (all valid hex):
--   brand      44444444-0000-4000-8000-0000000000b1 .. b5
--   category   44444444-0000-4000-8000-0000000000c1 .. c6
--   product    44444444-0000-4000-8000-00000000d001 .. d018
--   warehouse  44444444-0000-4000-8000-000000000001  (only if store has none)
-- ---------------------------------------------------------------------------
set search_path = public;

do $$
declare
  v_wh   uuid;
  p      record;
  v_pid  uuid;
begin
  if to_regclass('shop.products') is null then
    raise notice '0022: shop schema not present — skipping catalogue seed';
    return;
  end if;

  -- -------------------------------------------------------------------------
  -- Shop display-pricing default (only when Finance has no value yet)
  -- -------------------------------------------------------------------------
  if to_regclass('finance.settings') is not null then
    insert into finance.settings (key, value) values
      ('shop_pricing_mode',     jsonb_build_object('value', 'market_default_with_selector')),
      ('shop_default_currency', jsonb_build_object('value', 'USD'))
    on conflict (key) do nothing;
  end if;

  -- -------------------------------------------------------------------------
  -- A warehouse to hold stock (create one only if the store has none at all)
  -- -------------------------------------------------------------------------
  insert into shop.warehouses (id, name, code, country, city, address_line_1, is_active)
  select '44444444-0000-4000-8000-000000000001'::uuid, 'Main Warehouse', 'WH-MAIN', 'IR', 'Tehran', '-', true
  where not exists (select 1 from shop.warehouses);

  select id into v_wh from shop.warehouses where is_active order by create_date asc limit 1;
  if v_wh is null then
    select id into v_wh from shop.warehouses order by create_date asc limit 1;
  end if;

  -- -------------------------------------------------------------------------
  -- Brands
  -- -------------------------------------------------------------------------
  insert into shop.brands (id, name_translations, description_translations, slug, is_active) values
    ('44444444-0000-4000-8000-0000000000b1',
      '{"en":"MediTrust","fa":"مدی‌تراست","ar":"ميدي ترست"}'::jsonb,
      '{"en":"Clinical-grade home diagnostics","fa":"تجهیزات تشخیصی خانگی در تراز بالینی","ar":"أجهزة تشخيص منزلية بمعايير سريرية"}'::jsonb,
      'meditrust', true),
    ('44444444-0000-4000-8000-0000000000b2',
      '{"en":"VitaLife","fa":"ویتالایف","ar":"فيتا لايف"}'::jsonb,
      '{"en":"Everyday nutrition & supplements","fa":"مکمل و تغذیه روزمره","ar":"تغذية ومكملات يومية"}'::jsonb,
      'vitalife', true),
    ('44444444-0000-4000-8000-0000000000b3',
      '{"en":"DermaPure","fa":"درماپیور","ar":"ديرما بيور"}'::jsonb,
      '{"en":"Dermatologist-tested skincare","fa":"مراقبت پوست با تأیید متخصص","ar":"عناية بالبشرة مختبرة من أطباء الجلد"}'::jsonb,
      'dermapure', true),
    ('44444444-0000-4000-8000-0000000000b4',
      '{"en":"OrthoFlex","fa":"ارتوفلکس","ar":"أورثو فليكس"}'::jsonb,
      '{"en":"Orthopaedic supports & mobility","fa":"تجهیزات ارتوپدی و توانبخشی","ar":"دعامات العظام ومساعدات الحركة"}'::jsonb,
      'orthoflex', true),
    ('44444444-0000-4000-8000-0000000000b5',
      '{"en":"CarePoint","fa":"کیرپوینت","ar":"كير بوينت"}'::jsonb,
      '{"en":"First aid & everyday care","fa":"کمک‌های اولیه و مراقبت روزانه","ar":"إسعافات أولية ورعاية يومية"}'::jsonb,
      'carepoint', true)
  on conflict (id) do nothing;

  -- -------------------------------------------------------------------------
  -- Categories (top level)
  -- -------------------------------------------------------------------------
  insert into shop.categories (id, parent_id, name_translations, description_translations, slug, icon, gradient, is_active, display_order) values
    ('44444444-0000-4000-8000-0000000000c1', null,
      '{"en":"Medical equipment","fa":"تجهیزات پزشکی","ar":"معدات طبية"}'::jsonb, '{}'::jsonb,
      'medical-equipment', '🩺', 'from-emerald-500 to-teal-600', true, 1),
    ('44444444-0000-4000-8000-0000000000c2', null,
      '{"en":"Health monitoring","fa":"پایش سلامت","ar":"مراقبة الصحة"}'::jsonb, '{}'::jsonb,
      'health-monitoring', '📈', 'from-sky-500 to-blue-600', true, 2),
    ('44444444-0000-4000-8000-0000000000c3', null,
      '{"en":"First aid","fa":"کمک‌های اولیه","ar":"الإسعافات الأولية"}'::jsonb, '{}'::jsonb,
      'first-aid', '🚑', 'from-red-500 to-rose-600', true, 3),
    ('44444444-0000-4000-8000-0000000000c4', null,
      '{"en":"Personal care","fa":"مراقبت شخصی","ar":"العناية الشخصية"}'::jsonb, '{}'::jsonb,
      'personal-care', '🧴', 'from-violet-500 to-purple-600', true, 4),
    ('44444444-0000-4000-8000-0000000000c5', null,
      '{"en":"Beauty & skincare","fa":"زیبایی و مراقبت پوست","ar":"الجمال والعناية بالبشرة"}'::jsonb, '{}'::jsonb,
      'beauty-skincare', '✨', 'from-pink-500 to-rose-500', true, 5),
    ('44444444-0000-4000-8000-0000000000c6', null,
      '{"en":"Supplements & vitamins","fa":"مکمل و ویتامین","ar":"المكملات والفيتامينات"}'::jsonb, '{}'::jsonb,
      'supplements', '💊', 'from-amber-500 to-orange-600', true, 6)
  on conflict (id) do nothing;

  -- -------------------------------------------------------------------------
  -- Products
  -- -------------------------------------------------------------------------
  for p in
    select * from (values
      ('44444444-0000-4000-8000-00000000d001'::uuid, 'digital-blood-pressure-monitor',
        '{"en":"Digital Upper-Arm Blood Pressure Monitor","fa":"فشارسنج دیجیتال بازویی","ar":"جهاز قياس ضغط الدم الرقمي للعضد"}',
        '{"en":"Automatic, irregular-heartbeat alert, 2x120 memory, cuff 22-42 cm","fa":"تمام‌خودکار، هشدار ضربان نامنظم، حافظه ۲×۱۲۰، بازوبند ۲۲ تا ۴۲ سانتی‌متر","ar":"أوتوماتيكي، تنبيه لعدم انتظام ضربات القلب، ذاكرة ٢×١٢٠"}',
        24.90, 34.00, 'USD', '44444444-0000-4000-8000-0000000000b1', '44444444-0000-4000-8000-0000000000c2',
        true, true, false, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d002'::uuid, 'fingertip-pulse-oximeter',
        '{"en":"Fingertip Pulse Oximeter","fa":"پالس اکسیمتر انگشتی","ar":"مقياس التأكسج للإصبع"}',
        '{"en":"SpO2 and pulse rate in seconds, OLED display, auto power-off","fa":"اندازه‌گیری اکسیژن خون و ضربان در چند ثانیه، نمایشگر OLED","ar":"قياس الأكسجين والنبض خلال ثوانٍ، شاشة OLED"}',
        12.50, 19.00, 'USD', '44444444-0000-4000-8000-0000000000b1', '44444444-0000-4000-8000-0000000000c2',
        true, true, false, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d003'::uuid, 'infrared-forehead-thermometer',
        '{"en":"Infrared Forehead Thermometer","fa":"تب‌سنج مادون‌قرمز پیشانی","ar":"ميزان حرارة الجبهة بالأشعة تحت الحمراء"}',
        '{"en":"Non-contact, 1-second reading, fever alarm, body/surface modes","fa":"بدون تماس، قرائت یک‌ثانیه‌ای، هشدار تب، حالت بدن و سطح","ar":"بدون تلامس، قراءة خلال ثانية، إنذار حمى"}',
        15.90, 25.00, 'USD', '44444444-0000-4000-8000-0000000000b1', '44444444-0000-4000-8000-0000000000c2',
        false, true, false, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d004'::uuid, 'blood-glucose-meter-kit',
        '{"en":"Blood Glucose Meter Starter Kit","fa":"کیت دستگاه قند خون همراه","ar":"طقم بادئ لجهاز قياس السكر في الدم"}',
        '{"en":"Meter, lancing device, 25 strips and 25 lancets, 5-second result","fa":"دستگاه، قلم لانست، ۲۵ نوار و ۲۵ سوزن، نتیجه ۵ ثانیه‌ای","ar":"جهاز، قلم وخز، ٢٥ شريطاً و٢٥ إبرة"}',
        19.99, 29.90, 'USD', '44444444-0000-4000-8000-0000000000b1', '44444444-0000-4000-8000-0000000000c2',
        false, false, true, 'https://images.unsplash.com/photo-1631563019676-dade0dbdb8f6?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d005'::uuid, 'portable-mesh-nebulizer',
        '{"en":"Portable Mesh Nebulizer","fa":"نبولایزر مش قابل حمل","ar":"جهاز الاستنشاق المحمول بتقنية الميش"}',
        '{"en":"Silent mesh tech, USB-C rechargeable, adult and child masks","fa":"فناوری مش کم‌صدا، شارژ USB-C، ماسک بزرگسال و کودک","ar":"تقنية ميش صامتة، شحن USB-C، أقنعة للكبار والأطفال"}',
        29.50, 44.00, 'USD', '44444444-0000-4000-8000-0000000000b1', '44444444-0000-4000-8000-0000000000c1',
        true, false, true, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d006'::uuid, 'flexible-tip-digital-thermometer',
        '{"en":"Flexible-Tip Digital Thermometer","fa":"دماسنج دیجیتال نوک انعطاف‌پذیر","ar":"ميزان حرارة رقمي بطرف مرن"}',
        '{"en":"10-second oral/underarm reading, waterproof, fever beep","fa":"قرائت ۱۰ ثانیه‌ای دهانی/زیربغل، ضدآب، بوق هشدار تب","ar":"قراءة خلال ١٠ ثوانٍ، مقاوم للماء"}',
        3.90, 6.50, 'USD', '44444444-0000-4000-8000-0000000000b5', '44444444-0000-4000-8000-0000000000c1',
        false, true, false, 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d007'::uuid, 'home-first-aid-kit-90',
        '{"en":"Home First Aid Kit (90 pieces)","fa":"کیف کمک‌های اولیه خانگی (۹۰ تکه)","ar":"حقيبة إسعافات أولية منزلية (٩٠ قطعة)"}',
        '{"en":"Compact zip case: plasters, gauze, tape, scissors, gloves, foil blanket","fa":"کیف جمع‌وجور: چسب زخم، گاز، باند، قیچی، دستکش، پتوی نجات","ar":"حقيبة مدمجة: لصقات، شاش، شريط، مقص، قفازات"}',
        16.90, 24.00, 'USD', '44444444-0000-4000-8000-0000000000b5', '44444444-0000-4000-8000-0000000000c3',
        true, true, false, 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d008'::uuid, 'n95-respirator-mask-20pk',
        '{"en":"N95 Respirator Masks (20 pack)","fa":"ماسک تنفسی N95 (بسته ۲۰ عددی)","ar":"أقنعة N95 التنفسية (عبوة ٢٠)"}',
        '{"en":"5-layer filtration, adjustable nose clip, individually wrapped","fa":"فیلتراسیون ۵ لایه، گیره بینی قابل تنظیم، بسته‌بندی تکی","ar":"ترشيح ٥ طبقات، مشبك أنف قابل للتعديل"}',
        13.00, 20.00, 'USD', '44444444-0000-4000-8000-0000000000b5', '44444444-0000-4000-8000-0000000000c3',
        false, true, false, 'https://images.unsplash.com/photo-1605845328644-9db0d4f5e5a3?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d009'::uuid, 'elastic-knee-support-brace',
        '{"en":"Elastic Knee Support Brace","fa":"زانوبند طبی کشی","ar":"دعامة الركبة المرنة"}',
        '{"en":"Breathable knit, silicone patella ring, side stays, unisex","fa":"بافت تنفس‌پذیر، حلقه سیلیکونی کشکک، تیرک‌های کناری، یونیسکس","ar":"نسيج مسامي، حلقة سيليكون للرضفة، دعامات جانبية"}',
        8.90, 14.00, 'USD', '44444444-0000-4000-8000-0000000000b4', '44444444-0000-4000-8000-0000000000c1',
        true, false, false, 'https://images.unsplash.com/photo-1620065692460-a2f7a1f9a0f0?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d010'::uuid, 'adjustable-folding-walking-cane',
        '{"en":"Adjustable Folding Walking Cane","fa":"عصای طبی تاشو قابل تنظیم","ar":"عصا مشي قابلة للطي والتعديل"}',
        '{"en":"Aluminium, 10 height settings, pivoting non-slip base, wrist strap","fa":"آلومینیومی، ۱۰ تنظیم ارتفاع، پایه ضدلغزش گردان، بند مچ","ar":"ألمنيوم، ١٠ إعدادات ارتفاع، قاعدة دوارة"}',
        17.50, 27.00, 'USD', '44444444-0000-4000-8000-0000000000b4', '44444444-0000-4000-8000-0000000000c1',
        false, false, true, 'https://images.unsplash.com/photo-1576765607924-3f7b8410a787?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d011'::uuid, 'lumbar-support-cushion',
        '{"en":"Memory-Foam Lumbar Support Cushion","fa":"پشتی طبی لومبار فوم مموری","ar":"وسادة دعم أسفل الظهر بإسفنج الذاكرة"}',
        '{"en":"Ergonomic back support for office chair or car, breathable mesh cover","fa":"تکیه‌گاه ارگونومیک کمر برای صندلی اداری یا خودرو، روکش مش","ar":"دعم ظهر مريح لكرسي المكتب أو السيارة"}',
        21.00, 32.00, 'USD', '44444444-0000-4000-8000-0000000000b4', '44444444-0000-4000-8000-0000000000c4',
        false, true, false, 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d012'::uuid, 'alcohol-hand-sanitizer-500ml',
        '{"en":"Alcohol Hand Sanitizer Gel 500 ml","fa":"ژل ضدعفونی‌کننده دست ۵۰۰ میلی‌لیتر","ar":"جل معقم لليدين بالكحول ٥٠٠ مل"}',
        '{"en":"70% ethanol, glycerin-enriched, pump top, kills 99.9% of germs","fa":"اتانول ۷۰٪، غنی از گلیسیرین، درپوش پمپی، حذف ۹۹.۹٪ میکروب","ar":"إيثانول ٧٠٪، غني بالجليسرين، يقضي على ٩٩.٩٪ من الجراثيم"}',
        4.50, 7.00, 'USD', '44444444-0000-4000-8000-0000000000b3', '44444444-0000-4000-8000-0000000000c4',
        false, true, false, 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d013'::uuid, 'sonic-electric-toothbrush',
        '{"en":"Sonic Electric Toothbrush","fa":"مسواک برقی سونیک","ar":"فرشاة أسنان كهربائية سونيك"}',
        '{"en":"5 modes, 40k strokes/min, 30-day battery, 2-minute smart timer","fa":"۵ حالت، ۴۰ هزار حرکت در دقیقه، باتری ۳۰ روزه، تایمر هوشمند ۲ دقیقه","ar":"٥ أوضاع، ٤٠ ألف حركة/د، بطارية ٣٠ يوماً"}',
        18.90, 29.00, 'USD', '44444444-0000-4000-8000-0000000000b3', '44444444-0000-4000-8000-0000000000c4',
        true, false, true, 'https://images.unsplash.com/photo-1559591937-abc3e5b3f0e5?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d014'::uuid, 'hyaluronic-acid-serum',
        '{"en":"Hyaluronic Acid Hydrating Serum 30 ml","fa":"سرم آبرسان هیالورونیک اسید ۳۰ میلی‌لیتر","ar":"سيروم مرطب بحمض الهيالورونيك ٣٠ مل"}',
        '{"en":"Multi-weight HA + vitamin B5, fragrance-free, dermatologist-tested","fa":"هیالورونیک چندوزنی + ویتامین B5، بدون عطر، تأیید متخصص پوست","ar":"حمض هيالورونيك متعدد الأوزان + فيتامين B5، خالٍ من العطور"}',
        11.90, 18.00, 'USD', '44444444-0000-4000-8000-0000000000b3', '44444444-0000-4000-8000-0000000000c5',
        true, true, false, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d015'::uuid, 'spf50-mineral-sunscreen',
        '{"en":"SPF 50 Mineral Sunscreen 50 ml","fa":"ضدآفتاب مینرال SPF 50 حجم ۵۰ میلی‌لیتر","ar":"واقٍ شمسي معدني SPF 50 بحجم ٥٠ مل"}',
        '{"en":"Zinc-oxide broad spectrum, no white cast, reef-safe, water-resistant 80 min","fa":"اکسید روی با طیف گسترده، بدون رد سفید، ضدآب ۸۰ دقیقه","ar":"أكسيد الزنك واسع الطيف، مقاوم للماء ٨٠ دقيقة"}',
        13.50, 20.00, 'USD', '44444444-0000-4000-8000-0000000000b3', '44444444-0000-4000-8000-0000000000c5',
        false, true, false, 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d016'::uuid, 'vitamin-d3-k2-drops',
        '{"en":"Vitamin D3 + K2 Drops 30 ml","fa":"قطره ویتامین D3 + K2 حجم ۳۰ میلی‌لیتر","ar":"قطرات فيتامين D3 + K2 بحجم ٣٠ مل"}',
        '{"en":"1000 IU D3 with MK-7 K2 per drop, MCT-oil base, ~300 servings","fa":"۱۰۰۰ واحد D3 همراه K2 نوع MK-7 در هر قطره، پایه روغن MCT، حدود ۳۰۰ سروینگ","ar":"١٠٠٠ وحدة D3 مع K2 لكل قطرة، أساس زيت MCT"}',
        9.90, 15.00, 'USD', '44444444-0000-4000-8000-0000000000b2', '44444444-0000-4000-8000-0000000000c6',
        true, true, false, 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d017'::uuid, 'omega-3-fish-oil-softgels',
        '{"en":"Omega-3 Fish Oil Softgels (120)","fa":"کپسول نرم امگا-۳ روغن ماهی (۱۲۰ عددی)","ar":"كبسولات زيت السمك أوميغا-٣ (١٢٠)"}',
        '{"en":"1000 mg per softgel, 660 mg EPA/DHA, molecularly distilled, lemon coat","fa":"۱۰۰۰ میلی‌گرم در هر کپسول، ۶۶۰ میلی‌گرم EPA/DHA، تقطیر مولکولی","ar":"١٠٠٠ ملغ لكل كبسولة، ٦٦٠ ملغ EPA/DHA"}',
        14.90, 22.00, 'USD', '44444444-0000-4000-8000-0000000000b2', '44444444-0000-4000-8000-0000000000c6',
        false, false, true, 'https://images.unsplash.com/photo-1607619662634-3ac55ada4a20?w=600&q=80'),
      ('44444444-0000-4000-8000-00000000d018'::uuid, 'led-facial-cleansing-brush',
        '{"en":"Silicone LED Facial Cleansing Brush","fa":"برس پاک‌کننده صورت سیلیکونی LED","ar":"فرشاة تنظيف الوجه بالسيليكون LED"}',
        '{"en":"Sonic pulses + red-light mode, IPX7, USB-C, 3-week charge","fa":"پالس سونیک + حالت نور قرمز، IPX7، شارژ USB-C، شارژ ۳ هفته‌ای","ar":"نبضات سونيك + وضع الضوء الأحمر، IPX7"}',
        16.50, 26.00, 'USD', '44444444-0000-4000-8000-0000000000b3', '44444444-0000-4000-8000-0000000000c5',
        false, false, true, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80')
    ) as t(id, slug, name_t, short_t, price, compare, cur, brand_id, cat_id, feat, best, new_a, img)
  loop
    insert into shop.products
      (id, product_type, status, brand_id, primary_category_id, name_translations, short_description_translations,
       description_translations, slug, base_currency, base_price, compare_at_price, tax_class, requires_shipping,
       is_featured, is_best_seller, is_new_arrival, fulfillment_type, published_at)
    values
      (p.id, 'simple', 'active', p.brand_id::uuid, p.cat_id::uuid, p.name_t::jsonb, p.short_t::jsonb,
       p.short_t::jsonb, p.slug, p.cur, p.price, p.compare, 'standard', true,
       p.feat, p.best, p.new_a, 'delivery', now())
    on conflict (id) do nothing;

    v_pid := p.id;

    insert into shop.product_categories (product_id, category_id, is_primary)
    values (v_pid, p.cat_id::uuid, true)
    on conflict do nothing;

    insert into shop.product_media (id, product_id, url, media_type, alt_translations, display_order, is_primary)
    values (gen_random_uuid(), v_pid, p.img, 'image', p.name_t::jsonb, 0, true)
    on conflict do nothing;

    if v_wh is not null then
      insert into shop.inventory (id, product_id, variant_id, warehouse_id, on_hand, reserved, reorder_threshold, safety_stock)
      values (gen_random_uuid(), v_pid, null, v_wh, 150, 0, 15, 5)
      on conflict do nothing;
    end if;
  end loop;

  -- refresh full-text vectors for search (SHP-V01-005)
  update shop.products
  set search_vector =
    setweight(to_tsvector('simple', coalesce(name_translations->>'en','')), 'A') ||
    setweight(to_tsvector('simple', coalesce(short_description_translations->>'en','')), 'B')
  where search_vector is null;

  -- -------------------------------------------------------------------------
  -- Data-driven home composition
  -- -------------------------------------------------------------------------
  if to_regclass('shop.home_sections') is not null then
    insert into shop.home_sections (key, section_type, title_translations, subtitle_translations, query_source, query_config, display_order, is_active) values
      ('hc_shortcuts', 'shortcut_rail', '{}'::jsonb, '{}'::jsonb, 'manual', '{}'::jsonb, 10, true),
      ('hc_promos', 'promo_cards', '{}'::jsonb, '{}'::jsonb, 'manual', '{}'::jsonb, 20, true),
      ('hc_featured', 'product_rail',
        '{"en":"Featured in health","fa":"منتخب سلامت","ar":"مختارات الصحة"}'::jsonb,
        '{"en":"Curated by our pharmacists","fa":"انتخاب داروسازان ما","ar":"اختارها صيادلتنا"}'::jsonb,
        'featured', '{}'::jsonb, 30, true),
      ('hc_best_sellers', 'product_rail',
        '{"en":"Best sellers","fa":"پرفروش‌ها","ar":"الأكثر مبيعاً"}'::jsonb, '{}'::jsonb,
        'best_seller', '{}'::jsonb, 40, true),
      ('hc_new_arrivals', 'product_rail',
        '{"en":"New arrivals","fa":"جدیدترین‌ها","ar":"وصل حديثاً"}'::jsonb, '{}'::jsonb,
        'new_arrival', '{}'::jsonb, 50, true),
      ('hc_deals', 'product_rail',
        '{"en":"Deals","fa":"تخفیف‌ها","ar":"عروض"}'::jsonb, '{}'::jsonb,
        'discounted', '{}'::jsonb, 60, true)
    on conflict (key) do nothing;

    -- shortcut rail -> the healthcare categories
    insert into shop.home_section_items (section_id, category_id, label_translations, display_order, is_active)
    select s.id, c.id, c.name_translations, c.display_order, true
    from shop.home_sections s
    join shop.categories c on c.slug in
      ('medical-equipment','health-monitoring','first-aid','personal-care','beauty-skincare','supplements')
    where s.key = 'hc_shortcuts'
    on conflict do nothing;

    -- promo cards
    insert into shop.home_section_items (section_id, label_translations, image_url, link_url, badge_translations, display_order, is_active)
    select s.id, v.label::jsonb, v.img, v.link, v.badge::jsonb, v.ord, true
    from shop.home_sections s
    cross join (values
      ('{"en":"Home diagnostics","fa":"تشخیص در خانه","ar":"تشخيص منزلي"}',
       'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
       '/n/app/mobile/shop/category/health-monitoring',
       '{"en":"Up to 30% off","fa":"تا ۳۰٪ تخفیف","ar":"خصم حتى 30%"}', 1),
      ('{"en":"Skincare picks","fa":"منتخب مراقبت پوست","ar":"مختارات العناية بالبشرة"}',
       'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
       '/n/app/mobile/shop/category/beauty-skincare',
       '{"en":"New in","fa":"تازه رسیده","ar":"جديد"}', 2)
    ) as v(label, img, link, badge, ord)
    where s.key = 'hc_promos'
    on conflict do nothing;
  end if;

  -- -------------------------------------------------------------------------
  -- Storefront coupons
  -- -------------------------------------------------------------------------
  if to_regclass('shop.coupons') is not null then
    insert into shop.coupons (code, coupon_type, value, currency, is_active, min_subtotal, scope, title_translations) values
      ('HEALTH10', 'percentage', 10, null, true, 15, 'cart',
        '{"en":"10% off your first health order","fa":"۱۰٪ تخفیف اولین سفارش سلامت","ar":"خصم 10% على أول طلب صحي"}'::jsonb),
      ('CARE5', 'fixed', 5, 'USD', true, 30, 'cart',
        '{"en":"$5 off orders over $30","fa":"۵ دلار تخفیف بالای ۳۰ دلار","ar":"خصم 5$ للطلبات فوق 30$"}'::jsonb),
      ('FREESHIP50', 'free_shipping', 0, null, true, 50, 'shipping',
        '{"en":"Free shipping over $50","fa":"ارسال رایگان بالای ۵۰ دلار","ar":"شحن مجاني فوق 50$"}'::jsonb)
    on conflict (code) do nothing;
  end if;

  raise notice '0022: healthcare catalogue seed applied (warehouse=%).', v_wh;
end $$;
