using Dapper;
using QuickType;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LSevin.Modules.Customer.Customer.Data.Repository
{
    public class FavoritesRepository
    {

     private readonly IDbConnection _dbConnection;

        public FavoritesRepository(IDbConnection dbConnection)
        {
            _dbConnection = dbConnection;
        }

        private const string GetFavoritesSql = """
WITH provider_favorites AS
(
    SELECT
        f.id AS id,
        'provider'::text AS type,
        common.get_translation(sp.name_translations, @Language) AS name,
        CONCAT_WS(', ', NULLIF(sp.city, ''), NULLIF(sp.country, '')) AS location,
        COALESCE(sp.rating, 0)::double precision AS rating,
        COALESCE(sp.review_count, 0)::bigint AS reviews,
        COALESCE(pg.url, '') AS image,
        COALESCE(
            NULLIF(sp.specialties[1], ''),
            common.get_translation(pt.name_translations, @Language),
            NULL
        ) AS specialty,
        f.created_at AS created_at
    FROM customer.favorites f
    INNER JOIN category.service_providers sp
        ON f.favorite_type = 'provider'::customer.favorite_type
       AND f.entity_id = sp.id
       AND sp.is_active = TRUE
    LEFT JOIN category.provider_types pt
        ON pt.id = sp.provider_type_id
    LEFT JOIN LATERAL
    (
        SELECT pgi.url
        FROM category.provider_gallery_items pgi
        WHERE pgi.service_provider_id = sp.id
          AND (
                pgi.media_type ILIKE 'image%'
                OR pgi.media_type ILIKE '%jpg%'
                OR pgi.media_type ILIKE '%jpeg%'
                OR pgi.media_type ILIKE '%png%'
                OR pgi.media_type ILIKE '%webp%'
              )
        ORDER BY pgi.display_order, pgi.create_date
        LIMIT 1
    ) pg ON TRUE
    WHERE f.customer_id = @CustomerId
),
service_favorites AS
(
    SELECT
        f.id AS id,
        'service'::text AS type,
        COALESCE(
            NULLIF(common.get_translation(ps.display_name_translations, @Language), ''),
            common.get_translation(sd.name_translations, @Language)
        ) AS name,
        CONCAT_WS(', ', NULLIF(sp.city, ''), NULLIF(sp.country, '')) AS location,
        COALESCE(ps.rating, 0)::double precision AS rating,
        COALESCE(ps.review_count, 0)::bigint AS reviews,
        COALESCE(NULLIF(ps.image_url, ''), pg.url, '') AS image,
        NULLIF(common.get_translation(c.name_translations, @Language), '') AS specialty,
        f.created_at AS created_at
    FROM customer.favorites f
    INNER JOIN category.provider_services ps
        ON f.favorite_type = 'service'::customer.favorite_type
       AND f.entity_id = ps.id
       AND ps.is_active = TRUE
    INNER JOIN category.service_providers sp
        ON sp.id = ps.service_provider_id
       AND sp.is_active = TRUE
    INNER JOIN category.service_definitions sd
        ON sd.id = ps.service_definition_id
       AND sd.is_active = TRUE
    LEFT JOIN category.categories c
        ON c.id = sd.category_id
    LEFT JOIN LATERAL
    (
        SELECT pgi.url
        FROM category.provider_gallery_items pgi
        WHERE pgi.service_provider_id = sp.id
          AND (
                pgi.media_type ILIKE 'image%'
                OR pgi.media_type ILIKE '%jpg%'
                OR pgi.media_type ILIKE '%jpeg%'
                OR pgi.media_type ILIKE '%png%'
                OR pgi.media_type ILIKE '%webp%'
              )
        ORDER BY pgi.display_order, pgi.create_date
        LIMIT 1
    ) pg ON TRUE
    WHERE f.customer_id = @CustomerId
),
specialist_favorites AS
(
    SELECT
        f.id AS id,
        'specialist'::text AS type,
        common.get_translation(s.name_translations, @Language) AS name,
        CONCAT_WS(', ', NULLIF(sp.city, ''), NULLIF(sp.country, '')) AS location,
        COALESCE(s.rating, 0)::double precision AS rating,
        0::bigint AS reviews,
        COALESCE(NULLIF(s.profile_image_url, ''), pg.url, '') AS image,
        NULLIF(common.get_translation(s.title_translations, @Language), '') AS specialty,
        f.created_at AS created_at
    FROM customer.favorites f
    INNER JOIN category.staff s
        ON f.favorite_type = 'specialist'::customer.favorite_type
       AND f.entity_id = s.id
       AND s.is_active = TRUE
    INNER JOIN LATERAL
    (
        SELECT ps.service_provider_id
        FROM category.provider_staffs ps
        WHERE ps.staff_id = s.id
          AND ps.is_active = TRUE
        ORDER BY ps.create_date DESC
        LIMIT 1
    ) selected_provider ON TRUE
    INNER JOIN category.service_providers sp
        ON sp.id = selected_provider.service_provider_id
       AND sp.is_active = TRUE
    LEFT JOIN LATERAL
    (
        SELECT pgi.url
        FROM category.provider_gallery_items pgi
        WHERE pgi.service_provider_id = sp.id
          AND (
                pgi.media_type ILIKE 'image%'
                OR pgi.media_type ILIKE '%jpg%'
                OR pgi.media_type ILIKE '%jpeg%'
                OR pgi.media_type ILIKE '%png%'
                OR pgi.media_type ILIKE '%webp%'
              )
        ORDER BY pgi.display_order, pgi.create_date
        LIMIT 1
    ) pg ON TRUE
    WHERE f.customer_id = @CustomerId
),
all_favorites AS
(
    SELECT * FROM provider_favorites
    UNION ALL
    SELECT * FROM service_favorites
    UNION ALL
    SELECT * FROM specialist_favorites
)
SELECT
    af.id AS Id,
    af.type AS Type,
    af.name AS Name,
    af.location AS Location,
    af.rating AS Rating,
    af.reviews AS Reviews,
    af.image AS Image,
    af.specialty AS Specialty
FROM all_favorites af
ORDER BY af.created_at DESC, af.id DESC;

SELECT
    t.id AS Id,
    t.label AS Label
FROM (
    VALUES
        ('all', 'All'),
        ('provider', 'Providers'),
        ('service', 'Services'),
        ('specialist', 'Specialists')
) AS t(id, label);
""";

        public async Task<GetFavoritesResponse> GetFavoritesAsync(
            Guid customerId,
            string language,
            CancellationToken cancellationToken = default)
        {
            var command = new CommandDefinition(
                GetFavoritesSql,
                new
                {
                    CustomerId = customerId,
                    Language = string.IsNullOrWhiteSpace(language) ? "en" : language
                },
                cancellationToken: cancellationToken);

            using var grid = await _dbConnection.QueryMultipleAsync(command);

            var favorites = (await grid.ReadAsync<Favorite>())?.ToArray();
            var tabs = (await grid.ReadAsync<Tab>())?.ToArray();

            return new GetFavoritesResponse
            {
                Favorites = favorites,
                Tabs = tabs
            };
        }


        private const string AddSql = """
INSERT INTO customer.favorites (customer_id, favorite_type, entity_id)
VALUES (@CustomerId, CAST(@Type AS customer.favorite_type), @EntityId)
ON CONFLICT (customer_id, favorite_type, entity_id) DO NOTHING;
""";

        private const string RemoveSql = """
DELETE FROM customer.favorites
WHERE customer_id = @CustomerId
  AND favorite_type = CAST(@Type AS customer.favorite_type)
  AND entity_id = @EntityId;
""";

        public Task AddAsync(Guid customerId, string type, Guid entityId, CancellationToken cancellationToken = default)
        {
            var command = new CommandDefinition(
                AddSql,
                new { CustomerId = customerId, Type = type, EntityId = entityId },
                cancellationToken: cancellationToken);

            return _dbConnection.ExecuteAsync(command);
        }

        public Task RemoveAsync(Guid customerId, string type, Guid entityId, CancellationToken cancellationToken = default)
        {
            var command = new CommandDefinition(
                RemoveSql,
                new { CustomerId = customerId, Type = type, EntityId = entityId },
                cancellationToken: cancellationToken);

            return _dbConnection.ExecuteAsync(command);
        }

    }
}
