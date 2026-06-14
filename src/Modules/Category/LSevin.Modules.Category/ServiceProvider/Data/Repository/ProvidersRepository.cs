using LSevin.Modules.Category.ServiceProvider.Features.GetProviderById;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Data;
using Dapper;

namespace LSevin.Modules.Category.ServiceProvider.Data.Repository
{
  
public sealed class ProviderRepository
    {
        public async Task<ProviderResponse?> GetProviderResponseAsync(
            IDbConnection connection,
            Guid providerId,
            string language = "en",
            string fallbackLanguage = "en",
            IDbTransaction? transaction = null)
        {
            const string sql = """
        -- =========================================================
        -- 1) Provider + images + certifications
        -- =========================================================
        SELECT
            p.id::text AS Id,
            common.get_translation(p.name_translations, @Language, @FallbackLanguage) AS Name,
            common.get_translation(p.description_translations, @Language, @FallbackLanguage) AS Tagline,
            CONCAT_WS(', ', NULLIF(p.city, ''), NULLIF(p.country, '')) AS Location,
            COALESCE(p.rating, 0)::double precision AS Rating,
            COALESCE(p.review_count, 0) AS Reviews,
            (
                COALESCE(p.accredited, false)
                OR EXISTS
                (
                    SELECT 1
                    FROM category.provider_certifications pcx
                    WHERE pcx.service_provider_id = p.id
                      AND pcx.is_verified = true
                )
            ) AS Verified,
            COALESCE(p.accredited, false) AS Accredited,
            COALESCE(p.response_time, '') AS ResponseTime,
            p.languages AS Languages,
            COALESCE(p.established_year, 0) AS Established,
            COALESCE(p.total_patients, '') AS TotalPatients,
            COALESCE(p.success_rate, '') AS SuccessRate,

            img.image_url AS ImageUrl,
            img.image_sort_order AS ImageSortOrder,

            cert.name AS CertificationName,
            cert.is_verified AS CertificationVerified
        FROM category.service_providers p
        LEFT JOIN
        (
            SELECT
                gi.service_provider_id,
                gi.url AS image_url,
                gi.display_order AS image_sort_order
            FROM category.provider_gallery_items gi
            WHERE gi.url IS NOT NULL
              AND BTRIM(gi.url) <> ''

            UNION ALL

            SELECT
                sp.id AS service_provider_id,
                sp.image_url AS image_url,
                -1 AS image_sort_order
            FROM category.service_providers sp
            WHERE sp.image_url IS NOT NULL
              AND BTRIM(sp.image_url) <> ''
        ) img
            ON img.service_provider_id = p.id
        LEFT JOIN category.provider_certifications cert
            ON cert.service_provider_id = p.id
        WHERE p.id = @ProviderId
          AND p.is_active = true
        ORDER BY img.image_sort_order NULLS LAST, img.image_url, cert.name;

        -- =========================================================
        -- 2) Services
        -- NOTE: model wants int Id, DB uses uuid => synthetic row number
        -- =========================================================
        WITH services_base AS
        (
            SELECT
                (ROW_NUMBER() OVER (ORDER BY ps.create_date, ps.id))::int AS Id,
                common.get_translation(ps.display_name_translations, @Language, @FallbackLanguage) AS Name,
                ps.value::double precision AS Price,
                ps.currency AS Currency,
                CASE
                    WHEN COALESCE(ps.duration_minutes, 0) > 0
                    THEN ps.duration_minutes::text || ' min'
                    ELSE ''
                END AS Duration,
                COALESCE(ps.recovery, '') AS Recovery,
                COALESCE(ps.rating, 0)::double precision AS Rating,
                COALESCE(ps.review_count, 0) AS Reviews,
                ps.is_popular AS Popular,
                COALESCE(ps.image_url, '') AS Image
            FROM category.provider_services ps
            WHERE ps.service_provider_id = @ProviderId
              AND ps.is_active = true
        )
        SELECT
            Id, Name, Price, Currency, Duration, Recovery, Rating, Reviews, Popular, Image
        FROM services_base
        ORDER BY Id;

        -- =========================================================
        -- 3) Specialists
        -- NOTE: model wants int Id, DB uses uuid => synthetic row number
        -- =========================================================
        WITH specialists_base AS
        (
            SELECT
                (ROW_NUMBER() OVER (ORDER BY s.create_date, s.id))::int AS Id,
                common.get_translation(s.name_translations, @Language, @FallbackLanguage) AS Name,
                COALESCE(NULLIF(s.specialty, ''), common.get_translation(s.title_translations, @Language, @FallbackLanguage)) AS Specialty,
                COALESCE(s.experience, '') AS Experience,
                COALESCE(s.patients, '') AS Patients,
                COALESCE(s.rating, 0)::double precision AS Rating,
                COALESCE(s.profile_image_url, '') AS Image,
                COALESCE(BOOL_OR(sc.is_verified), false) AS Verified
            FROM category.provider_staffs ps
            INNER JOIN category.staff s
                ON s.id = ps.staff_id
            LEFT JOIN category.staff_credentials sc
                ON sc.staff_id = s.id
            WHERE ps.service_provider_id = @ProviderId
              AND ps.is_active = true
              AND s.is_active = true
            GROUP BY
                s.id,
                s.create_date,
                s.name_translations,
                s.title_translations,
                s.specialty,
                s.experience,
                s.patients,
                s.rating,
                s.profile_image_url
        )
        SELECT
            Id, Name, Specialty, Experience, Patients, Rating, Image, Verified
        FROM specialists_base
        ORDER BY Id;

        -- =========================================================
        -- 4) Recent reviews + review images
        -- NOTE: model wants int Id, DB uses uuid => synthetic row number
        -- =========================================================
        WITH reviews_base AS
        (
            SELECT
                c.id AS SourceId,
                (ROW_NUMBER() OVER (ORDER BY c.create_date DESC, c.id))::int AS Id,
                c.customer_name AS Name,
                COALESCE(c.country, '') AS Country,
                TO_CHAR(c.create_date AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS Date,
                COALESCE(c.rating, 0) AS Rating,
                COALESCE(c.treatment, '') AS Service,
                c.comment_text AS ReviewText,
                COALESCE(c.is_verified, false) AS Verified,
                COALESCE(c.helpful_count, 0) AS Helpful
            FROM category.service_provider_comments c
            WHERE c.service_provider_id = @ProviderId
              AND c.is_public = true
        )
        SELECT
            rb.Id,
            rb.Name,
            rb.Country,
            rb.Date,
            rb.Rating,
            rb.Service,
            rb.ReviewText,
            rb.Verified,
            rb.Helpful,
            ri.image_url AS ImageUrl
        FROM reviews_base rb
        LEFT JOIN category.review_images ri
            ON ri.review_id = rb.SourceId
        ORDER BY rb.Id, ri.image_url;

        -- =========================================================
        -- 5) Local recommendations
        -- =========================================================
        SELECT
            tp.id::text AS Id,
            COALESCE(tp.image_url, first_img.url, '') AS Image,
            common.get_translation(tp.name_translations, @Language, @FallbackLanguage) AS Title,
            COALESCE(tp.rating, 0)::double precision AS Rating,
            COALESCE(tp.review_count, 0) AS ReviewCount,
            tp.city AS City,
            tp.country AS Country,
            (
                COALESCE(tp.accredited, false)
                OR EXISTS
                (
                    SELECT 1
                    FROM category.provider_certifications pc
                    WHERE pc.service_provider_id = tp.id
                      AND pc.is_verified = true
                )
            ) AS Verified,
            '/providers/' || tp.id::text AS Link
        FROM category.provider_recommendations pr
        INNER JOIN category.service_providers tp
            ON tp.id = pr.target_provider_id
        LEFT JOIN LATERAL
        (
            SELECT gi.url
            FROM category.provider_gallery_items gi
            WHERE gi.service_provider_id = tp.id
              AND gi.url IS NOT NULL
              AND BTRIM(gi.url) <> ''
            ORDER BY gi.display_order, gi.url
            LIMIT 1
        ) first_img ON true
        WHERE pr.source_provider_id = @ProviderId
          AND pr.type = 'local'
          AND tp.is_active = true
        ORDER BY tp.rating DESC, tp.review_count DESC, tp.id;

        -- =========================================================
        -- 6) International recommendations
        -- =========================================================
        SELECT
            tp.id::text AS Id,
            COALESCE(tp.image_url, first_img.url, '') AS Image,
            common.get_translation(tp.name_translations, @Language, @FallbackLanguage) AS Title,
            COALESCE(tp.rating, 0)::double precision AS Rating,
            COALESCE(tp.review_count, 0) AS ReviewCount,
            tp.city AS City,
            tp.country AS Country,
            (
                COALESCE(tp.accredited, false)
                OR EXISTS
                (
                    SELECT 1
                    FROM category.provider_certifications pc
                    WHERE pc.service_provider_id = tp.id
                      AND pc.is_verified = true
                )
            ) AS Verified,
            '/providers/' || tp.id::text AS Link
        FROM category.provider_recommendations pr
        INNER JOIN category.service_providers tp
            ON tp.id = pr.target_provider_id
        LEFT JOIN LATERAL
        (
            SELECT gi.url
            FROM category.provider_gallery_items gi
            WHERE gi.service_provider_id = tp.id
              AND gi.url IS NOT NULL
              AND BTRIM(gi.url) <> ''
            ORDER BY gi.display_order, gi.url
            LIMIT 1
        ) first_img ON true
        WHERE pr.source_provider_id = @ProviderId
          AND pr.type = 'international'
          AND tp.is_active = true
        ORDER BY tp.rating DESC, tp.review_count DESC, tp.id;
        """;

            var args = new
            {
                ProviderId = providerId,
                Language = language,
                FallbackLanguage = fallbackLanguage
            };

            using var multi = await connection.QueryMultipleAsync(sql, args, transaction);

            var providerLookup = new Dictionary<string, Provider>(StringComparer.Ordinal);

            var provider = multi
                .Read<ProviderRootRow, ProviderImageRow, CertificationRow, Provider>(
                    (root, image, cert) =>
                    {
                        if (!providerLookup.TryGetValue(root.Id, out var p))
                        {
                            p = new Provider
                            {
                                Id = root.Id,
                                Name = root.Name,
                                Tagline = root.Tagline,
                                Location = root.Location,
                                Rating = root.Rating,
                                Reviews = root.Reviews,
                                Verified = root.Verified,
                                Accredited = root.Accredited,
                                ResponseTime = root.ResponseTime,
                                Languages = root.Languages?.ToList() ?? new List<string>(),
                                Established = root.Established,
                                TotalPatients = root.TotalPatients,
                                SuccessRate = root.SuccessRate,
                                Images = new List<string>(),
                                Certifications = new List<Certification>()
                            };

                            providerLookup.Add(root.Id, p);
                        }

                        if (image is not null &&
                            !string.IsNullOrWhiteSpace(image.ImageUrl) &&
                            !p.Images.Contains(image.ImageUrl, StringComparer.Ordinal))
                        {
                            p.Images.Add(image.ImageUrl);
                        }

                        if (cert is not null &&
                            !string.IsNullOrWhiteSpace(cert.CertificationName) &&
                            !p.Certifications.Any(x =>
                                x.Name == cert.CertificationName &&
                                x.Verified == (cert.CertificationVerified ?? false)))
                        {
                            p.Certifications.Add(new Certification
                            {
                                Name = cert.CertificationName,
                                Verified = cert.CertificationVerified ?? false
                            });
                        }

                        return p;
                    },
                    splitOn: "ImageUrl,CertificationName")
                .FirstOrDefault();

            if (provider is null)
                return null;

            var services = multi.Read<Service>().ToList();

            var specialists = multi.Read<Specialist>().ToList();

            var reviewLookup = new Dictionary<int, Review>();

            _ = multi.Read<Review, ReviewImageRow, Review>(
                (review, image) =>
                {
                    if (!reviewLookup.TryGetValue(review.Id, out var r))
                    {
                        r = review;
                        r.Images = new List<string>();
                        reviewLookup.Add(r.Id, r);
                    }

                    if (image is not null &&
                        !string.IsNullOrWhiteSpace(image.ImageUrl) &&
                        !r.Images.Contains(image.ImageUrl, StringComparer.Ordinal))
                    {
                        r.Images.Add(image.ImageUrl);
                    }

                    return r;
                },
                splitOn: "ImageUrl").AsList();

            var localRecommendations = multi.Read<Recommendation>().ToList();
            var internationalRecommendations = multi.Read<Recommendation>().ToList();

            return new ProviderResponse
            {
                Provider = provider,
                Services = services,
                Specialists = specialists,
                RecentReviews = reviewLookup.Values.ToList(),
                LocalRecommendations = localRecommendations,
                InternationalRecommendations = internationalRecommendations
            };
        }

        private sealed class ProviderRootRow
        {
            public string Id { get; set; } = default!;
            public string Name { get; set; } = default!;
            public string Tagline { get; set; } = default!;
            public string Location { get; set; } = default!;
            public double Rating { get; set; }
            public int Reviews { get; set; }
            public bool Verified { get; set; }
            public bool Accredited { get; set; }
            public string ResponseTime { get; set; } = default!;
            public string[]? Languages { get; set; }
            public int Established { get; set; }
            public string TotalPatients { get; set; } = default!;
            public string SuccessRate { get; set; } = default!;
        }

        private sealed class ProviderImageRow
        {
            public string? ImageUrl { get; set; }
            public int? ImageSortOrder { get; set; }
        }

        private sealed class CertificationRow
        {
            public string? CertificationName { get; set; }
            public bool? CertificationVerified { get; set; }
        }

        private sealed class ReviewImageRow
        {
            public string? ImageUrl { get; set; }
        }
    }
}
