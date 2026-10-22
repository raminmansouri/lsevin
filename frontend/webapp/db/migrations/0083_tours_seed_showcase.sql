-- ---------------------------------------------------------------------------
-- 0083 — Tours: first showcase catalog (4 destinations, 4 tours).
--
-- Production went live with an empty catalog. This seeds four request-to-book
-- tours run by a platform-owned "Lsevin Tours" provider so customers see real
-- content. Request-to-book means no money is taken until someone accepts the
-- request in the provider portal; unanswered requests expire with no charge.
--
-- Safe to run on both sites independently:
--   * every id is fixed or derived from md5(<slug>:<part>), so B and A get the
--     same rows (category.* is replicated — the provider insert tolerates the
--     row already having arrived from the other site);
--   * each tour is skipped when its id or slug already exists, so re-running or
--     a provider having created the same slug never duplicates or overwrites.
-- Images live in public/images/tours (see CREDITS.json for licences).
-- ---------------------------------------------------------------------------

create or replace function pg_temp.seed_uuid(p text) returns uuid
language sql immutable as $$ select md5('tours-seed-0083:' || p)::uuid $$;

create or replace function pg_temp.seed_text(p_tour uuid, p_entity text, p_entity_id uuid, p_field text, p_locale text, p_value text, p_source boolean)
returns void language sql as $$
  insert into tour.content (tour_id, entity_type, entity_id, field_key, locale, draft_value, published_value, status,
                            is_source, source_revision, approved_at, published_at)
  values (p_tour, p_entity, p_entity_id, p_field, p_locale::tour.locale_tag, p_value, p_value, 'published',
          p_source, case when p_source then null else 1 end, now(), now())
  on conflict (entity_type, entity_id, field_key, locale) do nothing
$$;

do $seed$
declare
  v_provider constant uuid := pg_temp.seed_uuid('provider');
  v_type uuid;
  d jsonb;
  t jsonb;
  s jsonb;
  m jsonb;
  f record;
  v_tour uuid;
  v_dest uuid;
  v_opt uuid;
  v_stop uuid;
  v_rule uuid;
  v_i int;
  v_pos int;
  v_day int;
  v_prev_day int;
begin
  -- Provider type "Tourism" exists on production; create it only on bare databases.
  select id into v_type from category.provider_types where name_translations->>'en-US' ilike 'tourism' order by create_date limit 1;
  if v_type is null then
    v_type := pg_temp.seed_uuid('provider-type');
    insert into category.provider_types (id, name_translations, description_translations, is_active)
    values (v_type, '{"en-US":"Tourism","fa-IR":"گردشگری"}', '{}', true)
    on conflict (id) do nothing;
  end if;

  insert into category.service_providers (id, name_translations, description_translations, is_active, provider_type_id, city, country,
                                          email, phone_number_country_code, phone_number, accredited, timezone_id)
  values (v_provider,
          '{"fa-IR":"تورهای لوین","en-US":"Lsevin Tours","ar-SA":"جولات لسوين","tr-TR":"Lsevin Turları"}',
          '{"fa-IR":"تورهای منتخب لوین با راهنمای محلی","en-US":"Lsevin''s own guided tours with local guides"}',
          true, v_type, 'SHIRAZ', 'IR', 'tours@lsevin.com', '+98', '0000000000', true, 'Asia/Tehran')
  on conflict (id) do nothing;

  -- Destinations ---------------------------------------------------------------
  for d in select * from jsonb_array_elements($json$[
    {"slug":"shiraz","sort":10,"lat":29.6100,"lng":52.5311,"cover":"/images/tours/shiraz-nasir-al-mulk.webp",
     "name":{"fa-IR":"شیراز","en-US":"Shiraz","ar-SA":"شيراز","tr-TR":"Şiraz"},
     "region":{"fa-IR":"فارس، ایران","en-US":"Fars, Iran","ar-SA":"فارس، إيران","tr-TR":"Fars, İran"},
     "desc":{"fa-IR":"شهر باغ‌ها، شعر و نارنج؛ دروازهٔ تخت جمشید.","en-US":"City of gardens, poetry and orange blossom — and the gateway to Persepolis."},
     "alt":{"fa-IR":"نور رنگی شیشه‌های مسجد نصیرالملک شیراز","en-US":"Coloured light from the stained glass of Nasir al-Mulk Mosque, Shiraz"}},
    {"slug":"isfahan","sort":20,"lat":32.6546,"lng":51.6680,"cover":"/images/tours/isfahan-naqsh-e-jahan.webp",
     "name":{"fa-IR":"اصفهان","en-US":"Isfahan","ar-SA":"أصفهان","tr-TR":"İsfahan"},
     "region":{"fa-IR":"اصفهان، ایران","en-US":"Isfahan, Iran","ar-SA":"أصفهان، إيران","tr-TR":"İsfahan, İran"},
     "desc":{"fa-IR":"میدان نقش جهان، پل‌های زاینده‌رود و بازارهایی که هنوز زنده‌اند.","en-US":"Naqsh-e Jahan Square, the Zayandeh-Rud bridges and bazaars that are still alive."},
     "alt":{"fa-IR":"میدان نقش جهان از زیر طاق قیصریه","en-US":"Naqsh-e Jahan Square seen from the Qeysarieh vault"}},
    {"slug":"yazd","sort":30,"lat":31.8974,"lng":54.3569,"cover":"/images/tours/yazd-windcatchers.webp",
     "name":{"fa-IR":"یزد","en-US":"Yazd","ar-SA":"يزد","tr-TR":"Yezd"},
     "region":{"fa-IR":"یزد، ایران","en-US":"Yazd, Iran","ar-SA":"يزد، إيران","tr-TR":"Yezd, İran"},
     "desc":{"fa-IR":"کوچه‌های خشتی، بادگیرها و باغ‌های کویری.","en-US":"Mud-brick lanes, windcatchers and desert gardens."},
     "alt":{"fa-IR":"بادگیرهای یزد زیر آسمان آبی","en-US":"Yazd windcatchers against a blue sky"}},
    {"slug":"kish","sort":40,"lat":26.5326,"lng":53.9800,"cover":"/images/tours/kish-beach.webp",
     "name":{"fa-IR":"کیش","en-US":"Kish Island","ar-SA":"جزيرة كيش","tr-TR":"Kiş Adası"},
     "region":{"fa-IR":"هرمزگان، ایران","en-US":"Hormozgan, Iran","ar-SA":"هرمزگان، إيران","tr-TR":"Hürmüzgan, İran"},
     "desc":{"fa-IR":"ساحل‌های سفید و آب فیروزه‌ای خلیج فارس.","en-US":"White beaches and the turquoise water of the Persian Gulf."},
     "alt":{"fa-IR":"ساحل شنی جزیرهٔ کیش","en-US":"Sandy beach on Kish Island"}}
  ]$json$::jsonb)
  loop
    insert into tour.destinations (id, slug, name_translations, description_translations, region_translations, country_code, latitude, longitude,
                                   timezone, cover_url, cover_alt_translations, is_published, is_featured, sort_order, search_text)
    values (pg_temp.seed_uuid('destination:' || (d->>'slug')), d->>'slug', d->'name', d->'desc', d->'region', 'IR',
            (d->>'lat')::numeric, (d->>'lng')::numeric, 'Asia/Tehran', d->>'cover', d->'alt', true, true, (d->>'sort')::int,
            lower(concat_ws(' ', d->>'slug', (select string_agg(v, ' ') from jsonb_each_text(d->'name') e(k, v)))))
    on conflict (slug) do nothing;
  end loop;

  -- Tours ---------------------------------------------------------------------
  for t in select * from jsonb_array_elements($json$[
    {"slug":"persepolis-naqsh-e-rustam-day-trip","dest":"shiraz","type":"single_day","minutes":540,"time":"07:30","weekdays":[2,4,5,7],
     "categories":["culture"],"transport":["van","walk"],"difficulty":"easy","activity":2,"max":12,"adult":45000000,"child":25000000,"private":160000000,
     "meet":[29.6365,52.5260],"end":[29.6365,52.5260],"rules":[{"hoursBefore":48,"refundPercent":100},{"hoursBefore":24,"refundPercent":50}],"weather":"operator_decides",
     "fa":{"title":"تخت جمشید و نقش رستم در یک روز",
       "summary":"صبح زود از شیراز راه می‌افتیم تا پیش از گرمای ظهر میان کاخ‌های هخامنشی قدم بزنیم؛ بعد آرامگاه‌های صخره‌ای شاهان در نقش رستم.",
       "description":"ساعت ۷:۳۰ از کنار باغ ارم سوار ون می‌شویم و حدود یک ساعت بعد پای پلکان تخت جمشید هستیم. راهنما شما را از دروازهٔ ملل تا کاخ آپادانا می‌برد و نقش‌برجستهٔ نمایندگان ملت‌ها را که برای نوروز هدیه می‌آوردند، یکی‌یکی معرفی می‌کند.\nپس از ناهار در یک رستوران محلی، به نقش رستم می‌رویم؛ جایی که آرامگاه داریوش و خشایارشا در دل کوه کنده شده است. حدود ساعت ۱۶:۳۰ به شیراز برمی‌گردیم.",
       "meeting_instructions":"خیابان ارم، مقابل در اصلی باغ ارم. ساعت ۷:۲۰ آنجا باشید؛ ون رأس ۷:۳۰ حرکت می‌کند. نشانی دقیق و شمارهٔ راهنما پس از تأیید رزرو برایتان ارسال می‌شود.",
       "cancellation_policy":"تا ۴۸ ساعت پیش از حرکت: بازگشت کامل مبلغ. بین ۴۸ تا ۲۴ ساعت: بازگشت نیمی از مبلغ. کمتر از ۲۴ ساعت: مبلغ بازگردانده نمی‌شود.",
       "safety_notes":"بیشتر مسیر در فضای باز و زیر آفتاب است. کفش راحت بپوشید، کلاه و آب همراه داشته باشید. پلکان تخت جمشید شیب ملایمی دارد ولی برای ویلچر مناسب نیست.",
       "highlights":"دروازهٔ ملل و گاوهای بالدار\nنقش‌برجسته‌های پلکان آپادانا\nآرامگاه‌های صخره‌ای نقش رستم\nناهار ایرانی در مرودشت",
       "inclusions":"راهنمای فارسی و انگلیسی‌زبان\nون کولردار رفت و برگشت\nبلیت ورودی تخت جمشید و نقش رستم\nناهار و آب معدنی",
       "exclusions":"انعام راهنما و راننده\nخریدهای شخصی",
       "what_to_bring":"کلاه، عینک آفتابی، کرم ضدآفتاب، کفش راحت، کارت شناسایی"},
     "en":{"title":"Persepolis & Naqsh-e Rustam day trip",
       "summary":"Leave Shiraz early to walk the Achaemenid palaces before the midday heat, then stand beneath the royal rock tombs of Naqsh-e Rustam.",
       "description":"We pick you up by Eram Garden at 07:30 and reach the great stairway of Persepolis about an hour later. Your guide walks you from the Gate of All Nations to the Apadana, reading the reliefs of delegations bringing gifts for Nowruz.\nAfter lunch at a local restaurant we drive to Naqsh-e Rustam, where the tombs of Darius and Xerxes are carved high into the cliff. Back in Shiraz around 16:30.",
       "meeting_instructions":"Eram Street, in front of the main gate of Eram Garden. Please arrive by 07:20 — the van leaves at 07:30 sharp. The exact pin and your guide's phone number arrive once your booking is confirmed.",
       "cancellation_policy":"Up to 48 hours before departure: full refund. 48–24 hours: 50% refund. Less than 24 hours: no refund.",
       "safety_notes":"Most of the day is outdoors in the sun. Wear comfortable shoes and bring a hat and water. The Persepolis stairway is gentle but not wheelchair accessible.",
       "highlights":"The Gate of All Nations and its winged bulls\nThe Apadana stairway reliefs\nThe royal rock tombs of Naqsh-e Rustam\nA Persian lunch in Marvdasht",
       "inclusions":"Persian- and English-speaking guide\nAir-conditioned van, return\nEntry tickets to Persepolis and Naqsh-e Rustam\nLunch and bottled water",
       "exclusions":"Tips for guide and driver\nPersonal purchases",
       "what_to_bring":"Hat, sunglasses, sunscreen, comfortable shoes, ID"},
     "stops":[
       {"day":1,"type":"meeting","lat":29.6365,"lng":52.5260,"time":"07:30","dur":10,"fa":"باغ ارم، شیراز","en":"Eram Garden, Shiraz"},
       {"day":1,"type":"activity","lat":29.9355,"lng":52.8916,"time":"08:45","dur":180,"fa":"تخت جمشید","en":"Persepolis"},
       {"day":1,"type":"meal","lat":29.8740,"lng":52.8030,"time":"12:00","dur":60,"fa":"ناهار در مرودشت","en":"Lunch in Marvdasht"},
       {"day":1,"type":"activity","lat":29.9886,"lng":52.8746,"time":"13:30","dur":75,"fa":"نقش رستم","en":"Naqsh-e Rustam"},
       {"day":1,"type":"finish","lat":29.6365,"lng":52.5260,"time":"16:30","dur":0,"fa":"بازگشت به باغ ارم","en":"Back at Eram Garden"}],
     "media":[
       {"key":"shiraz-persepolis","w":1600,"h":1067,"fa":"دروازهٔ ملل، تخت جمشید","en":"Gate of All Nations, Persepolis","credit":"Skot, CC BY-SA 4.0"},
       {"key":"shiraz-naqsh-e-rustam","w":1600,"h":838,"fa":"آرامگاه‌های صخره‌ای نقش رستم","en":"The rock tombs of Naqsh-e Rustam","credit":"Bernard Gagnon, CC BY-SA 4.0"},
       {"key":"shiraz-nasir-al-mulk","w":1600,"h":1238,"fa":"مسجد نصیرالملک، شیراز","en":"Nasir al-Mulk Mosque, Shiraz","credit":"Ayyoubsabawiki, CC BY-SA 4.0"}]},

    {"slug":"isfahan-naqsh-e-jahan-and-bridges-evening","dest":"isfahan","type":"single_day","minutes":270,"time":"16:00","weekdays":[1,3,5,6],
     "categories":["city","walking","culture"],"transport":["walk"],"difficulty":"easy","activity":2,"max":14,"adult":25000000,"child":12000000,"private":90000000,
     "meet":[32.6612,51.6776],"end":[32.6443,51.6676],"rules":[{"hoursBefore":24,"refundPercent":100}],"weather":"reschedule_or_refund",
     "fa":{"title":"عصر اصفهان: نقش جهان تا سی‌وسه‌پل",
       "summary":"پیاده از میدان نقش جهان و بازار قیصریه تا سی‌وسه‌پل؛ وقتی چراغ‌های پل روشن می‌شوند و آواز مردم زیر طاق‌ها می‌پیچد.",
       "description":"از سردر قیصریه شروع می‌کنیم و دور میدان نقش جهان قدم می‌زنیم: مسجد شیخ لطف‌الله با گنبد کرم‌رنگش، عالی‌قاپو و مسجد امام. راهنما فرصت می‌دهد چای و گز تازه بخورید و از کارگاه‌های قلمزنی بازار سر بزنید.\nبا غروب آفتاب از خیابان چهارباغ به سمت زاینده‌رود می‌رویم و سفر را روی سی‌وسه‌پل تمام می‌کنیم.",
       "meeting_instructions":"ضلع شمالی میدان نقش جهان، جلوی سردر بازار قیصریه، ساعت ۱۶:۰۰.",
       "cancellation_policy":"تا ۲۴ ساعت پیش از شروع: بازگشت کامل مبلغ. کمتر از ۲۴ ساعت: مبلغ بازگردانده نمی‌شود.",
       "safety_notes":"حدود ۴ کیلومتر پیاده‌روی روی سطح صاف است. در بازار شلوغ مراقب کیف و تلفن خود باشید.",
       "highlights":"میدان نقش جهان\nمسجد شیخ لطف‌الله\nبازار قیصریه و کارگاه‌های قلمزنی\nسی‌وسه‌پل در غروب",
       "inclusions":"راهنمای محلی\nبلیت مسجد شیخ لطف‌الله\nچای و گز",
       "exclusions":"شام\nخریدهای شخصی",
       "what_to_bring":"کفش راحت، شال یا روسری برای ورود به مسجد"},
     "en":{"title":"Isfahan at dusk: Naqsh-e Jahan to Si-o-se-pol",
       "summary":"Walk from Naqsh-e Jahan Square and the Qeysarieh bazaar to Si-o-se-pol, arriving as the bridge lights come on and locals sing under its arches.",
       "description":"We start at the Qeysarieh portal and circle Naqsh-e Jahan Square: the cream dome of Sheikh Lotfollah Mosque, Ali Qapu and the Shah Mosque. There's time for tea and fresh gaz, and a look into the bazaar's metal-engraving workshops.\nAs the sun sets we walk down Chaharbagh to the Zayandeh-Rud and finish on Si-o-se-pol.",
       "meeting_instructions":"North side of Naqsh-e Jahan Square, in front of the Qeysarieh bazaar portal, at 16:00.",
       "cancellation_policy":"Up to 24 hours before the start: full refund. Less than 24 hours: no refund.",
       "safety_notes":"About 4 km of walking on flat ground. Keep an eye on bags and phones in the busy bazaar.",
       "highlights":"Naqsh-e Jahan Square\nSheikh Lotfollah Mosque\nQeysarieh bazaar and engraving workshops\nSi-o-se-pol at sunset",
       "inclusions":"Local guide\nSheikh Lotfollah Mosque ticket\nTea and gaz",
       "exclusions":"Dinner\nPersonal purchases",
       "what_to_bring":"Comfortable shoes; a scarf for entering the mosque"},
     "stops":[
       {"day":1,"type":"meeting","lat":32.6612,"lng":51.6776,"time":"16:00","dur":10,"fa":"سردر قیصریه","en":"Qeysarieh portal"},
       {"day":1,"type":"activity","lat":32.6575,"lng":51.6777,"time":"16:10","dur":100,"fa":"میدان نقش جهان","en":"Naqsh-e Jahan Square"},
       {"day":1,"type":"activity","lat":32.6555,"lng":51.6716,"time":"18:00","dur":40,"fa":"خیابان چهارباغ","en":"Chaharbagh Avenue"},
       {"day":1,"type":"finish","lat":32.6443,"lng":51.6676,"time":"19:30","dur":0,"fa":"سی‌وسه‌پل","en":"Si-o-se-pol"}],
     "media":[
       {"key":"isfahan-naqsh-e-jahan","w":1600,"h":974,"fa":"میدان نقش جهان از زیر طاق قیصریه","en":"Naqsh-e Jahan Square from the Qeysarieh vault","credit":"Amir Pashaei, CC BY-SA 4.0"},
       {"key":"isfahan-si-o-se-pol","w":1600,"h":848,"fa":"سی‌وسه‌پل در شب","en":"Si-o-se-pol at night","credit":"Diego Delso, CC BY-SA 4.0"}]},

    {"slug":"yazd-old-town-and-dowlat-abad-garden","dest":"yazd","type":"single_day","minutes":300,"time":"08:00","weekdays":[2,4,6,7],
     "categories":["culture","walking"],"transport":["walk","car"],"difficulty":"easy","activity":2,"max":10,"adult":22000000,"child":11000000,"private":80000000,
     "meet":[31.8939,54.3700],"end":[31.9058,54.3546],"rules":[{"hoursBefore":24,"refundPercent":100}],"weather":"reschedule_or_refund",
     "fa":{"title":"کوچه‌های یزد و باغ دولت‌آباد",
       "summary":"صبح خنک یزد را در کوچه‌های خشتی بافت تاریخی، زیر بادگیرها و روی پشت‌بام‌ها بگذرانید و سفر را در سایهٔ سروهای باغ دولت‌آباد تمام کنید.",
       "description":"از میدان امیرچخماق راه می‌افتیم و در کوچه‌های پیچ‌درپیچ محلهٔ فهادان گم می‌شویم. راهنما نشان می‌دهد بادگیرها چطور خانه‌ها را خنک می‌کردند و از پشت‌بام یک خانهٔ قدیمی، منظرهٔ شهر را می‌بینید.\nپس از مسجد جامع با مناره‌های بلندش، با ماشین به باغ دولت‌آباد می‌رویم؛ باغی ایرانی با بلندترین بادگیر جهان.",
       "meeting_instructions":"میدان امیرچخماق، کنار حوض جلوی تکیه، ساعت ۸:۰۰.",
       "cancellation_policy":"تا ۲۴ ساعت پیش از شروع: بازگشت کامل مبلغ. کمتر از ۲۴ ساعت: مبلغ بازگردانده نمی‌شود.",
       "safety_notes":"کوچه‌ها سنگفرش و ناهموارند و چند پله تا پشت‌بام دارد. در تابستان هوا از ظهر بسیار گرم می‌شود؛ آب کافی همراه داشته باشید.",
       "highlights":"میدان امیرچخماق\nکوچه‌ها و بادگیرهای فهادان\nمسجد جامع یزد\nباغ دولت‌آباد",
       "inclusions":"راهنمای محلی\nبلیت مسجد جامع و باغ دولت‌آباد\nجابه‌جایی تا باغ",
       "exclusions":"ناهار\nخریدهای شخصی",
       "what_to_bring":"کفش راحت، کلاه، آب"},
     "en":{"title":"Yazd old town & Dowlat Abad Garden",
       "summary":"Spend Yazd's cool morning in the mud-brick lanes of the old town, under the windcatchers and up on the rooftops, then finish in the cypress shade of Dowlat Abad Garden.",
       "description":"We set off from Amir Chakhmaq Square and lose ourselves in the winding lanes of Fahadan. Your guide shows how windcatchers cooled houses, and you'll see the city from the roof of an old home.\nAfter the Jameh Mosque and its tall minarets we drive to Dowlat Abad, a Persian garden with the world's tallest windcatcher.",
       "meeting_instructions":"Amir Chakhmaq Square, by the pool in front of the Tekyeh, at 08:00.",
       "cancellation_policy":"Up to 24 hours before the start: full refund. Less than 24 hours: no refund.",
       "safety_notes":"The lanes are cobbled and uneven, with some stairs up to a rooftop. Summer afternoons get very hot — bring plenty of water.",
       "highlights":"Amir Chakhmaq Square\nThe lanes and windcatchers of Fahadan\nYazd Jameh Mosque\nDowlat Abad Garden",
       "inclusions":"Local guide\nJameh Mosque and Dowlat Abad tickets\nTransfer to the garden",
       "exclusions":"Lunch\nPersonal purchases",
       "what_to_bring":"Comfortable shoes, hat, water"},
     "stops":[
       {"day":1,"type":"meeting","lat":31.8939,"lng":54.3700,"time":"08:00","dur":15,"fa":"میدان امیرچخماق","en":"Amir Chakhmaq Square"},
       {"day":1,"type":"activity","lat":31.9030,"lng":54.3690,"time":"08:20","dur":90,"fa":"محلهٔ فهادان","en":"Fahadan quarter"},
       {"day":1,"type":"activity","lat":31.9017,"lng":54.3687,"time":"10:00","dur":40,"fa":"مسجد جامع یزد","en":"Yazd Jameh Mosque"},
       {"day":1,"type":"finish","lat":31.9058,"lng":54.3546,"time":"11:00","dur":60,"fa":"باغ دولت‌آباد","en":"Dowlat Abad Garden"}],
     "media":[
       {"key":"yazd-windcatchers","w":1600,"h":1200,"fa":"بادگیرهای یزد","en":"Windcatchers of Yazd","credit":"Alireza Javaheri, CC BY 3.0"},
       {"key":"yazd-dolat-abad","w":1600,"h":1067,"fa":"باغ دولت‌آباد","en":"Dowlat Abad Garden","credit":"Diego Delso, CC BY-SA 4.0"}]},

    {"slug":"kish-island-beaches-and-sunset","dest":"kish","type":"single_day","minutes":240,"time":"15:00","weekdays":[1,2,3,4,5,6,7],
     "categories":["nature"],"transport":["van","walk"],"difficulty":"easy","activity":1,"max":12,"adult":30000000,"child":15000000,"private":110000000,
     "meet":[26.5326,53.9800],"end":[26.5650,53.9036],"rules":[{"hoursBefore":24,"refundPercent":100},{"hoursBefore":6,"refundPercent":50}],"weather":"full_refund",
     "fa":{"title":"کیش: ساحل‌ها تا غروب کشتی یونانی",
       "summary":"بعدازظهری آرام دور جزیره: شنای کوتاه در ساحل مرجان، قدم زدن کنار آب فیروزه‌ای و تماشای غروب کنار کشتی یونانی.",
       "description":"ساعت ۱۵ از هتل یا ساحل مرجان سوارتان می‌کنیم. اول در ساحل مرجان فرصت شنا و آفتاب دارید، بعد در جادهٔ ساحلی جزیره می‌گردیم و از شهر باستانی حریره سر می‌زنیم.\nسفر کنار کشتی یونانی تمام می‌شود؛ جایی که غروب خورشید پشت بدنهٔ کشتی، دیدنی‌ترین منظرهٔ کیش است.",
       "meeting_instructions":"اگر در هتل اقامت دارید، نام هتل را هنگام رزرو بنویسید؛ وگرنه ساعت ۱۵:۰۰ ورودی ساحل مرجان.",
       "cancellation_policy":"تا ۲۴ ساعت پیش از شروع: بازگشت کامل مبلغ. بین ۲۴ تا ۶ ساعت: بازگشت نیمی از مبلغ. کمتر از ۶ ساعت: مبلغ بازگردانده نمی‌شود. اگر هوا اجازهٔ برگزاری ندهد، کل مبلغ بازگردانده می‌شود.",
       "safety_notes":"شنا فقط در محدودهٔ مجاز و با حضور ناجی. آفتاب جنوب حتی در زمستان تند است؛ کرم ضدآفتاب فراموش نشود.",
       "highlights":"ساحل مرجان\nشهر باستانی حریره\nغروب کنار کشتی یونانی",
       "inclusions":"راهنمای محلی\nون کولردار با سوار کردن از هتل\nآب و میوهٔ خنک",
       "exclusions":"اجارهٔ وسایل ورزش‌های آبی\nشام",
       "what_to_bring":"لباس شنا، حوله، کرم ضدآفتاب، دمپایی"},
     "en":{"title":"Kish: beaches to the Greek Ship sunset",
       "summary":"A slow afternoon around the island: a swim at Marjan Beach, a stroll by the turquoise water and sunset beside the Greek Ship.",
       "description":"We collect you from your hotel or Marjan Beach at 15:00. First there's time to swim and sunbathe at Marjan Beach, then we follow the coastal road and stop at the ancient town of Harireh.\nWe finish at the Greek Ship, where the sun setting behind the wreck is the island's most famous view.",
       "meeting_instructions":"If you're staying at a hotel, add its name when you book; otherwise meet at the Marjan Beach entrance at 15:00.",
       "cancellation_policy":"Up to 24 hours before the start: full refund. 24–6 hours: 50% refund. Less than 6 hours: no refund. If the weather stops the tour, you get a full refund.",
       "safety_notes":"Swim only in marked areas with a lifeguard present. The southern sun is strong even in winter — don't forget sunscreen.",
       "highlights":"Marjan Beach\nAncient Harireh\nSunset at the Greek Ship",
       "inclusions":"Local guide\nAir-conditioned van with hotel pickup\nWater and chilled fruit",
       "exclusions":"Water-sports equipment rental\nDinner",
       "what_to_bring":"Swimwear, towel, sunscreen, sandals"},
     "stops":[
       {"day":1,"type":"meeting","lat":26.5326,"lng":53.9800,"time":"15:00","dur":10,"fa":"ساحل مرجان","en":"Marjan Beach"},
       {"day":1,"type":"activity","lat":26.5326,"lng":53.9800,"time":"15:10","dur":80,"fa":"شنا و آفتاب در ساحل مرجان","en":"Swim and sunbathe at Marjan Beach"},
       {"day":1,"type":"activity","lat":26.5560,"lng":53.9580,"time":"16:45","dur":40,"fa":"شهر باستانی حریره","en":"Ancient Harireh"},
       {"day":1,"type":"finish","lat":26.5650,"lng":53.9036,"time":"17:45","dur":60,"fa":"غروب کنار کشتی یونانی","en":"Sunset at the Greek Ship"}],
     "media":[
       {"key":"kish-beach","w":1600,"h":1200,"fa":"ساحل شنی جزیرهٔ کیش","en":"Sandy beach on Kish Island","credit":"Ivan Mlinaric, CC BY 2.0"}]}
  ]$json$::jsonb)
  loop
    v_tour := pg_temp.seed_uuid('tour:' || (t->>'slug'));
    if exists (select 1 from tour.tours where id = v_tour or slug = t->>'slug') then
      continue;
    end if;
    select id into v_dest from tour.destinations where slug = t->>'dest';

    insert into tour.tours (id, service_provider_id, destination_id, slug, status, tour_type, category_codes, transport_modes, difficulty, activity_level,
                            duration_minutes, duration_days, nights, min_participants, max_participants, guide_languages, confirmation_mode,
                            request_timeout_hours, booking_cutoff_minutes, timezone, currency_code, meeting_lat, meeting_lng, end_lat, end_lng,
                            location_privacy, private_available, family_friendly, source_locale, is_featured)
    values (v_tour, v_provider, v_dest, t->>'slug', 'draft', t->>'type',
            array(select jsonb_array_elements_text(t->'categories')), array(select jsonb_array_elements_text(t->'transport')),
            t->>'difficulty', (t->>'activity')::smallint, (t->>'minutes')::int, 1, 0, 1, (t->>'max')::int, array['fa','en'], 'request',
            24, 720, 'Asia/Tehran', 'IRR', (t->'meet'->>0)::numeric, (t->'meet'->>1)::numeric, (t->'end'->>0)::numeric, (t->'end'->>1)::numeric,
            'approximate', true, true, 'fa-IR', true);

    -- Source (fa-IR) first so the freshness trigger has nothing to mark outdated, then the English translation.
    for f in select key, value from jsonb_each_text(t->'fa') loop
      perform pg_temp.seed_text(v_tour, 'tour', v_tour, f.key, 'fa-IR', f.value, true);
    end loop;
    for f in select key, value from jsonb_each_text(t->'en') loop
      perform pg_temp.seed_text(v_tour, 'tour', v_tour, f.key, 'en-US', f.value, false);
    end loop;

    v_i := 0;
    for m in select * from jsonb_array_elements(t->'media') loop
      insert into tour.media (id, tour_id, kind, url, thumbnail_url, sort_order, is_cover, width, height, mime_type,
                              alt_translations, caption_translations, moderation_status)
      values (pg_temp.seed_uuid('media:' || (t->>'slug') || ':' || v_i), v_tour, 'image',
              '/images/tours/' || (m->>'key') || '.webp', '/images/tours/' || (m->>'key') || '-sm.webp', v_i, v_i = 0,
              (m->>'w')::int, (m->>'h')::int, 'image/webp',
              jsonb_build_object('fa-IR', m->>'fa', 'en-US', m->>'en'),
              jsonb_build_object('fa-IR', (m->>'fa') || ' — عکس: ' || (m->>'credit'), 'en-US', (m->>'en') || ' — Photo: ' || (m->>'credit')),
              'approved');
      v_i := v_i + 1;
    end loop;

    v_pos := 0; v_prev_day := 0;
    for s in select * from jsonb_array_elements(t->'stops') loop
      v_day := (s->>'day')::int;
      v_pos := case when v_day = v_prev_day then v_pos + 1 else 1 end;
      v_prev_day := v_day;
      v_stop := pg_temp.seed_uuid('stop:' || (t->>'slug') || ':' || v_day || ':' || v_pos);
      insert into tour.itinerary_stops (id, tour_id, day_number, position, stop_type, latitude, longitude, location_exact, start_time, duration_minutes, transport_mode)
      values (v_stop, v_tour, v_day, v_pos, s->>'type', (s->>'lat')::numeric, (s->>'lng')::numeric, false, (s->>'time')::time, (s->>'dur')::int,
              (t->'transport'->>0));
      perform pg_temp.seed_text(v_tour, 'stop', v_stop, 'title', 'fa-IR', s->>'fa', true);
      perform pg_temp.seed_text(v_tour, 'stop', v_stop, 'title', 'en-US', s->>'en', false);
    end loop;

    v_opt := pg_temp.seed_uuid('option:' || (t->>'slug') || ':standard');
    insert into tour.options (id, tour_id, code, kind, min_group, max_group, sort_order)
    values (v_opt, v_tour, 'standard', 'public', 1, (t->>'max')::int, 0);
    insert into tour.price_tiers (id, option_id, traveler_class, amount, max_age)
    values (pg_temp.seed_uuid('tier:' || (t->>'slug') || ':adult'), v_opt, 'adult', (t->>'adult')::numeric, null),
           (pg_temp.seed_uuid('tier:' || (t->>'slug') || ':child'), v_opt, 'child', (t->>'child')::numeric, 11);
    insert into tour.options (id, tour_id, code, kind, min_group, max_group, private_group_price, sort_order)
    values (pg_temp.seed_uuid('option:' || (t->>'slug') || ':private'), v_tour, 'private', 'private', 1, 6, (t->>'private')::numeric, 1);

    insert into tour.policy_versions (id, tour_id, version, cancellation_rules, weather_policy, late_arrival_minutes, texts)
    values (pg_temp.seed_uuid('policy:' || (t->>'slug') || ':1'), v_tour, 1, t->'rules', t->>'weather', 15,
            jsonb_build_object(
              'fa-IR', jsonb_build_object('cancellation', t->'fa'->>'cancellation_policy', 'rules', t->'fa'->>'safety_notes'),
              'en-US', jsonb_build_object('cancellation', t->'en'->>'cancellation_policy', 'rules', t->'en'->>'safety_notes')));

    update tour.tours
       set current_policy_version = 1, from_price = (t->>'adult')::numeric
     where id = v_tour;

    perform tour.ensure_booking_anchor(v_tour);

    -- Weekly schedule + 120 days of departures (the portal's "materialize" extends it later).
    v_rule := pg_temp.seed_uuid('rule:' || (t->>'slug'));
    insert into tour.schedule_rules (id, tour_id, option_id, calendar, kind, weekdays, local_time, start_date, capacity)
    values (v_rule, v_tour, null, 'gregory', 'weekly', array(select jsonb_array_elements_text(t->'weekdays')::smallint),
            (t->>'time')::time, (now() at time zone 'Asia/Tehran')::date, (t->>'max')::int);

    insert into tour.departures (id, tour_id, option_id, schedule_rule_id, service_provider_id, provider_service_id,
                                 starts_on, ends_on, local_start_time, timezone, capacity)
    select pg_temp.seed_uuid('departure:' || (t->>'slug') || ':' || day::date), v_tour, null, v_rule, tt.service_provider_id, tt.provider_service_id,
           day::date, day::date, (t->>'time')::time, 'Asia/Tehran', (t->>'max')::int
      from tour.tours tt,
           generate_series((now() at time zone 'Asia/Tehran')::date + 2, (now() at time zone 'Asia/Tehran')::date + 120, interval '1 day') day
     where tt.id = v_tour
       and extract(isodow from day)::int in (select jsonb_array_elements_text(t->'weekdays')::int);

    if exists (select 1 from tour.publish_requirements(v_tour) r where r.severity = 'error') then
      raise exception 'TOURS_SEED_NOT_PUBLISHABLE % %', t->>'slug',
        (select string_agg(r.code || coalesce(':' || r.detail, ''), ', ') from tour.publish_requirements(v_tour) r where r.severity = 'error');
    end if;

    update tour.tours
       set status = 'published', published_at = now(), approved_at = now(), published_revision = draft_revision,
           attributes_verified_at = now()
     where id = v_tour;
    perform tour.ensure_booking_anchor(v_tour);
    perform tour.refresh_search_text(v_tour);
  end loop;
end
$seed$;
