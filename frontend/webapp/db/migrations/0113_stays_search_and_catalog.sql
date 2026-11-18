-- ---------------------------------------------------------------------------
-- 0113 — Stays: location-aware search, richer amenities, real catalog.
--
--   1. stay.distance_m(): great-circle distance used by search ("within 1 km
--      of the shrine", "5 minutes' walk", "near my clinic").
--   2. stay.landmarks: per-city points customers search by (shrines, bazaars,
--      airports, stations, hospitals). Coordinates come from OpenStreetMap
--      (Nominatim) and were checked against the known sites.
--   3. More amenities, matching what Iranian hotels actually list
--      (porter, currency exchange, rooftop restaurant, shrine-view rooms...).
--   4. City pages for Mashhad, Tabriz and Qom: cover photo (licensed, credit
--      shown on the page) and a practical introduction — only where an admin
--      has not already written one.
--   5. stay.import_provider(): turns an existing Lsevin accommodation provider
--      (category.service_providers + its nightly services, photos and
--      attributes) into a stay property. Used by the admin "import" action and
--      below to publish the Mashhad and Tabriz hotels already on Lsevin as
--      request-to-book stays (the hotel confirms every request, so no
--      availability is promised that the hotel has not confirmed).
--
-- Writes only to schema `stay` (not replicated between sites); nothing in
-- `category` is modified. The booking anchor (category.provider_services) is
-- created lazily at the first booking, exactly as for admin-created stays.
-- Re-runnable: every insert is guarded.
-- ---------------------------------------------------------------------------

-- 1. Distance -------------------------------------------------------------------

create or replace function stay.distance_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision
language sql
immutable
parallel safe
as $$
  select 2 * 6371008.8 * asin(least(1, sqrt(
           power(sin(radians(lat2 - lat1) / 2), 2)
           + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2))))
$$;

-- 2. Landmarks -------------------------------------------------------------------

create table if not exists stay.landmarks (
  id          uuid primary key default gen_random_uuid(),
  city_id     uuid not null references stay.cities(id) on delete cascade,
  slug        text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,60}$'),
  kind        text not null check (kind in ('shrine','attraction','park','shopping','airport','station','hospital','clinic','beach','university','other')),
  name        jsonb not null check (jsonb_typeof(name) = 'object' and name <> '{}'::jsonb),
  latitude    numeric(10,7) not null check (latitude between -90 and 90),
  longitude   numeric(10,7) not null check (longitude between -180 and 180),
  -- Offered as a one-tap "near ..." choice in search for this city.
  is_quick    boolean not null default false,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (city_id, slug)
);
create index if not exists ix_stay_landmarks_city on stay.landmarks (city_id, is_active, sort_order);

insert into stay.landmarks (city_id, slug, kind, name, latitude, longitude, is_quick, sort_order)
select c.id, v.slug, v.kind, v.name::jsonb, v.lat, v.lng, v.quick, v.ord
  from (values
    ('mashhad', 'haram',              'shrine',     '{"fa-IR":"حرم مطهر امام رضا (ع)","en-US":"Imam Reza Holy Shrine","ar-SA":"حرم الإمام الرضا (ع)"}', 36.2880300, 59.6157500, true, 10),
    ('mashhad', 'reza-bazaar',        'shopping',   '{"fa-IR":"بازار رضا","en-US":"Reza Bazaar","ar-SA":"سوق الرضا"}', 36.2812300, 59.6145500, false, 20),
    ('mashhad', 'railway',            'station',    '{"fa-IR":"ایستگاه راه‌آهن مشهد","en-US":"Mashhad Railway Station","ar-SA":"محطة قطار مشهد"}', 36.3045600, 59.6241900, true, 30),
    ('mashhad', 'airport',            'airport',    '{"fa-IR":"فرودگاه بین‌المللی شهید هاشمی‌نژاد","en-US":"Mashhad International Airport","ar-SA":"مطار مشهد الدولي"}', 36.2340900, 59.6418700, true, 40),
    ('mashhad', 'imam-reza-hospital', 'hospital',   '{"fa-IR":"بیمارستان امام رضا (ع)","en-US":"Imam Reza Hospital","ar-SA":"مستشفى الإمام الرضا"}', 36.2885900, 59.5904900, true, 50),
    ('mashhad', 'ghaem-hospital',     'hospital',   '{"fa-IR":"بیمارستان قائم (عج)","en-US":"Ghaem Hospital","ar-SA":"مستشفى القائم"}', 36.2912800, 59.5821400, false, 60),
    ('mashhad', 'kuhsangi',           'park',       '{"fa-IR":"پارک کوهسنگی","en-US":"Kuhsangi Park","ar-SA":"منتزه كوهسنكي"}', 36.2821500, 59.5601300, false, 70),
    ('mashhad', 'proma',              'shopping',   '{"fa-IR":"مرکز خرید پروما","en-US":"Proma Mall","ar-SA":"مركز بروما التجاري"}', 36.3257300, 59.5644000, false, 80),
    ('qom',     'haram',              'shrine',     '{"fa-IR":"حرم حضرت معصومه (س)","en-US":"Fatima Masumeh Shrine","ar-SA":"حرم السيدة فاطمة المعصومة (ع)"}', 34.6418600, 50.8786600, true, 10),
    ('qom',     'jamkaran',           'shrine',     '{"fa-IR":"مسجد مقدس جمکران","en-US":"Jamkaran Mosque","ar-SA":"مسجد جمكران"}', 34.5841400, 50.9145700, true, 20),
    ('qom',     'railway',            'station',    '{"fa-IR":"ایستگاه راه‌آهن قم","en-US":"Qom Railway Station","ar-SA":"محطة قطار قم"}', 34.6463600, 50.8720100, true, 30),
    ('qom',     'kamkar-hospital',    'hospital',   '{"fa-IR":"بیمارستان کامکار","en-US":"Kamkar Hospital","ar-SA":"مستشفى كامكار"}', 34.6477300, 50.8857100, false, 40),
    ('tabriz',  'bazaar',             'shopping',   '{"fa-IR":"بازار تاریخی تبریز","en-US":"Tabriz Historic Bazaar","ar-SA":"سوق تبريز التاريخي"}', 38.0776300, 46.2976200, true, 10),
    ('tabriz',  'blue-mosque',        'attraction', '{"fa-IR":"مسجد کبود","en-US":"Blue Mosque","ar-SA":"المسجد الأزرق"}', 38.0736300, 46.3010800, false, 20),
    ('tabriz',  'el-goli',            'park',       '{"fa-IR":"ائل‌گلی","en-US":"El Goli Park","ar-SA":"حديقة إيل كولي"}', 38.0202300, 46.3638900, true, 30),
    ('tabriz',  'railway',            'station',    '{"fa-IR":"ایستگاه راه‌آهن تبریز","en-US":"Tabriz Railway Station","ar-SA":"محطة قطار تبريز"}', 38.0720600, 46.2287500, false, 40),
    ('tabriz',  'airport',            'airport',    '{"fa-IR":"فرودگاه بین‌المللی شهید مدنی تبریز","en-US":"Tabriz International Airport","ar-SA":"مطار تبريز الدولي"}', 38.1364200, 46.2433900, true, 50),
    ('tabriz',  'imam-reza-hospital', 'hospital',   '{"fa-IR":"بیمارستان امام رضا (ع) تبریز","en-US":"Imam Reza Hospital, Tabriz","ar-SA":"مستشفى الإمام الرضا في تبريز"}', 38.0554600, 46.3230600, false, 60),
    ('shiraz',  'shah-cheragh',       'shrine',     '{"fa-IR":"حرم شاهچراغ (ع)","en-US":"Shah Cheragh Shrine","ar-SA":"مرقد شاه جراغ"}', 29.6097100, 52.5430200, true, 10),
    ('shiraz',  'vakil-bazaar',       'shopping',   '{"fa-IR":"بازار وکیل","en-US":"Vakil Bazaar","ar-SA":"سوق الوكيل"}', 29.6176300, 52.5489000, true, 20),
    ('shiraz',  'hafezieh',           'attraction', '{"fa-IR":"حافظیه","en-US":"Tomb of Hafez","ar-SA":"ضريح حافظ"}', 29.6257700, 52.5585000, true, 30),
    ('shiraz',  'eram',               'park',       '{"fa-IR":"باغ ارم","en-US":"Eram Garden","ar-SA":"حديقة إرم"}', 29.6356200, 52.5256600, false, 40),
    ('shiraz',  'airport',            'airport',    '{"fa-IR":"فرودگاه بین‌المللی شیراز","en-US":"Shiraz International Airport","ar-SA":"مطار شيراز الدولي"}', 29.5413900, 52.5811700, true, 50),
    ('isfahan', 'naqsh-e-jahan',      'attraction', '{"fa-IR":"میدان نقش جهان","en-US":"Naqsh-e Jahan Square","ar-SA":"ميدان نقش جهان"}', 32.6581000, 51.6773600, true, 10),
    ('isfahan', 'si-o-se-pol',        'attraction', '{"fa-IR":"سی‌وسه‌پل","en-US":"Si-o-se Pol","ar-SA":"جسر سي وسه بل"}', 32.6445900, 51.6675100, true, 20),
    ('isfahan', 'airport',            'airport',    '{"fa-IR":"فرودگاه بین‌المللی اصفهان","en-US":"Isfahan International Airport","ar-SA":"مطار أصفهان الدولي"}', 32.7614500, 51.8881800, true, 30),
    ('yazd',    'jameh-mosque',       'attraction', '{"fa-IR":"مسجد جامع یزد","en-US":"Jameh Mosque of Yazd","ar-SA":"المسجد الجامع في يزد"}', 31.9014500, 54.3688500, true, 10),
    ('yazd',    'dowlatabad',         'park',       '{"fa-IR":"باغ دولت‌آباد","en-US":"Dowlatabad Garden","ar-SA":"حديقة دولت آباد"}', 31.9027800, 54.3512700, false, 20),
    ('yazd',    'airport',            'airport',    '{"fa-IR":"فرودگاه بین‌المللی شهید صدوقی یزد","en-US":"Yazd Airport","ar-SA":"مطار يزد"}', 31.9013200, 54.2822000, true, 30),
    ('tehran',  'ika',                'airport',    '{"fa-IR":"فرودگاه بین‌المللی امام خمینی","en-US":"Imam Khomeini International Airport","ar-SA":"مطار الإمام الخميني الدولي"}', 35.4164600, 51.1448300, true, 10),
    ('tehran',  'mehrabad',           'airport',    '{"fa-IR":"فرودگاه مهرآباد","en-US":"Mehrabad Airport","ar-SA":"مطار مهر آباد"}', 35.6895700, 51.3021600, true, 20),
    ('tehran',  'grand-bazaar',       'shopping',   '{"fa-IR":"بازار بزرگ تهران","en-US":"Tehran Grand Bazaar","ar-SA":"بازار طهران الكبير"}', 35.6765700, 51.4214000, true, 30),
    ('tehran',  'milad',              'attraction', '{"fa-IR":"برج میلاد","en-US":"Milad Tower","ar-SA":"برج ميلاد"}', 35.7447000, 51.3752700, false, 40),
    ('kish',    'airport',            'airport',    '{"fa-IR":"فرودگاه بین‌المللی کیش","en-US":"Kish International Airport","ar-SA":"مطار كيش الدولي"}', 26.5299700, 53.9750100, true, 10)
  ) as v(city, slug, kind, name, lat, lng, quick, ord)
  join stay.cities c on c.slug = v.city
on conflict (city_id, slug) do nothing;

-- 3. Amenities ---------------------------------------------------------------------

insert into stay.amenities (code, grp, label, icon, sort_order) values
  ('haram_view',           'room',     '{"fa-IR":"اتاق رو به حرم","en-US":"Shrine-view rooms","ar-SA":"غرف مطلة على الحرم"}', 'landmark', 125),
  ('non_smoking',          'room',     '{"fa-IR":"اتاق‌های غیرسیگاری","en-US":"Non-smoking rooms","ar-SA":"غرف لغير المدخنين"}', 'cigarette-off', 170),
  ('porter',               'general',  '{"fa-IR":"خدمات باربری","en-US":"Porter service","ar-SA":"خدمة حمل الأمتعة"}', 'luggage', 75),
  ('currency_exchange',    'general',  '{"fa-IR":"صرافی","en-US":"Currency exchange","ar-SA":"صرافة"}', 'banknote', 85),
  ('tour_desk',            'general',  '{"fa-IR":"میز خدمات تور","en-US":"Tour desk","ar-SA":"مكتب جولات سياحية"}', 'map', 90),
  ('shop',                 'general',  '{"fa-IR":"فروشگاه","en-US":"Shop","ar-SA":"متجر"}', 'shopping-bag', 95),
  ('rooftop_restaurant',   'food',     '{"fa-IR":"رستوران بام","en-US":"Rooftop restaurant","ar-SA":"مطعم على السطح"}', 'utensils', 325),
  ('traditional_teahouse', 'food',     '{"fa-IR":"سفره‌خانه سنتی","en-US":"Traditional teahouse","ar-SA":"مقهى تقليدي"}', 'coffee', 335),
  ('massage',              'wellness', '{"fa-IR":"ماساژ","en-US":"Massage","ar-SA":"تدليك"}', 'hand', 440),
  ('beauty_salon',         'wellness', '{"fa-IR":"آرایشگاه","en-US":"Beauty salon","ar-SA":"صالون تجميل"}', 'scissors', 450),
  ('game_room',            'family',   '{"fa-IR":"اتاق بازی و سرگرمی","en-US":"Games room","ar-SA":"غرفة ألعاب"}', 'gamepad-2', 530),
  ('childcare',            'family',   '{"fa-IR":"خدمات نگهداری کودک","en-US":"Childcare","ar-SA":"رعاية الأطفال"}', 'baby', 540),
  ('business_center',      'business', '{"fa-IR":"بیزینس سنتر","en-US":"Business centre","ar-SA":"مركز أعمال"}', 'briefcase', 820)
on conflict (code) do nothing;

-- 4. City pages ----------------------------------------------------------------------

update stay.cities c
   set cover_url = v.cover, cover_alt = v.alt::jsonb, cover_credit = v.credit, updated_at = now()
  from (values
    ('mashhad', '/images/stays/mashhad-imam-reza-shrine-night.webp',
       '{"fa-IR":"نمای شبانه گنبد و گلدسته‌های حرم مطهر امام رضا (ع) در مشهد","en-US":"The domes and minarets of the Imam Reza Holy Shrine in Mashhad at night"}',
       'mohammad hosein tabatabaeian · CC BY-SA 3.0'),
    ('tabriz',  '/images/stays/tabriz-el-goli-night.webp',
       '{"fa-IR":"عمارت ائل‌گلی تبریز و بازتاب آن در دریاچه، در شب","en-US":"The El Goli pavilion in Tabriz reflected in its lake at night"}',
       'Yare zaman2000 · CC BY-SA 4.0'),
    ('qom',     '/images/stays/qom-masumeh-shrine-iwan.webp',
       '{"fa-IR":"کاشی‌کاری سقف ایوان صحن اتابکی حرم حضرت معصومه (س) در قم","en-US":"Tiled iwan ceiling in the Atabaki courtyard of the Fatima Masumeh Shrine, Qom"}',
       'Amir Pashaei · CC BY-SA 4.0')
  ) as v(slug, cover, alt, credit)
 where c.slug = v.slug and c.cover_url is null;

update stay.cities c
   set intro = v.intro::jsonb, updated_at = now()
  from (values
    ('mashhad', jsonb_build_object(
      'fa-IR', E'بیشتر مسافران مشهد می‌خواهند تا حرم مطهر امام رضا (ع) فاصله کمی داشته باشند. هتل‌های خیابان امام رضا، طبرسی و اطراف حرم معمولاً پیاده تا حرم ۵ تا ۲۰ دقیقه فاصله دارند؛ هتل‌های دورتر آرام‌ترند و به مراکز خرید نزدیک‌ترند، اما برای زیارت باید با تاکسی یا مترو رفت‌وآمد کنید.\n\nپیش از رزرو در مشهد:\n• در نوروز، تابستان، دهه آخر صفر و ایام ولادت امام رضا (ع) ظرفیت زود پر می‌شود؛ هرچه زودتر رزرو کنید قیمت و انتخاب بهتری دارید.\n• با گزینه «نزدیک حرم» فقط اقامتگاه‌هایی را ببینید که پیاده به حرم می‌رسید؛ فاصله و زمان پیاده‌روی روی هر اقامتگاه نوشته شده است.\n• اگر برای درمان به مشهد می‌آیید، اقامتگاه‌های «مناسب همراه بیمار» و فاصله تا بیمارستان را بررسی کنید.\n• ساعت تحویل اتاق معمولاً ۱۴ و تخلیه ۱۲ است؛ اگر زودتر می‌رسید، در توضیحات رزرو بنویسید تا هتل در صورت امکان هماهنگ کند.',
      'en-US', E'Most visitors to Mashhad want to stay close to the Imam Reza Holy Shrine. Hotels on Imam Reza Street, Tabarsi and the streets around the shrine are usually a 5–20 minute walk away; hotels further out are quieter and closer to the malls, but you will need a taxi or the metro to reach the shrine.\n\nBefore you book in Mashhad:\n• Rooms sell out early at Nowruz, in summer, in the last ten days of Safar and around the birthday of Imam Reza; booking early gives you better prices and more choice.\n• Choose "Near the shrine" to see only places within walking distance; each stay shows its distance and walking time.\n• Travelling for medical treatment? Look for stays suitable for patient companions and check the distance to your hospital.\n• Check-in is usually 14:00 and check-out 12:00. Arriving early? Add it to your booking notes and the hotel will try to accommodate you.'
    )::text),
    ('tabriz', jsonb_build_object(
      'fa-IR', E'تبریز شهر بازار تاریخی ثبت جهانی، مسجد کبود و ائل‌گلی است. اگر برای خرید و گردش در بافت تاریخی سفر می‌کنید، اقامت در مرکز شهر و نزدیک بازار رفت‌وآمد را ساده می‌کند؛ برای سفر خانوادگی و آرام، محدوده ائل‌گلی و ولیعصر انتخاب‌های خوبی‌اند.\n\nپیش از رزرو در تبریز:\n• زمستان‌های تبریز سرد است؛ سیستم گرمایش و پارکینگ را در امکانات اقامتگاه بررسی کنید.\n• با گزینه «نزدیک به» فاصله تا بازار، ائل‌گلی یا فرودگاه را ببینید.\n• در نوروز و فصل نمایشگاه‌های تبریز ظرفیت زودتر پر می‌شود.',
      'en-US', E'Tabriz is home to the UNESCO-listed historic bazaar, the Blue Mosque and El Goli. For shopping and the old town, stay in the centre near the bazaar; for a quieter family trip, the El Goli and Valiasr areas are good choices.\n\nBefore you book in Tabriz:\n• Winters are cold — check that your stay has heating and parking.\n• Use "Near" to see the distance to the bazaar, El Goli or the airport.\n• Rooms fill up early at Nowruz and during the Tabriz trade-fair season.'
    )::text),
    ('qom', jsonb_build_object(
      'fa-IR', E'قم میزبان زائران حرم حضرت معصومه (س) و مسجد مقدس جمکران است و بیشتر سفرها یک تا دو شبه‌اند. اقامتگاه‌های نزدیک حرم برای زیارت پیاده مناسب‌اند؛ اگر برای شب‌های چهارشنبه یا نیمه شعبان به جمکران می‌روید، فاصله تا جمکران را هم در نظر بگیرید.\n\nپیش از رزرو در قم:\n• در نیمه شعبان و ایام اربعین ظرفیت محدود است؛ زودتر اقدام کنید.\n• با گزینه «نزدیک حرم» یا «نزدیک جمکران» فاصله و زمان پیاده‌روی هر اقامتگاه را ببینید.',
      'en-US', E'Qom welcomes pilgrims to the Fatima Masumeh Shrine and Jamkaran Mosque, and most visits last one or two nights. Stays near the shrine let you walk to it; if you are going to Jamkaran on a Tuesday night or for the 15th of Sha''ban, check the distance to Jamkaran too.\n\nBefore you book in Qom:\n• Rooms are limited around the 15th of Sha''ban and Arbaeen — book early.\n• Choose "Near the shrine" or "Near Jamkaran" to see each stay''s distance and walking time.'
    )::text)
  ) as v(slug, intro)
 where c.slug = v.slug and c.intro = '{}'::jsonb;

update stay.cities set is_featured = true, updated_at = now() where slug = 'tabriz' and not is_featured;

-- The "accommodation" root category opens the stays app from the home page and the
-- category browser (like tour.settings tourism_category_id does for tours).
insert into stay.settings (key, value)
select 'accommodation_category_id', to_jsonb(c.id::text)
  from category.categories c
 where c.slug = 'accommodation' and c.parent_id is null
 order by c.id
 limit 1
on conflict (key) do nothing;

-- 5. Provider import -------------------------------------------------------------------

-- Keeps only real translations (language-tag keys, non-blank values), optionally limited to some locales.
create or replace function stay.clean_tr(p jsonb, p_locales text[] default null)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_object_agg(k, btrim(v)), '{}'::jsonb)
    from jsonb_each_text(case when jsonb_typeof(p) = 'object' then p else '{}'::jsonb end) as e(k, v)
   where k ~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$'
     and btrim(coalesce(v, '')) <> ''
     and (p_locales is null or k = any(p_locales))
$$;

-- Readable text of a stored value: Lexical rich text (admin editor) flattened to paragraphs, plain text unchanged.
create or replace function stay.lexical_plain(p text)
returns text
language plpgsql
immutable
as $$
declare
  j jsonb;
begin
  if p is null or btrim(p) = '' then return null; end if;
  if left(ltrim(p), 1) <> '{' then return btrim(p); end if;
  begin
    j := p::jsonb;
  exception when others then
    return btrim(p);
  end;
  if jsonb_typeof(j #> '{root,children}') is distinct from 'array' then return btrim(p); end if;
  return nullif(btrim((
    select string_agg(para, E'\n\n' order by ord)
      from (select e.ord, btrim((select string_agg(t #>> '{}', '') from jsonb_path_query(e.c, 'strict $.**.text') as t)) as para
              from jsonb_array_elements(j #> '{root,children}') with ordinality as e(c, ord)) x
     where para <> '')), '');
end $$;

-- Short summary: whole text when short, otherwise cut at a word boundary.
create or replace function stay.short_text(p text, p_max integer)
returns text
language sql
immutable
as $$
  select case
    when p is null then null
    when char_length(p) <= p_max then p
    else rtrim(regexp_replace(left(p, p_max), '\s+\S*$', ''), ' ،,.;:') || '…'
  end
$$;

-- Guests a room is sold for, read from its Persian/English name
-- ("اتاق سه تخته" → 3, "سوئیت خانواده چهار نفره" → 4, "دو خوابه" → 4). Defaults to 2.
create or replace function stay.guess_occupancy(p_name text)
returns integer
language plpgsql
immutable
as $$
declare
  t text := ' ' || translate(coalesce(p_name, ''), '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩' || chr(8204), '01234567890123456789 ') || ' ';
  m text[];
  w record;
begin
  t := regexp_replace(t, '(یک|دو|سه|چهار|پنج|شش|هشت)(تخته|نفره|خوابه|خواب)', '\1 \2', 'g');
  if t ~ 'برای\s+یک\s+نفر' or t ~* 'single' then return 1; end if;
  m := regexp_match(t, '(\d{1,2})\s*(تخته|نفره|نفر)');
  if m is not null then return least(greatest(m[1]::int, 1), 30); end if;
  for w in select * from (values ('چهارده', 14), ('دوازده', 12), ('یازده', 11), ('ده', 10), ('نه', 9), ('هشت', 8), ('هفت', 7),
                                 ('شش', 6), ('پنج', 5), ('چهار', 4), ('سه', 3), ('دو', 2), ('یک', 1)) as v(word, n) loop
    if t ~ ('[\s(]' || w.word || '\s*(تخته|نفره|نفر)') then return w.n; end if;
  end loop;
  for w in select * from (values ('پنج', 5), ('چهار', 4), ('سه', 3), ('دو', 2), ('یک', 1)) as v(word, n) loop
    if t ~ ('[\s(]' || w.word || '\s*خوابه?[\s)]') then return least(w.n * 2, 30); end if;
  end loop;
  if t ~* '(triple)' then return 3; end if;
  return 2;
end $$;

create or replace function stay.import_provider(p_provider uuid, p_city uuid, p_actor uuid default null, p_publish boolean default false)
returns uuid
language plpgsql
as $$
declare
  sp category.service_providers%rowtype;
  v_locales text[];
  v_id uuid;
  v_slug text;
  v_name jsonb;
  v_fa text;
  v_desc jsonb := '{}'::jsonb;
  v_summary jsonb := '{}'::jsonb;
  v_addr jsonb;
  v_cat text;
  v_star_txt text;
  v_all text;
  v_title text;
  v_kind text;
  v_stars integer;
  v_amen text[];
  v_entire boolean;
  v_medical boolean;
  v_phone text;
  v_median numeric;
  v_skipped integer := 0;
  v_pol uuid;
  v_room uuid;
  v_rooms integer;
  v_occ integer;
  v_lat numeric;
  v_lng numeric;
  v_url text;
  k text;
  v text;
  r record;
  i integer := 0;
  n_media integer := 0;
begin
  select * into sp from category.service_providers where id = p_provider;
  if not found then raise exception 'PROVIDER_NOT_FOUND' using errcode = 'P0002'; end if;
  if not exists (select 1 from stay.cities where id = p_city) then raise exception 'CITY_NOT_FOUND' using errcode = 'P0002'; end if;
  if exists (select 1 from stay.properties where service_provider_id = p_provider) then
    raise exception 'ALREADY_IMPORTED' using errcode = '23505';
  end if;

  select array(select jsonb_array_elements_text(value)) into v_locales from stay.settings where key = 'enabled_locales';
  if v_locales is null or cardinality(v_locales) = 0 then v_locales := array['fa-IR', 'en-US', 'ar-SA']; end if;

  -- Provider attributes are free text ("ستاره": "5", "دسته بندی": "هتل آپارتمان", "امکانات ویژه": "لاندری، پارکینگ، ...").
  select max(val) filter (where def = 'دسته بندی'), max(val) filter (where def = 'ستاره'), string_agg(val, ' ، ')
    into v_cat, v_star_txt, v_all
    from (select btrim(d.name_translations ->> 'fa-IR') as def,
                 (select string_agg(x, ' ') from jsonb_each_text(case when jsonb_typeof(a.value_translations) = 'object' then a.value_translations else '{}'::jsonb end) as e(y, x)) as val
            from category.provider_attributes a
            join category.provider_attribute_definitions d on d.id = a.attribute_definition_id
           where a.service_provider_id = p_provider) s;

  v_name := stay.clean_tr(sp.name_translations, v_locales);
  if v_name = '{}'::jsonb then
    v_name := jsonb_build_object('fa-IR', coalesce(nullif(btrim(sp.name_translations ->> 'en-US'), ''), 'اقامتگاه'));
  end if;
  v_fa := coalesce(v_name ->> 'fa-IR', v_name ->> 'en-US', '');
  v_title := translate(coalesce(v_cat, '') || ' ' || v_fa, 'يك' || chr(8204), 'یک ');

  v_medical := v_title like '%بیمارستان%';
  v_kind := case
    when v_title ~ 'هتل\s*آپارتمان' then 'hotel_apartment'
    when v_title ~ 'بوم\s*گردی' then 'ecolodge'
    when v_title ~ 'مهمان\s*پذیر' then 'guesthouse'
    when coalesce(v_cat, '') ~ '(سوئیت|سوییت)' then 'suite'
    when coalesce(v_cat, '') ~ 'ویلا' then 'villa'
    when coalesce(v_cat, '') ~ 'سنتی' then 'traditional'
    when coalesce(v_cat, '') ~ 'هاستل' then 'hostel'
    when coalesce(v_cat, '') ~ 'متل' then 'motel'
    else 'hotel'
  end;

  select count(*)::int into v_rooms
    from category.provider_services ps join category.service_definitions sd on sd.id = ps.service_definition_id
   where ps.service_provider_id = p_provider and ps.is_active and sd.booking_ui_mode = 'date_range' and ps.value > 0
     and coalesce(ps.currency, 'IRR') = 'IRR';
  v_entire := v_kind in ('suite', 'villa', 'apartment', 'cottage') and v_rooms = 1;
  -- A nightly price far below the provider's other rooms is a data-entry slip (e.g. 2,000,000 instead of
  -- 20,000,000 rial); such rooms are left out and reported in the audit log for an admin to fix.
  select percentile_cont(0.5) within group (order by ps.value) into v_median
    from category.provider_services ps join category.service_definitions sd on sd.id = ps.service_definition_id
   where ps.service_provider_id = p_provider and ps.is_active and sd.booking_ui_mode = 'date_range' and ps.value > 0
     and coalesce(ps.currency, 'IRR') = 'IRR';

  v_star_txt := translate(coalesce(v_star_txt, ''), '۰۱۲۳۴۵۶۷۸۹', '0123456789');
  v_stars := case when v_kind in ('suite', 'villa', 'apartment', 'cottage') then null
                  else coalesce((regexp_match(v_star_txt, '([1-5])'))[1]::int,
                                case when v_star_txt ~ 'پنج' then 5 when v_star_txt ~ 'چهار' then 4 when v_star_txt ~ 'سه' then 3
                                     when v_star_txt ~ 'دو' then 2 when v_star_txt ~ 'یک' then 1 end) end;

  -- Amenities: keywords in the provider's attributes and room names → amenity vocabulary.
  v_all := translate(coalesce(v_all, '') || ' ' || coalesce((
             select string_agg(coalesce(ps.display_name_translations ->> 'fa-IR', sd.name_translations ->> 'fa-IR'), ' ')
               from category.provider_services ps join category.service_definitions sd on sd.id = ps.service_definition_id
              where ps.service_provider_id = p_provider and ps.is_active and sd.booking_ui_mode = 'date_range'), ''),
           'يك' || chr(8204), 'یک ');
  select coalesce(array_agg(distinct m.code order by m.code), '{}')
    into v_amen
    from (values ('لاندری', 'laundry'), ('خشکشویی', 'laundry'), ('کافی شاپ', 'coffee_shop'), ('کافه', 'coffee_shop'),
                 ('باربری', 'porter'), ('صندوق امانات', 'safe_box'), ('صبحانه', 'breakfast'), ('بیزینس', 'business_center'),
                 ('سالن جلسات', 'meeting_room'), ('سالن همایش', 'meeting_room'), ('سالن کنفرانس', 'meeting_room'),
                 ('پارکینگ', 'parking'), ('فضای سبز', 'garden'), ('محوطه سبز', 'garden'), ('حیاط', 'garden'),
                 ('رستوران بام', 'rooftop_restaurant'), ('رستوران', 'restaurant'), ('آشپزخانه', 'kitchen'),
                 ('اینترنت', 'wifi'), ('وای فای', 'wifi'), ('وایفای', 'wifi'), ('آسانسور', 'elevator'), ('صرافی', 'currency_exchange'),
                 ('آرایشگاه', 'beauty_salon'), ('چایخانه', 'traditional_teahouse'), ('سفره خانه', 'traditional_teahouse'),
                 ('فروشگاه', 'shop'), ('استخر', 'pool'), ('جکوزی', 'sauna'), ('سونا', 'sauna'), ('ماساژ', 'massage'),
                 ('سالن ورزشی', 'gym'), ('بدنسازی', 'gym'), ('اتاق بازی', 'game_room'), ('گیم نت', 'game_room'),
                 ('بازی ویدئویی', 'game_room'), ('بیلیارد', 'game_room'), ('نگهداری کودک', 'childcare'), ('خدمات تور', 'tour_desk'),
                 ('ترانسفر', 'airport_shuttle'), ('نمازخانه', 'prayer_room'), ('شبانه روزی', 'reception_24h'),
                 ('رو به حرم', 'haram_view'), ('روبحرم', 'haram_view'), ('روبه حرم', 'haram_view')) as m(kw, code)
    join stay.amenities a on a.code = m.code and a.is_active
   where v_all like '%' || m.kw || '%';
  if v_medical and not ('near_hospital' = any(v_amen)) then v_amen := array_append(v_amen, 'near_hospital'); end if;

  -- Descriptions may be Lexical rich text; keep them as authored, derive a plain summary.
  for k, v in select e.key, e.value from jsonb_each_text(stay.clean_tr(sp.description_translations, v_locales)) as e loop
    if coalesce(stay.lexical_plain(v), '') <> '' then
      v_desc := v_desc || jsonb_build_object(k, v);
      v_summary := v_summary || jsonb_build_object(k, stay.short_text(split_part(stay.lexical_plain(v), E'\n\n', 1), 220));
    end if;
  end loop;
  v_addr := stay.clean_tr(sp.street_translations, v_locales);

  -- The provider's phone is often the account manager's, not the front desk's: an admin adds the
  -- property's own number before it is shown to guests (vouchers fall back to Lsevin support).
  v_phone := null;

  if sp.latitude is not null and sp.longitude is not null and sp.latitude between -90 and 90 and sp.longitude between -180 and 180 then
    v_lat := sp.latitude;
    v_lng := sp.longitude;
  end if;

  v_slug := lower(coalesce(sp.slug, ''));
  if v_slug !~ '^[a-z0-9][a-z0-9-]{0,100}$' then
    v_slug := btrim(regexp_replace(lower(coalesce(v_name ->> 'en-US', '')), '[^a-z0-9]+', '-', 'g'), '-');
  end if;
  if v_slug = '' or v_slug !~ '^[a-z0-9]' then v_slug := 'stay-' || left(replace(p_provider::text, '-', ''), 8); end if;
  v_slug := left(v_slug, 90);
  -- Never shadow a stays section (/stays/explore, /stays/city, ...) or another property.
  if v_slug in ('explore', 'city', 'wishlist', 'bookings', 'intro', 'p', 'admin', 'search')
     or exists (select 1 from stay.properties where slug = v_slug) then
    v_slug := v_slug || '-' || left(replace(p_provider::text, '-', ''), 6);
  end if;

  insert into stay.properties (
    service_provider_id, city_id, slug, status, kind, inventory_model, star_rating, name, summary, description, address,
    latitude, longitude, location_privacy, amenity_codes, medical_friendly, confirmation_mode, request_timeout_hours,
    currency_code, timezone, contact_phone, source_locale, created_by
  ) values (
    p_provider, p_city, v_slug, 'draft', v_kind, case when v_entire then 'entire_place' else 'rooms' end, v_stars, v_name, v_summary, v_desc, v_addr,
    v_lat, v_lng, 'exact', v_amen, v_medical, 'request', 24,
    'IRR', case when coalesce(sp.timezone_id, '') ~ '^[A-Za-z_]+/[A-Za-z_]+' then sp.timezone_id else 'Asia/Tehran' end, v_phone, 'fa-IR', p_actor
  ) returning id into v_id;

  -- Same starting policy as an admin-created stay (full refund until 72 h, half until 24 h); editable per property.
  insert into stay.policies (property_id, version, rules, no_show_refund_percent, created_by)
  values (v_id, 1, '[{"hoursBefore":72,"refundPercent":100},{"hoursBefore":24,"refundPercent":50}]'::jsonb, 0, p_actor)
  returning id into v_pol;
  update stay.properties set current_policy_id = v_pol where id = v_id;

  -- Photos: the provider's main image, then its gallery in display order.
  for v_url in
    select u from (
      select btrim(sp.image_url) as u, 0 as o1, 0::bigint as o2
      union all
      select btrim(g.url), 1, row_number() over (order by g.display_order, g.create_date)
        from category.provider_gallery_items g
       where g.service_provider_id = p_provider and coalesce(g.media_type, 'image') ilike 'image%'
    ) s
     where u is not null and u <> '' and (u ~ '^(https://|/)' or u ~ '^[A-Za-z0-9]')
     group by u
     order by min(o1), min(o2)
     limit 20
  loop
    -- A gallery item may reference the media library by id.
    if v_url ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and to_regclass('media.media_library') is not null then
      execute 'select nullif(btrim(file_url), '''') from media.media_library where id::text = $1' into v_url using v_url;
      continue when v_url is null;
    end if;
    n_media := n_media + 1;
    insert into stay.media (property_id, url, alt, sort_order, is_cover) values (v_id, v_url, v_name, n_media, n_media = 1);
  end loop;

  -- Rooms: each nightly (date_range) service becomes a room type with one rate plan at the provider's price.
  for r in
    select stay.clean_tr(coalesce(nullif(ps.display_name_translations, '{}'::jsonb), sd.name_translations), v_locales) as name,
           coalesce(ps.display_name_translations ->> 'fa-IR', sd.name_translations ->> 'fa-IR', '') as fa,
           ps.value
      from category.provider_services ps
      join category.service_definitions sd on sd.id = ps.service_definition_id
     where ps.service_provider_id = p_provider and ps.is_active and sd.booking_ui_mode = 'date_range' and ps.value > 0
       and coalesce(ps.currency, 'IRR') = 'IRR'
     order by ps.value, ps.create_date
     limit case when v_entire then 1 else 30 end
  loop
    if v_rooms >= 3 and r.value < v_median * 0.25 then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    i := i + 1;
    v_occ := stay.guess_occupancy(coalesce(nullif(r.fa, ''), r.name ->> 'en-US'));
    insert into stay.room_types (property_id, code, name, units, base_occupancy, max_adults, max_children, max_occupancy, amenity_codes, sort_order)
    values (v_id, 'room-' || i,
            case when r.name = '{}'::jsonb then jsonb_build_object('fa-IR', 'اتاق ' || i) else r.name end,
            case when v_entire then 1 else 3 end,
            v_occ, v_occ, case when v_occ >= 2 then least(v_occ - 1, 4) else 0 end, v_occ,
            case when r.fa ~ '(رو\s*به\s*حرم|روبحرم)' then array['haram_view'] else '{}'::text[] end, i)
    returning id into v_room;
    insert into stay.rate_plans (property_id, room_type_id, code, name, meal_plan, refundable, base_price, sort_order)
    values (v_id, v_room, 'standard', '{}'::jsonb, case when r.fa like '%صبحانه%' then 'breakfast' else 'room_only' end, true, r.value, 1);
  end loop;

  if p_publish and v_name ? 'fa-IR' and (v_desc ? 'fa-IR' or v_summary ? 'fa-IR') and n_media > 0 and i > 0 then
    update stay.properties set status = 'published', published_at = now() where id = v_id;
  end if;

  insert into stay.audit_log (actor_user_id, property_id, entity_type, entity_id, action, detail)
  values (p_actor, v_id, 'property', v_id, 'imported_from_provider',
          jsonb_build_object('providerId', p_provider, 'rooms', i, 'roomsSkippedImplausiblePrice', v_skipped,
                             'photos', n_media, 'publishRequested', p_publish));
  return v_id;
end $$;

-- The Mashhad and Tabriz hotels already selling on Lsevin, published as request-to-book stays.
do $$
declare
  r record;
begin
  for r in
    select distinct on (sp.id) sp.id, c.id as city_id
      from (values
        ('al-reza-madinah-hotel', 'mashhad'), ('palace-international-hotel', 'mashhad'), ('almas-hotel-2', 'mashhad'),
        ('almas-hotel-1', 'mashhad'), ('javaheri-hotel', 'mashhad'), ('javaher-shargh-hotel', 'mashhad'),
        ('harand-hotel', 'mashhad'), ('khavar-hotel', 'mashhad'), ('si-barg-hotel-mashhad', 'mashhad'),
        ('firoozeh-toos-hotel', 'mashhad'), ('ab-mirza-eco-lodge-hotel', 'mashhad'), ('percook-hotel-apartment', 'mashhad'),
        ('mohammadi-shahan-hotel-apartment', 'mashhad'), ('shad-e-toos-hotel-apartment', 'mashhad'),
        ('sa-at-guesthouse-mashhad', 'mashhad'), ('dr-khatib-hotel-hospital', 'mashhad'), ('suite-tabriz', 'tabriz')
      ) as v(slug, city)
      join category.service_providers sp on sp.slug = v.slug and sp.is_active
      join stay.cities c on c.slug = v.city
     where not exists (select 1 from stay.properties p where p.service_provider_id = sp.id)
     order by sp.id
  loop
    perform stay.import_provider(r.id, r.city_id, null, true);
  end loop;
end $$;
