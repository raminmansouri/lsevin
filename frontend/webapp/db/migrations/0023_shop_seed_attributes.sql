-- ---------------------------------------------------------------------------
-- 0023_shop_seed_attributes.sql
--
-- Production-safe, idempotent: a small set of spec attributes so the attribute
-- admin (SHP-ADM-007) and product spec facets are usable out of the box.
-- Stable ids + WHERE NOT EXISTS; only adds rows.
--
--   attribute  44444444-0000-4000-8000-0000000000a1 .. a3
-- ---------------------------------------------------------------------------
set search_path = public;

do $$
declare
  v_material uuid := '44444444-0000-4000-8000-0000000000a1';
  v_cert     uuid := '44444444-0000-4000-8000-0000000000a2';
  v_power    uuid := '44444444-0000-4000-8000-0000000000a3';
begin
  if to_regclass('shop.attributes') is null then
    raise notice '0023: shop.attributes not present — skipping';
    return;
  end if;

  insert into shop.attributes (id, name_translations, slug, display_type, is_variant_defining) values
    (v_material, '{"en":"Material","fa":"جنس","ar":"المادة"}'::jsonb, 'material', 'select', false),
    (v_cert,     '{"en":"Certification","fa":"گواهی","ar":"الشهادة"}'::jsonb, 'certification', 'select', false),
    (v_power,    '{"en":"Power source","fa":"منبع تغذیه","ar":"مصدر الطاقة"}'::jsonb, 'power-source', 'select', false)
  on conflict (id) do nothing;

  insert into shop.attribute_values (attribute_id, value, display_name_translations)
  select x.aid, x.val, x.label::jsonb
  from (values
    (v_material, 'silicone',       '{"en":"Silicone","fa":"سیلیکون","ar":"سيليكون"}'),
    (v_material, 'stainless-steel', '{"en":"Stainless steel","fa":"استیل ضدزنگ","ar":"ستانلس ستيل"}'),
    (v_material, 'abs-plastic',     '{"en":"ABS plastic","fa":"پلاستیک ABS","ar":"بلاستيك ABS"}'),
    (v_material, 'cotton',          '{"en":"Cotton","fa":"پنبه","ar":"قطن"}'),
    (v_cert,     'ce',             '{"en":"CE","fa":"CE","ar":"CE"}'),
    (v_cert,     'iso-13485',      '{"en":"ISO 13485","fa":"ISO 13485","ar":"ISO 13485"}'),
    (v_cert,     'fda-listed',     '{"en":"FDA listed","fa":"ثبت FDA","ar":"مدرج لدى FDA"}'),
    (v_power,    'battery',        '{"en":"Battery","fa":"باتری","ar":"بطارية"}'),
    (v_power,    'usb-c',          '{"en":"USB-C rechargeable","fa":"شارژ USB-C","ar":"USB-C قابل للشحن"}'),
    (v_power,    'mains',          '{"en":"Mains power","fa":"برق شهری","ar":"تيار كهربائي"}')
  ) as x(aid, val, label)
  where not exists (
    select 1 from shop.attribute_values av where av.attribute_id = x.aid and av.value = x.val
  );

  -- Attach the spec attributes to the healthcare catalogue (0022) where relevant.
  insert into shop.product_attributes (product_id, attribute_id, is_required, display_order)
  select p.id, v_cert, false, 1
  from shop.products p
  where p.id::text like '44444444-0000-4000-8000-00000000d0%'
  on conflict (product_id, attribute_id) do nothing;

  insert into shop.product_attributes (product_id, attribute_id, is_required, display_order)
  select p.id, v_power, false, 2
  from shop.products p
  where p.slug in ('portable-mesh-nebulizer','sonic-electric-toothbrush','led-facial-cleansing-brush',
                   'digital-blood-pressure-monitor','fingertip-pulse-oximeter','infrared-forehead-thermometer')
  on conflict (product_id, attribute_id) do nothing;

  raise notice '0023: attribute seed applied';
end $$;
