
      WITH params AS (
        SELECT
          NULLIF(BTRIM(${term}::text), '') AS q,
          ${likeTerm}::text AS like_q,
          ${normalizedLocale}::text AS locale,
          ${categoryId}::uuid AS category_id,
          ${providerTypeId}::uuid AS provider_type_id,
          NULLIF(BTRIM(${country}::text), '') AS country,
          NULLIF(BTRIM(${city}::text), '') AS city,
          -- Built once instead of re-parsed for every row it is compared against.
          plainto_tsquery('simple', NULLIF(BTRIM(${term}::text), '')) AS tsq
      ),
      service_results AS (
        SELECT
          ps.id::text AS id,
          'service'::text AS type,
          COALESCE(
            NULLIF(common.get_translation_t(ps.display_name_translations, params.locale, 'en-US'), ''),
            common.get_translation_t(sd.name_translations, params.locale, 'en-US')
          ) AS name,
          common.get_translation_t(sp.name_translations, params.locale, 'en-US') AS provider,
          BTRIM(split_part(ps.image_url, ',', 1)) AS image_1,
          BTRIM(split_part(sp.image_url, ',', 1)) AS image_2,
          BTRIM(split_part(c.image_url, ',', 1)) AS image_3,
          ps.id AS gallery_owner,
          NULL::uuid AS currency_owner,
          CONCAT_WS(', ', NULLIF(BTRIM(sp.city), ''), NULLIF(BTRIM(sp.country), '')) AS location,
          COALESCE(ps.rating, sp.rating, 0)::float8 AS rating,
          COALESCE(ps.review_count, sp.review_count, 0)::int AS reviews,
          ps.value::float8 AS price,
          NULL::float8 AS original_price,
          ps.currency AS currency,
          ps.value_toman::float8 AS value_toman,
          COALESCE(sp.accredited, false) AS verified,
          COALESCE(ps.tags, sp.specialties, ARRAY[]::text[]) AS specialties,
          ARRAY_REMOVE(ARRAY[
            NULLIF(common.get_translation_t(c.name_translations, params.locale, 'en-US'), ''),
            NULLIF(common.get_translation_t(pt.name_translations, params.locale, 'en-US'), ''),
            CASE WHEN sp.is_sponsored THEN COALESCE(NULLIF(BTRIM(sp.sponsored_tag), ''), ${labels.sponsored}) END,
            CASE WHEN sp.accredited THEN ${labels.verified} END
          ], NULL) AS tags,
          CONCAT('/n/app/mobile/service/', ps.id::text) AS href,
          (
            CASE WHEN params.q IS NULL THEN 0 ELSE
              ts_rank_cd(
                COALESCE(ps.search_vector, to_tsvector('simple', COALESCE(common.get_translation_t(ps.display_name_translations, params.locale, 'en-US'), ''))),
                params.tsq
              )
            END
            + COALESCE(ps.trending_score, 0)::float8 / 100
            + COALESCE(ps.rating, sp.rating, 0)::float8 / 10
          ) AS rank_score
        FROM category.provider_services ps
        JOIN category.service_definitions sd ON sd.id = ps.service_definition_id
        JOIN category.categories c ON c.id = sd.category_id
        JOIN category.service_providers sp ON sp.id = ps.service_provider_id
        JOIN category.provider_types pt ON pt.id = sp.provider_type_id
        CROSS JOIN params
        WHERE ps.is_active = true
          AND sd.is_active = true
          AND c.is_active = true
          AND sp.is_active = true
          AND (params.category_id IS NULL OR c.id = params.category_id)
          AND (params.provider_type_id IS NULL OR pt.id = params.provider_type_id)
          AND (params.country IS NULL OR lower(sp.country) = lower(params.country))
          AND (params.city IS NULL OR lower(sp.city) = lower(params.city))
          -- Same branches as before, cheapest first: OR short-circuits, so a row
          -- that matches the tsvector never pays for the jsonb expansion below.
          AND (
            params.q IS NULL
            OR COALESCE(ps.search_vector, to_tsvector('simple', '')) @@ params.tsq
            OR COALESCE(sp.search_vector, to_tsvector('simple', '')) @@ params.tsq
            OR ps.search_text ILIKE params.like_q
            OR sp.search_text ILIKE params.like_q
            OR sd.name_translations::text ILIKE params.like_q
            OR sd.description_translations::text ILIKE params.like_q
            OR c.name_translations::text ILIKE params.like_q
            OR c.description_translations::text ILIKE params.like_q
            OR EXISTS (
              SELECT 1 FROM unnest(COALESCE(ps.tags, sp.specialties, ARRAY[]::text[])) AS tag
              WHERE tag ILIKE params.like_q
            )
          )
      ),
      provider_results AS (
        SELECT
          sp.id::text AS id,
          'provider'::text AS type,
          common.get_translation_t(sp.name_translations, params.locale, 'en-US') AS name,
          common.get_translation_t(pt.name_translations, params.locale, 'en-US') AS provider,
          BTRIM(split_part(sp.image_url, ',', 1)) AS image_1,
          NULL::text AS image_2,
          NULL::text AS image_3,
          sp.id AS gallery_owner,
          NULL::uuid AS currency_owner,
          CONCAT_WS(', ', NULLIF(BTRIM(sp.city), ''), NULLIF(BTRIM(sp.country), '')) AS location,
          COALESCE(sp.rating, 0)::float8 AS rating,
          COALESCE(sp.review_count, 0)::int AS reviews,
          COALESCE(min_service.minimum_price, 0)::float8 AS price,
          NULL::float8 AS original_price,
          COALESCE(min_service.currency, 'USD') AS currency,
          min_service.value_toman::float8 AS value_toman,
          COALESCE(sp.accredited, false) AS verified,
          COALESCE(sp.specialties, ARRAY[]::text[]) AS specialties,
          ARRAY_REMOVE(ARRAY[
            NULLIF(common.get_translation_t(pt.name_translations, params.locale, 'en-US'), ''),
            CASE WHEN sp.is_sponsored THEN COALESCE(NULLIF(BTRIM(sp.sponsored_tag), ''), ${labels.sponsored}) END,
            CASE WHEN sp.accredited THEN ${labels.verified} END
          ], NULL) AS tags,
          CONCAT('/n/app/mobile/provider/', sp.id::text) AS href,
          (
            CASE WHEN params.q IS NULL THEN 0 ELSE
              ts_rank_cd(
                COALESCE(sp.search_vector, to_tsvector('simple', COALESCE(common.get_translation_t(sp.name_translations, params.locale, 'en-US'), ''))),
                params.tsq
              )
            END
            + COALESCE(sp.featured_score, 0)::float8 / 100
            + COALESCE(sp.rating, 0)::float8 / 10
          ) AS rank_score
        FROM category.service_providers sp
        JOIN category.provider_types pt ON pt.id = sp.provider_type_id
        CROSS JOIN params
        LEFT JOIN LATERAL (
          SELECT ps.value AS minimum_price, ps.currency, ps.value_toman
          FROM category.provider_services ps
          JOIN category.service_definitions sd ON sd.id = ps.service_definition_id
          WHERE ps.service_provider_id = sp.id
            AND ps.is_active = true
            AND sd.is_active = true
            AND (params.category_id IS NULL OR sd.category_id = params.category_id)
          ORDER BY ps.value ASC NULLS LAST
          LIMIT 1
        ) min_service ON true
        WHERE sp.is_active = true
          AND (params.provider_type_id IS NULL OR pt.id = params.provider_type_id)
          AND (params.country IS NULL OR lower(sp.country) = lower(params.country))
          AND (params.city IS NULL OR lower(sp.city) = lower(params.city))
          AND min_service.minimum_price IS NOT NULL
          AND (
            params.q IS NULL
            OR COALESCE(sp.search_vector, to_tsvector('simple', '')) @@ params.tsq
            OR sp.search_text ILIKE params.like_q
            OR pt.name_translations::text ILIKE params.like_q
            OR pt.description_translations::text ILIKE params.like_q
            OR EXISTS (
              SELECT 1 FROM unnest(COALESCE(sp.specialties, ARRAY[]::text[])) AS specialty
              WHERE specialty ILIKE params.like_q
            )
          )
      ),
      specialist_results AS (
        SELECT
          staff.id::text AS id,
          'specialist'::text AS type,
          common.get_translation_t(staff.name_translations, params.locale, 'en-US') AS name,
          common.get_translation_t(sp.name_translations, params.locale, 'en-US') AS provider,
          NULLIF(BTRIM(staff.profile_image_url), '') AS image_1,
          NULL::text AS image_2,
          NULL::text AS image_3,
          staff.id AS gallery_owner,
          sp.id AS currency_owner,
          CONCAT_WS(', ', NULLIF(BTRIM(sp.city), ''), NULLIF(BTRIM(sp.country), '')) AS location,
          COALESCE(staff.rating, 0)::float8 AS rating,
          COALESCE(staff.review_count, 0)::int AS reviews,
          COALESCE(staff.consultation_fee, 0)::float8 AS price,
          NULL::float8 AS original_price,
          NULL::text AS currency,
          NULL::float8 AS value_toman,
          true AS verified,
          ARRAY_REMOVE(ARRAY[NULLIF(COALESCE(staff.specialty, common.get_translation_t(staff.specialty_translations, params.locale, 'en-US')), '')], NULL) AS specialties,
          ARRAY_REMOVE(ARRAY[
            NULLIF(common.get_translation_t(staff.title_translations, params.locale, 'en-US'), ''),
            NULLIF(common.get_translation_t(sp.name_translations, params.locale, 'en-US'), '')
          ], NULL) AS tags,
          CONCAT('/n/app/mobile/specialist/', staff.id::text) AS href,
          (COALESCE(staff.rating, 0)::float8 / 10) AS rank_score
        FROM category.staff staff
        JOIN category.provider_staffs psf ON psf.staff_id = staff.id AND psf.is_active = true
        JOIN category.service_providers sp ON sp.id = psf.service_provider_id AND sp.is_active = true
        JOIN category.provider_types pt ON pt.id = sp.provider_type_id
        CROSS JOIN params
        WHERE staff.is_active = true
          AND (params.provider_type_id IS NULL OR pt.id = params.provider_type_id)
          AND (params.country IS NULL OR lower(sp.country) = lower(params.country))
          AND (params.city IS NULL OR lower(sp.city) = lower(params.city))
          AND (
            params.q IS NULL
            OR staff.specialty ILIKE params.like_q
            OR staff.name_translations::text ILIKE params.like_q
            OR staff.title_translations::text ILIKE params.like_q
            OR staff.biography_translations::text ILIKE params.like_q
            OR staff.specialty_translations::text ILIKE params.like_q
            OR sp.search_text ILIKE params.like_q
          )
      ),
      ranked AS (
        SELECT *
        FROM (
          SELECT * FROM service_results
          UNION ALL
          SELECT * FROM provider_results
          UNION ALL
          SELECT * FROM specialist_results
        ) results
        ORDER BY rank_score DESC, rating DESC NULLS LAST, reviews DESC NULLS LAST, name ASC
        LIMIT ${limit}
      )
      SELECT
        r.id,
        r.type,
        r.name,
        r.provider,
        COALESCE(
          CASE
            WHEN r.image_1 ~* ${uuidPattern} THEN NULLIF(BTRIM(media_1.file_url), '')
            ELSE NULLIF(r.image_1, '')
          END,
          -- A service falls back to its own gallery before the provider's and
          -- the category's picture; a provider and a specialist have nothing
          -- between their own column and their gallery, so the two NULL image
          -- slots below keep the gallery in last place for them.
          CASE WHEN r.type = 'service' THEN service_gallery.url END,
          CASE
            WHEN r.image_2 ~* ${uuidPattern} THEN NULLIF(BTRIM(media_2.file_url), '')
            ELSE NULLIF(r.image_2, '')
          END,
          CASE
            WHEN r.image_3 ~* ${uuidPattern} THEN NULLIF(BTRIM(media_3.file_url), '')
            ELSE NULLIF(r.image_3, '')
          END,
          COALESCE(provider_gallery.url, staff_gallery.url)
        ) AS image,
        r.location,
        r.rating,
        r.reviews,
        r.price,
        r.original_price,
        COALESCE(r.currency, specialist_currency.currency, 'USD') AS currency,
        r.value_toman,
        r.verified,
        r.specialties,
        r.tags,
        r.href,
        r.rank_score
      FROM ranked r
      CROSS JOIN params
      LEFT JOIN media.media_library media_1
        ON media_1.id = CASE WHEN r.image_1 ~* ${uuidPattern} THEN r.image_1::uuid ELSE NULL END
      LEFT JOIN media.media_library media_2
        ON media_2.id = CASE WHEN r.image_2 ~* ${uuidPattern} THEN r.image_2::uuid ELSE NULL END
      LEFT JOIN media.media_library media_3
        ON media_3.id = CASE WHEN r.image_3 ~* ${uuidPattern} THEN r.image_3::uuid ELSE NULL END
      LEFT JOIN LATERAL (
        SELECT COALESCE(
          NULLIF(BTRIM(gml.file_url), ''),
          CASE
            WHEN BTRIM(split_part(psgi.url, ',', 1)) ~* ${uuidPattern} THEN NULL
            ELSE NULLIF(BTRIM(split_part(psgi.url, ',', 1)), '')
          END
        ) AS url
        FROM category.provider_service_gallery_items psgi
        LEFT JOIN media.media_library gml
          ON gml.id = CASE
            WHEN BTRIM(split_part(psgi.url, ',', 1)) ~* ${uuidPattern}
            THEN BTRIM(split_part(psgi.url, ',', 1))::uuid
            ELSE NULL
          END
        WHERE r.type = 'service'
          AND psgi.provider_service_id = r.gallery_owner
        ORDER BY psgi.is_primary DESC, psgi.display_order ASC, psgi.create_date DESC
        LIMIT 1
      ) service_gallery ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(
          NULLIF(BTRIM(pgml.file_url), ''),
          CASE
            WHEN BTRIM(split_part(pgi.url, ',', 1)) ~* ${uuidPattern} THEN NULL
            ELSE NULLIF(BTRIM(split_part(pgi.url, ',', 1)), '')
          END
        ) AS url
        FROM category.provider_gallery_items pgi
        LEFT JOIN media.media_library pgml
          ON pgml.id = CASE
            WHEN BTRIM(split_part(pgi.url, ',', 1)) ~* ${uuidPattern}
            THEN BTRIM(split_part(pgi.url, ',', 1))::uuid
            ELSE NULL
          END
        WHERE r.type = 'provider'
          AND pgi.service_provider_id = r.gallery_owner
        ORDER BY pgi.display_order ASC, pgi.create_date DESC
        LIMIT 1
      ) provider_gallery ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(
          NULLIF(BTRIM(sgml.file_url), ''),
          CASE
            WHEN NULLIF(BTRIM(sgi.url), '') ~* ${uuidPattern} THEN NULL
            ELSE NULLIF(BTRIM(sgi.url), '')
          END
        ) AS url
        FROM category.staff_gallery_items sgi
        LEFT JOIN media.media_library sgml
          ON sgml.id = CASE
            WHEN NULLIF(BTRIM(sgi.url), '') ~* ${uuidPattern}
            THEN BTRIM(sgi.url)::uuid
            ELSE NULL
          END
        WHERE r.type = 'specialist'
          AND sgi.staff_id = r.gallery_owner
          AND COALESCE(NULLIF(BTRIM(sgi.media_type), ''), 'image') = 'image'
        ORDER BY sgi.is_primary DESC, sgi.display_order ASC, sgi.create_date DESC
        LIMIT 1
      ) staff_gallery ON true
      LEFT JOIN LATERAL (
        SELECT ps.currency
        FROM category.provider_services ps
        JOIN category.service_definitions sd ON sd.id = ps.service_definition_id
        WHERE r.currency_owner IS NOT NULL
          AND ps.service_provider_id = r.currency_owner
          AND ps.is_active = true
          AND sd.is_active = true
          AND (params.category_id IS NULL OR sd.category_id = params.category_id)
        ORDER BY ps.value ASC NULLS LAST
        LIMIT 1
      ) specialist_currency ON true
      ORDER BY r.rank_score DESC, r.rating DESC NULLS LAST, r.reviews DESC NULLS LAST, r.name ASC;
    