-- ---------------------------------------------------------------------------
-- 0026_shop_delivery_i18n.sql  (SHP-I18N-002)
--
-- Backfills fa/ar translations on delivery methods that were created with an
-- English-only `name_translations` (so the checkout "روش ارسال" list renders
-- localized). Only touches a row when the fa key is missing/blank, and only for
-- the well-known codes — a custom method keeps whatever the admin set.
-- ---------------------------------------------------------------------------
set search_path = public;

do $$
declare r record;
begin
  if to_regclass('shop.delivery_methods') is null then return; end if;

  for r in
    select * from (values
      ('standard',
        '{"en":"Standard delivery","fa":"ارسال عادی","ar":"توصيل قياسي"}'::jsonb,
        '{"en":"Delivered in 3-6 business days","fa":"تحویل در ۳ تا ۶ روز کاری","ar":"التوصيل خلال 3-6 أيام عمل"}'::jsonb),
      ('express',
        '{"en":"Express delivery","fa":"ارسال سریع","ar":"توصيل سريع"}'::jsonb,
        '{"en":"Delivered in 1-2 business days","fa":"تحویل در ۱ تا ۲ روز کاری","ar":"التوصيل خلال 1-2 يوم عمل"}'::jsonb),
      ('economy',
        '{"en":"Economy delivery","fa":"ارسال اقتصادی","ar":"توصيل اقتصادي"}'::jsonb,
        '{"en":"Delivered in 5-10 business days","fa":"تحویل در ۵ تا ۱۰ روز کاری","ar":"التوصيل خلال 5-10 أيام عمل"}'::jsonb),
      ('same_day',
        '{"en":"Same-day delivery","fa":"ارسال همان روز","ar":"توصيل في نفس اليوم"}'::jsonb,
        '{"en":"Ordered before noon, delivered today","fa":"سفارش تا پیش از ظهر، تحویل همان روز","ar":"الطلب قبل الظهر، التوصيل اليوم"}'::jsonb),
      ('pickup',
        '{"en":"Store pickup","fa":"تحویل حضوری","ar":"الاستلام من المتجر"}'::jsonb,
        '{"en":"Collect from our location","fa":"دریافت از محل ما","ar":"الاستلام من موقعنا"}'::jsonb),
      ('courier',
        '{"en":"Courier","fa":"پیک","ar":"مندوب"}'::jsonb,
        '{"en":"On-demand courier","fa":"پیک درخواستی","ar":"مندوب عند الطلب"}'::jsonb)
    ) as t(code, name_t, desc_t)
  loop
    update shop.delivery_methods
    set name_translations = name_translations || r.name_t,
        description_translations = description_translations || r.desc_t,
        last_modified_date = now()
    where code = r.code
      and coalesce(nullif(trim(name_translations->>'fa'), ''), '') = '';
  end loop;

  raise notice '0026: delivery method translations backfilled';
end $$;
