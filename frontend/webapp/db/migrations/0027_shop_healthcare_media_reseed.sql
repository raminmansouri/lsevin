-- ---------------------------------------------------------------------------
-- 0027_shop_healthcare_media_reseed.sql
--
-- Defensive re-seed: if the `shop.product_media` insert in 0022 did not land on
-- an environment (partial apply, older dump), re-attach a primary image to any
-- healthcare catalogue product (0022 ids) that currently has none. Idempotent —
-- guarded by `not exists`, so it is a no-op once media is present.
-- ---------------------------------------------------------------------------
set search_path = public;

do $$
begin
  if to_regclass('shop.product_media') is null then return; end if;

  insert into shop.product_media (id, product_id, url, media_type, alt_translations, display_order, is_primary)
  select gen_random_uuid(), p.id, v.url, 'image', p.name_translations, 0, true
  from shop.products p
  join (values
    ('44444444-0000-4000-8000-00000000d001'::uuid, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d002'::uuid, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d003'::uuid, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d004'::uuid, 'https://images.unsplash.com/photo-1631563019676-dade0dbdb8f6?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d005'::uuid, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d006'::uuid, 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d007'::uuid, 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d008'::uuid, 'https://images.unsplash.com/photo-1605845328644-9db0d4f5e5a3?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d009'::uuid, 'https://images.unsplash.com/photo-1620065692460-a2f7a1f9a0f0?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d010'::uuid, 'https://images.unsplash.com/photo-1576765607924-3f7b8410a787?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d011'::uuid, 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d012'::uuid, 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d013'::uuid, 'https://images.unsplash.com/photo-1559591937-abc3e5b3f0e5?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d014'::uuid, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d015'::uuid, 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d016'::uuid, 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d017'::uuid, 'https://images.unsplash.com/photo-1607619662634-3ac55ada4a20?w=600&q=80'),
    ('44444444-0000-4000-8000-00000000d018'::uuid, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80')
  ) as v(product_id, url) on v.product_id = p.id
  where not exists (select 1 from shop.product_media m where m.product_id = p.id);

  raise notice '0027: healthcare media re-seed checked';
end $$;
