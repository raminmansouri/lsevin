using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServicePageById;


using System.Text.Json;
using System.Text.Json.Serialization;


using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

// ---------------------------------------------------------------------
// 1)  C# representation of the JSON
// ---------------------------------------------------------------------

    using System;
    using System.Collections.Generic;

    using System.Text.Json;
    using System.Text.Json.Serialization;
using System.Net.NetworkInformation;

public partial class GetServicePageByIdResponse
    {
        [JsonPropertyName("service")]
        public Service Service { get; set; }

        [JsonPropertyName("included")]
        public string[] Included { get; set; }

        [JsonPropertyName("process")]
        public Process[] Process { get; set; }

        [JsonPropertyName("faqs")]
        public Faq[] Faqs { get; set; }

        [JsonPropertyName("topReviews")]
        public TopReview[] TopReviews { get; set; }

        [JsonPropertyName("localRecommendations")]
        public AlRecommendation[] LocalRecommendations { get; set; }

        [JsonPropertyName("internationalRecommendations")]
        public AlRecommendation[] InternationalRecommendations { get; set; }
    }

    public partial class Faq
    {
        [JsonPropertyName("q")]
        public string Q { get; set; }

        [JsonPropertyName("a")]
        public string A { get; set; }
    }

    public partial class AlRecommendation
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("image")]
        public string Image { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("provider")]
        public string Provider { get; set; }

        [JsonPropertyName("rating")]
        public double Rating { get; set; }

        [JsonPropertyName("reviewCount")]
        public long ReviewCount { get; set; }

        [JsonPropertyName("city")]
        public string City { get; set; }

        [JsonPropertyName("country")]
        public string Country { get; set; }

        [JsonPropertyName("price")]
        public long Price { get; set; }

        [JsonPropertyName("currency")]
        public string Currency { get; set; }

        [JsonPropertyName("verified")]
        public bool Verified { get; set; }

        [JsonPropertyName("link")]
        public string Link { get; set; }
    }

    public partial class Process
    {
        [JsonPropertyName("step")]
        public long Step { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("duration")]
        public string Duration { get; set; }
    }

    public partial class Service
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("subtitle")]
        public string Subtitle { get; set; }

        [JsonPropertyName("clinic")]
        public string Clinic { get; set; }

        [JsonPropertyName("clinicId")]
        public Guid ClinicId { get; set; }

        [JsonPropertyName("location")]
        public string Location { get; set; }

        [JsonPropertyName("price")]
        public long Price { get; set; }

        [JsonPropertyName("originalPrice")]
        public long OriginalPrice { get; set; }

        [JsonPropertyName("currency")]
        public string Currency { get; set; }

        [JsonPropertyName("otherCurrencies")]
        public OtherCurrency[] OtherCurrencies { get; set; }

        [JsonPropertyName("rating")]
        public double Rating { get; set; }

        [JsonPropertyName("reviews")]
        public long Reviews { get; set; }

        [JsonPropertyName("images")]
        public string[] Images { get; set; }

        [JsonPropertyName("duration")]
        public string Duration { get; set; }

        [JsonPropertyName("recovery")]
        public string Recovery { get; set; }

        [JsonPropertyName("anesthesia")]
        public string Anesthesia { get; set; }

        [JsonPropertyName("stayRequired")]
        public string StayRequired { get; set; }

        [JsonPropertyName("verified")]
        public bool Verified { get; set; }

        [JsonPropertyName("popular")]
        public bool Popular { get; set; }

        [JsonPropertyName("successRate")]
        public string SuccessRate { get; set; }

        [JsonPropertyName("satisfaction")]
        public string Satisfaction { get; set; }
    }

    public partial class OtherCurrency
    {
        [JsonPropertyName("code")]
        public string Code { get; set; }

        [JsonPropertyName("amount")]
        public long Amount { get; set; }
    }

    public partial class TopReview
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("country")]
        public string Country { get; set; }

        [JsonPropertyName("date")]
        public string Date { get; set; }

        [JsonPropertyName("rating")]
        public long Rating { get; set; }

        [JsonPropertyName("review")]
        public string Review { get; set; }

        [JsonPropertyName("verified")]
        public bool Verified { get; set; }

        [JsonPropertyName("helpful")]
        public long Helpful { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [JsonPropertyName("images")]
        public string[] Images { get; set; }
    }

    public partial class GetServicePageByIdResponse
    {
        public static string SampleJson = "{\"service\":{\"id\":\"1\",\"name\":\"Premium Hair Transplant - FUE Method\",\"subtitle\":\"Advanced Follicular Unit Extraction\",\"clinic\":\"Istanbul Medical Center\",\"clinicId\":\"1\",\"location\":\"Istanbul, Turkey\",\"price\":2499,\"originalPrice\":3200,\"currency\":\"USD\",\"otherCurrencies\":[{\"code\":\"EUR\",\"amount\":2299},{\"code\":\"GBP\",\"amount\":1999},{\"code\":\"AED\",\"amount\":9175}],\"rating\":4.9,\"reviews\":1247,\"images\":[\"/unsplash_images/photo-1622296089863-eb7fc530daa8__w=1200&h=800&fit=crop.jpg\",\"https://images.unsplash.com/photo-1629909615957-be38eea5915d?w=1200&h=800&fit=crop\",\"/unsplash_images/photo-1551190822-a9333d879b1f__w=1200&h=800&fit=crop.jpg\",\"/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=1200&h=800&fit=crop.jpg\"],\"duration\":\"6-8 hours\",\"recovery\":\"7-10 days\",\"anesthesia\":\"Local\",\"stayRequired\":\"2-3 nights\",\"verified\":true,\"popular\":true,\"successRate\":\"98.5%\",\"satisfaction\":\"99.2%\"},\"included\":[\"Pre-operative consultation & hair analysis\",\"FUE hair transplant procedure (3000-5000 grafts)\",\"Post-operative medications & care kit\",\"3 PRP sessions for enhanced growth\",\"Airport VIP transfer (pick-up & drop-off)\",\"2 nights at 4-star partner hotel\",\"Professional medical translator\",\"1-year follow-up & guarantee\",\"Before/after photos & certificate\"],\"process\":[{\"step\":1,\"title\":\"Consultation\",\"description\":\"Hair analysis, design hairline, discuss expectations\",\"duration\":\"30-45 min\"},{\"step\":2,\"title\":\"Extraction\",\"description\":\"Extract follicles from donor area using micro-punch\",\"duration\":\"3-4 hours\"},{\"step\":3,\"title\":\"Implantation\",\"description\":\"Carefully implant grafts in recipient area\",\"duration\":\"2-3 hours\"},{\"step\":4,\"title\":\"Recovery\",\"description\":\"Instructions, medications, first wash at clinic\",\"duration\":\"7-10 days\"}],\"faqs\":[{\"q\":\"Is the result permanent?\",\"a\":\"Yes, transplanted hair is permanent as it comes from the DHT-resistant donor area. You can expect 95-98% of grafts to grow successfully.\"},{\"q\":\"When will I see results?\",\"a\":\"Initial growth starts at 3-4 months. Full results are visible at 12-18 months as hair grows and thickens naturally.\"},{\"q\":\"Is the procedure painful?\",\"a\":\"No, the procedure is performed under local anesthesia. You may feel slight discomfort during anesthesia injection, but the procedure itself is painless.\"},{\"q\":\"What is the recovery time?\",\"a\":\"Most patients return to work within 7-10 days. Redness fades in 2-3 weeks. You can resume exercise after 2 weeks and see final results in 12 months.\"}],\"topReviews\":[{\"id\":1,\"name\":\"David Thompson\",\"country\":\"UK\",\"date\":\"1 month ago\",\"rating\":5,\"review\":\"Life-changing experience! Dr. Mehmet is a true artist. 6 months post-op and my hair is growing beautifully. The entire package was seamless - hotel, transfer, translator, everything was perfect.\",\"verified\":true,\"helpful\":89,\"images\":[\"/unsplash_images/photo-1622296089863-eb7fc530daa8__w=400&h=300&fit=crop.jpg\",\"https://images.unsplash.com/photo-1629909615957-be38eea5915d?w=400&h=300&fit=crop\"]},{\"id\":2,\"name\":\"Ahmed Al-Farsi\",\"country\":\"Saudi Arabia\",\"date\":\"2 months ago\",\"rating\":5,\"review\":\"Exceptional service and natural-looking results. The clinic is modern, clean, and professional. Communication was excellent throughout. Highly recommend for anyone considering hair transplant.\",\"verified\":true,\"helpful\":67}],\"localRecommendations\":[{\"id\":\"treat-local-1\",\"image\":\"https://images.unsplash.com/photo-1629909615957-be38eea5915d?w=400&h=400&fit=crop\",\"title\":\"Sapphire FUE Hair Transplant\",\"provider\":\"Ankara Hair Center\",\"rating\":4.8,\"reviewCount\":892,\"city\":\"Ankara\",\"country\":\"Turkey\",\"price\":2299,\"currency\":\"$\",\"verified\":true,\"link\":\"/app/treatment/2\"},{\"id\":\"treat-local-2\",\"image\":\"/unsplash_images/photo-1551190822-a9333d879b1f__w=400&h=400&fit=crop.jpg\",\"title\":\"DHI Hair Transplant Premium\",\"provider\":\"Bodrum Medical Clinic\",\"rating\":4.9,\"reviewCount\":654,\"city\":\"Bodrum\",\"country\":\"Turkey\",\"price\":2699,\"currency\":\"$\",\"verified\":true,\"link\":\"/app/treatment/3\"}],\"internationalRecommendations\":[{\"id\":\"treat-int-1\",\"image\":\"/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=400&h=400&fit=crop.jpg\",\"title\":\"Advanced FUE Hair Restoration\",\"provider\":\"Tehran Excellence Clinic\",\"rating\":4.7,\"reviewCount\":1124,\"city\":\"Tehran\",\"country\":\"Iran\",\"price\":1899,\"currency\":\"$\",\"verified\":true,\"link\":\"/app/treatment/4\"},{\"id\":\"treat-int-2\",\"image\":\"/unsplash_images/photo-1588776814546-1ffcf47267a5__w=400&h=400&fit=crop.jpg\",\"title\":\"Premium Hair Transplant Package\",\"provider\":\"Dubai Wellness Center\",\"rating\":4.8,\"reviewCount\":976,\"city\":\"Dubai\",\"country\":\"UAE\",\"price\":3499,\"currency\":\"$\",\"verified\":true,\"link\":\"/app/treatment/5\"}]}\r\n";
        public static GetServicePageByIdResponse FromJson(string json) => JsonSerializer.Deserialize<GetServicePageByIdResponse>(json, 
            Converter.Settings);


    public static string DapperSQL = @"
-- SERVICE MAIN
SELECT 
    ps.id AS Id,
    common.get_translation_t(ps.display_name_translations, @CurrentLocale, @DefaultLocale) AS Name,
    common.get_translation_t(sd.description_translations, @CurrentLocale, @DefaultLocale) AS Subtitle,
    common.get_translation_t(sp.name_translations, @CurrentLocale, @DefaultLocale) AS Clinic,
    sp.id AS ClinicId,
    TRIM(
        CONCAT_WS(', ',
            NULLIF(common.get_translation_t(city_loc.value_translations, @CurrentLocale, @DefaultLocale), ''),
            NULLIF(common.get_translation_t(country_loc.value_translations, @CurrentLocale, @DefaultLocale), '')
        )
    ) AS Location,
    ps.value AS Price,
    ps.value AS OriginalPrice,
    ps.currency AS Currency,
    ps.rating,
    ps.review_count AS Reviews,
    ps.duration_minutes::text AS Duration,
    ps.recovery,
    ps.anesthesia,
    ps.stay_required AS StayRequired,
    sp.is_active AS Verified,
    ps.is_popular AS Popular,
    ps.success_rate,
    ps.satisfaction
FROM category.provider_services ps
JOIN category.service_providers sp 
    ON sp.id = ps.service_provider_id
LEFT JOIN category.service_definitions sd 
    ON sd.id = ps.service_definition_id
LEFT JOIN category.locations country_loc
    ON country_loc.code = sp.country
   AND country_loc.location_type_id = 1
LEFT JOIN category.locations city_loc
    ON city_loc.code = sp.city
   AND city_loc.location_type_id = 2
WHERE ps.id = @ServiceId;

-- SERVICE IMAGES
-- SERVICE IMAGES
WITH service_ctx AS (
    SELECT 
        ps.id,
        ps.service_provider_id,
        ps.image_url AS service_image_url
    FROM category.provider_services ps
    WHERE ps.id = @ServiceId
),
service_gallery AS (
    SELECT gi.url, gi.is_primary, gi.display_order
    FROM category.provider_service_gallery_items gi
    JOIN service_ctx s ON s.id = gi.provider_service_id
    WHERE gi.media_type = 'image'
      AND gi.url IS NOT NULL
      AND BTRIM(gi.url) <> ''
),
service_single AS (
    SELECT s.service_image_url AS url, false AS is_primary, 999999 AS display_order
    FROM service_ctx s
    WHERE s.service_image_url IS NOT NULL
      AND BTRIM(s.service_image_url) <> ''
),
provider_gallery AS (
    SELECT gi.url, false AS is_primary, gi.display_order
    FROM category.provider_gallery_items gi
    JOIN service_ctx s ON s.service_provider_id = gi.service_provider_id
    WHERE gi.media_type = 'image'
      AND gi.url IS NOT NULL
      AND BTRIM(gi.url) <> ''
),
provider_single AS (
    SELECT sp.image_url AS url, false AS is_primary, 999999 AS display_order
    FROM category.service_providers sp
    JOIN service_ctx s ON s.service_provider_id = sp.id
    WHERE sp.image_url IS NOT NULL
      AND BTRIM(sp.image_url) <> ''
)
SELECT url
FROM (
    -- 1) service gallery images
    SELECT sg.url, sg.is_primary, sg.display_order, 1 AS source_rank
    FROM service_gallery sg

    UNION ALL

    -- 2) service image_url only if no service gallery exists
    SELECT ss.url, ss.is_primary, ss.display_order, 2 AS source_rank
    FROM service_single ss
    WHERE NOT EXISTS (SELECT 1 FROM service_gallery)

    UNION ALL

    -- 3) provider gallery images only if no service images exist
    SELECT pg.url, pg.is_primary, pg.display_order, 3 AS source_rank
    FROM provider_gallery pg
    WHERE NOT EXISTS (SELECT 1 FROM service_gallery)
      AND NOT EXISTS (SELECT 1 FROM service_single)

    UNION ALL

    -- 4) provider image_url only if nothing else exists
    SELECT ps.url, ps.is_primary, ps.display_order, 4 AS source_rank
    FROM provider_single ps
    WHERE NOT EXISTS (SELECT 1 FROM service_gallery)
      AND NOT EXISTS (SELECT 1 FROM service_single)
      AND NOT EXISTS (SELECT 1 FROM provider_gallery)
) x
ORDER BY source_rank, is_primary DESC, display_order, url;

-- OTHER CURRENCIES
SELECT 
    c.symbol AS Code,
    (c.price * ps.value)::bigint AS Amount
FROM category.currencies c
CROSS JOIN category.provider_services ps
WHERE ps.id = @ServiceId;

-- INCLUDED
SELECT item
FROM category.service_included
WHERE service_id = @ServiceId;

-- PROCESS
SELECT 
    step,
    title,
    description,
    duration
FROM category.service_process
WHERE service_id = @ServiceId
ORDER BY step;

-- FAQS
SELECT 
    question AS Q,
    answer AS A
FROM category.service_faqs
WHERE service_id = @ServiceId;

-- TOP REVIEWS
SELECT 
    id,
    customer_name AS Name,
    country,
    create_date::date::text AS Date,
    rating,
    comment_text AS Review,
    is_verified AS Verified,
    helpful_count AS Helpful
FROM category.service_provider_comments
WHERE service_provider_id = (
    SELECT service_provider_id
    FROM category.provider_services
    WHERE id = @ServiceId
)
  AND is_public = true
ORDER BY rating DESC NULLS LAST, helpful_count DESC, create_date DESC
LIMIT 5;

-- REVIEW IMAGES
SELECT ri.review_id, ri.image_url
FROM category.review_images ri
WHERE ri.review_id IN (
    SELECT c.id
    FROM category.service_provider_comments c
    WHERE c.service_provider_id = (
        SELECT service_provider_id
        FROM category.provider_services
        WHERE id = @ServiceId
    )
      AND c.is_public = true
    ORDER BY c.rating DESC NULLS LAST, c.helpful_count DESC, c.create_date DESC
    LIMIT 5
);

-- LOCAL RECOMMENDATIONS
SELECT 
    ps.id::text AS Id,
    ps.image_url AS Image,
    common.get_translation_t(ps.display_name_translations, @CurrentLocale, @DefaultLocale) AS Title,
    common.get_translation_t(sp.name_translations, @CurrentLocale, @DefaultLocale) AS Provider,
    ps.rating,
    ps.review_count AS ReviewCount,
    common.get_translation_t(city_loc.value_translations, @CurrentLocale, @DefaultLocale) AS city,
    common.get_translation_t(country_loc.value_translations, @CurrentLocale, @DefaultLocale) AS country,
    ps.value AS Price,
    ps.currency,
    sp.is_active AS Verified,
    '/service/' || ps.id AS Link
FROM category.provider_services ps
JOIN category.service_providers sp 
    ON sp.id = ps.service_provider_id
LEFT JOIN category.locations country_loc
    ON country_loc.code = sp.country
   AND country_loc.location_type_id = 1
LEFT JOIN category.locations city_loc
    ON city_loc.code = sp.city
   AND city_loc.location_type_id = 2
WHERE sp.city = (
    SELECT sp2.city
    FROM category.provider_services ps2
    JOIN category.service_providers sp2 
        ON sp2.id = ps2.service_provider_id
    WHERE ps2.id = @ServiceId
)
  AND ps.id <> @ServiceId
  AND ps.is_active = true
LIMIT 6;

-- INTERNATIONAL RECOMMENDATIONS
SELECT 
    ps.id::text AS Id,
    ps.image_url AS Image,
    common.get_translation_t(ps.display_name_translations, @CurrentLocale, @DefaultLocale) AS Title,
    common.get_translation_t(sp.name_translations, @CurrentLocale, @DefaultLocale) AS Provider,
    ps.rating,
    ps.review_count AS ReviewCount,
    common.get_translation_t(city_loc.value_translations, @CurrentLocale, @DefaultLocale) AS city,
    common.get_translation_t(country_loc.value_translations, @CurrentLocale, @DefaultLocale) AS country,
    ps.value AS Price,
    ps.currency,
    sp.is_active AS Verified,
    '/service/' || ps.id AS Link
FROM category.provider_services ps
JOIN category.service_providers sp 
    ON sp.id = ps.service_provider_id
LEFT JOIN category.locations country_loc
    ON country_loc.code = sp.country
   AND country_loc.location_type_id = 1
LEFT JOIN category.locations city_loc
    ON city_loc.code = sp.city
   AND city_loc.location_type_id = 2
WHERE sp.country <> (
    SELECT sp2.country
    FROM category.provider_services ps2
    JOIN category.service_providers sp2 
        ON sp2.id = ps2.service_provider_id
    WHERE ps2.id = @ServiceId
)
  AND ps.id <> @ServiceId
  AND ps.is_active = true
LIMIT 6;";
    }

    public static class Serialize
    {
        public static string ToJson(this GetServicePageByIdResponse self) => JsonSerializer.Serialize(self, Converter.Settings);
    }

    internal static class Converter
    {
        public static readonly JsonSerializerOptions Settings = new(JsonSerializerDefaults.Web)
        {
            Converters =
            {
                new DateOnlyConverter(),
                new TimeOnlyConverter(),
            },
        };
    }

    internal class ParseStringConverter : JsonConverter<long>
    {
        public override bool CanConvert(Type t) => t == typeof(long);

        public override long Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString();
            long l;
            if (Int64.TryParse(value, out l))
            {
                return l;
            }
            throw new Exception("Cannot unmarshal type long");
        }

        public override void Write(Utf8JsonWriter writer, long value, JsonSerializerOptions options)
        {
            JsonSerializer.Serialize(writer, value.ToString());
            return;
        }

        public static readonly ParseStringConverter Singleton = new ParseStringConverter();
    }

    public class DateOnlyConverter : JsonConverter<DateOnly>
    {
        private readonly string serializationFormat;
        public DateOnlyConverter() : this(null) { }

        public DateOnlyConverter(string? serializationFormat)
        {
            this.serializationFormat = serializationFormat ?? "yyyy-MM-dd";
        }

        public override DateOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString();
            return DateOnly.Parse(value!);
        }

        public override void Write(Utf8JsonWriter writer, DateOnly value, JsonSerializerOptions options)
            => writer.WriteStringValue(value.ToString(serializationFormat));
    }
    public class TimeOnlyConverter : JsonConverter<TimeOnly>
    {
        private readonly string serializationFormat;

        public TimeOnlyConverter() : this(null) { }

        public TimeOnlyConverter(string? serializationFormat)
        {
            this.serializationFormat = serializationFormat ?? "HH:mm:ss.fff";
        }

        public override TimeOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString();
            return TimeOnly.Parse(value!);
        }

        public override void Write(Utf8JsonWriter writer, TimeOnly value, JsonSerializerOptions options)
            => writer.WriteStringValue(value.ToString(serializationFormat));
    }
