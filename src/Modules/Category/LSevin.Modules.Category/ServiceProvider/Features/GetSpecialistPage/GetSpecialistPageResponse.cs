using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetSpecialistPage;
// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣  MODEL DEFsetION
// ─────────────────────────────────────────────────────────────────────────────
using System.Collections.Generic;
using System.Net.NetworkInformation;
using System.Text.Json.Serialization;

    // ---------- Specialist ----------
    public record Specialist
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = default!;

        [JsonPropertyName("name")]
        public string Name { get; set; } = default!;

        [JsonPropertyName("title")]
        public string Title { get; set; } = default!;

        [JsonPropertyName("specialty")]
        public string Specialty { get; set; } = default!;

        [JsonPropertyName("image")]
        public string Image { get; set; } = default!;

        [JsonPropertyName("rating")]
        public double Rating { get; set; }

        [JsonPropertyName("reviews")]
        public int Reviews { get; set; }

        [JsonPropertyName("experience")]
        public int Experience { get; set; }

        [JsonPropertyName("patients")]
        public string Patients { get; set; } = default!;

        [JsonPropertyName("successRate")]
        public string SuccessRate { get; set; } = default!;

        [JsonPropertyName("verified")]
        public bool Verified { get; set; }

        [JsonPropertyName("languages")]
        public List<string> Languages { get; set; } = new();

        [JsonPropertyName("clinic")]
        public string Clinic { get; set; } = default!;

        [JsonPropertyName("clinicId")]
        public string ClinicId { get; set; } = default!;

        [JsonPropertyName("location")]
        public string Location { get; set; } = default!;

        [JsonPropertyName("responseTime")]
        public string ResponseTime { get; set; } = default!;

        [JsonPropertyName("consultationFee")]
        public decimal ConsultationFee { get; set; }
    }

    // ---------- Education ----------
    public record EducationEntry
    {
        [JsonPropertyName("degree")]
        public string Degree { get; set; } = default!;

        [JsonPropertyName("institution")]
        public string Institution { get; set; } = default!;

        [JsonPropertyName("year")]
        public string Year { get; set; } = default!;
    }

    // ---------- Certification ----------
    public record Certification
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = default!;

        [JsonPropertyName("issuer")]
        public string Issuer { get; set; } = default!;

        [JsonPropertyName("verified")]
        public bool Verified { get; set; }
    }

    // ---------- Achievement ----------
    public enum IconType
    {
        Award,
        Users,
        Star,
        TrendingUp
    }

    public record Achievement
    {
        [JsonPropertyName("icon")]
        public IconType Icon { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = default!;

        [JsonPropertyName("organization")]
        public string Organization { get; set; } = default!;
    }

// ---------- Review ----------
public record Review
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = default!;

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("country")]
    public string Country { get; set; } = default!;

    [JsonPropertyName("date")]
    public string Date { get; set; } = default!;

    [JsonPropertyName("rating")]
    public int Rating { get; set; }

    [JsonPropertyName("treatment")]
    public string Treatment { get; set; } = default!;

    [JsonPropertyName("review")]
    public string ReviewText { get; set; } = default!;

    [JsonPropertyName("verified")]
    public bool Verified { get; set; }

    [JsonPropertyName("helpful")]
    public int Helpful { get; set; }

    [JsonPropertyName("images")]
    public List<string>? Images { get; set; }
}
// ---------- Before/After ----------
public record BeforeAfter
    {
        [JsonPropertyName("before")]
        public string Before { get; set; } = default!;

        [JsonPropertyName("after")]
        public string After { get; set; } = default!;

        [JsonPropertyName("procedure")]
        public string Procedure { get; set; } = default!;

        [JsonPropertyName("months")]
        public string Months { get; set; } = default!;
    }

    // ---------- Final Response ----------
    public record GetSpecialistPageResponse
    {
        [JsonPropertyName("beforeAfter")]
        public List<BeforeAfter> BeforeAfter { get; set; } = new();

        [JsonPropertyName("recentReviews")]
        public List<Review> RecentReviews { get; set; } = new();

        [JsonPropertyName("achievements")]
        public List<Achievement> Achievements { get; set; } = new();

        [JsonPropertyName("specializations")]
        public List<string> Specializations { get; set; } = new();

        [JsonPropertyName("certifications")]
        public List<Certification> Certifications { get; set; } = new();

        [JsonPropertyName("specialist")]
        public Specialist Specialist { get; set; } = default!;

        [JsonPropertyName("education")]
        public List<EducationEntry> Education { get; set; } = new();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2️⃣  STATIC DATA (VALUES)
    // ─────────────────────────────────────────────────────────────────────────────
    public static class SpecialistPageData
    {


    public static string DapperSQL = @"
-- SPECIALIST MAIN
WITH clinic_ctx AS (
    SELECT
        ps.staff_id,
        ps.service_provider_id,
        ps.is_active AS provider_staff_active,
        ps.create_date AS provider_staff_create_date,
        sp.id AS clinic_id,
        sp.name_translations AS clinic_name_translations,
        sp.city,
        sp.country,
        sp.response_time,
        sp.success_rate AS clinic_success_rate,
        sp.is_active AS clinic_is_active,
        sp.image_url AS clinic_image_url,
        sp.languages AS clinic_languages
    FROM category.provider_staffs ps
    JOIN category.service_providers sp
        ON sp.id = ps.service_provider_id
    WHERE ps.staff_id = @SpecialistId
    ORDER BY ps.is_active DESC, ps.create_date ASC
    LIMIT 1
)
SELECT
    s.id::text AS Id,
    common.get_translation_t(s.name_translations, @CurrentLocale, @DefaultLocale) AS Name,
    common.get_translation_t(s.title_translations, @CurrentLocale, @DefaultLocale) AS Title,
    COALESCE(
        NULLIF(common.get_translation_t(s.specialty_translations, @CurrentLocale, @DefaultLocale), ''),
        NULLIF(BTRIM(s.specialty), ''),
        ''
    ) AS Specialty,
    COALESCE(
        (
            SELECT sgi.url
            FROM category.staff_gallery_items sgi
            WHERE sgi.staff_id = s.id
              AND sgi.media_type = 'image'
              AND sgi.url IS NOT NULL
              AND BTRIM(sgi.url) <> ''
            ORDER BY sgi.is_primary DESC, sgi.display_order, sgi.create_date
            LIMIT 1
        ),
        NULLIF(BTRIM(s.profile_image_url), ''),
        (
            SELECT pgi.url
            FROM clinic_ctx cc
            JOIN category.provider_gallery_items pgi
                ON pgi.service_provider_id = cc.service_provider_id
            WHERE pgi.media_type = 'image'
              AND pgi.url IS NOT NULL
              AND BTRIM(pgi.url) <> ''
            ORDER BY pgi.display_order, pgi.create_date
            LIMIT 1
        ),
        (
            SELECT NULLIF(BTRIM(cc.clinic_image_url), '')
            FROM clinic_ctx cc
        ),
        ''
    ) AS Image,
    COALESCE(s.rating, 0) AS Rating,
    COALESCE(s.review_count, 0) AS Reviews,
    COALESCE(
        s.experience_years,
        NULLIF(regexp_replace(COALESCE(s.experience, ''), '[^0-9]', '', 'g'), '')::int,
        0
    ) AS Experience,
    COALESCE(s.patients, '') AS Patients,
    COALESCE(
        NULLIF(BTRIM(s.success_rate), ''),
        (SELECT COALESCE(cc.clinic_success_rate, '') FROM clinic_ctx cc),
        ''
    ) AS SuccessRate,
    COALESCE(
        (
            SELECT (COALESCE(cc.provider_staff_active, false) AND COALESCE(cc.clinic_is_active, false))
            FROM clinic_ctx cc
        ),
        false
    ) AS Verified,
    COALESCE(
        (
            SELECT common.get_translation_t(cc.clinic_name_translations, @CurrentLocale, @DefaultLocale)
            FROM clinic_ctx cc
        ),
        ''
    ) AS Clinic,
    COALESCE(
        (
            SELECT cc.clinic_id::text
            FROM clinic_ctx cc
        ),
        ''
    ) AS ClinicId,
    COALESCE(
        (
            SELECT TRIM(
                CONCAT_WS(', ',
                    NULLIF(common.get_translation_t(city_loc.value_translations, @CurrentLocale, @DefaultLocale), ''),
                    NULLIF(common.get_translation_t(country_loc.value_translations, @CurrentLocale, @DefaultLocale), '')
                )
            )
            FROM clinic_ctx cc
            LEFT JOIN category.locations country_loc
                ON country_loc.code = cc.country
               AND country_loc.location_type_id = 1
            LEFT JOIN category.locations city_loc
                ON city_loc.code = cc.city
               AND city_loc.location_type_id = 2
        ),
        ''
    ) AS Location,
    COALESCE(
        (
            SELECT cc.response_time
            FROM clinic_ctx cc
        ),
        ''
    ) AS ResponseTime,
    COALESCE(s.consultation_fee, 0) AS ConsultationFee
FROM category.staff s
WHERE s.id = @SpecialistId;

-- LANGUAGES
WITH clinic_ctx AS (
    SELECT sp.languages AS clinic_languages
    FROM category.provider_staffs ps
    JOIN category.service_providers sp
        ON sp.id = ps.service_provider_id
    WHERE ps.staff_id = @SpecialistId
    ORDER BY ps.is_active DESC, ps.create_date ASC
    LIMIT 1
)
SELECT language
FROM (
    SELECT sl.language, 1 AS source_rank
    FROM category.staff_languages sl
    WHERE sl.staff_id = @SpecialistId

    UNION ALL

    SELECT unnest(COALESCE((SELECT clinic_languages FROM clinic_ctx), ARRAY[]::text[])) AS language, 2 AS source_rank
    WHERE NOT EXISTS (
        SELECT 1
        FROM category.staff_languages sl
        WHERE sl.staff_id = @SpecialistId
    )
) x
WHERE NULLIF(BTRIM(language), '') IS NOT NULL
ORDER BY source_rank, language;

-- SPECIALIZATIONS
SELECT specialization
FROM (
    SELECT ss.specialty AS specialization, 1 AS source_rank
    FROM category.staff_specializations ss
    WHERE ss.staff_id = @SpecialistId

    UNION ALL

    SELECT
        COALESCE(
            NULLIF(common.get_translation_t(s.specialty_translations, @CurrentLocale, @DefaultLocale), ''),
            NULLIF(BTRIM(s.specialty), '')
        ) AS specialization,
        2 AS source_rank
    FROM category.staff s
    WHERE s.id = @SpecialistId
      AND NOT EXISTS (
          SELECT 1
          FROM category.staff_specializations ss
          WHERE ss.staff_id = @SpecialistId
      )
) x
WHERE NULLIF(BTRIM(specialization), '') IS NOT NULL
ORDER BY source_rank, specialization;

-- EDUCATION
SELECT
    se.degree AS Degree,
    se.institution AS Institution,
    se.year::text AS Year
FROM category.staff_education se
WHERE se.staff_id = @SpecialistId
ORDER BY se.year DESC NULLS LAST, se.create_date DESC;

-- CERTIFICATIONS
SELECT
    x.Name,
    x.Issuer,
    x.Verified
FROM (
    SELECT
        sc.name AS Name,
        sc.issuer AS Issuer,
        sc.is_verified AS Verified,
        1 AS source_rank,
        sc.create_date
    FROM category.staff_certifications sc
    WHERE sc.staff_id = @SpecialistId

    UNION ALL

    SELECT
        scr.credential AS Name,
        NULL::text AS Issuer,
        scr.is_verified AS Verified,
        2 AS source_rank,
        NULL::timestamptz AS create_date
    FROM category.staff_credentials scr
    WHERE scr.staff_id = @SpecialistId
      AND NOT EXISTS (
          SELECT 1
          FROM category.staff_certifications sc
          WHERE sc.staff_id = @SpecialistId
      )
) x
ORDER BY x.source_rank, x.create_date DESC NULLS LAST, x.Name;

-- ACHIEVEMENTS
SELECT
    CASE
        WHEN LOWER(COALESCE(sa.icon, '')) IN ('users', 'user', 'patients') THEN 'Users'
        WHEN LOWER(COALESCE(sa.icon, '')) IN ('star', 'rating', 'favorite') THEN 'Star'
        WHEN LOWER(COALESCE(sa.icon, '')) IN ('trendingup', 'trending_up', 'trend', 'growth') THEN 'TrendingUp'
        ELSE 'Award'
    END AS Icon,
    sa.title AS Title,
    COALESCE(sa.organization, '') AS Organization
FROM category.staff_achievements sa
WHERE sa.staff_id = @SpecialistId
ORDER BY sa.display_order, sa.create_date DESC;

-- BEFORE / AFTER
SELECT
    sba.before_image AS Before,
    sba.after_image AS After,
    COALESCE(sba.procedure, '') AS Procedure,
    COALESCE(sba.months::text, '') AS Months
FROM category.staff_before_after sba
WHERE sba.staff_id = @SpecialistId
ORDER BY sba.display_order, sba.create_date DESC;

-- REVIEWS
WITH clinic_ctx AS (
    SELECT ps.service_provider_id
    FROM category.provider_staffs ps
    WHERE ps.staff_id = @SpecialistId
    ORDER BY ps.is_active DESC, ps.create_date ASC
    LIMIT 1
)
SELECT
    c.id::text AS Id,
    c.customer_name AS Name,
    COALESCE(c.country, '') AS Country,
    c.create_date::date::text AS Date,
    COALESCE(c.rating, 0) AS Rating,
    COALESCE(c.treatment, '') AS Treatment,
    c.comment_text AS ReviewText,
    c.is_verified AS Verified,
    COALESCE(c.helpful_count, 0) AS Helpful
FROM category.service_provider_comments c
WHERE c.service_provider_id = (SELECT service_provider_id FROM clinic_ctx)
  AND c.is_public = true
ORDER BY c.create_date DESC
LIMIT 10;

-- REVIEW IMAGES
WITH clinic_ctx AS (
    SELECT ps.service_provider_id
    FROM category.provider_staffs ps
    WHERE ps.staff_id = @SpecialistId
    ORDER BY ps.is_active DESC, ps.create_date ASC
    LIMIT 1
),
review_ids AS (
    SELECT c.id
    FROM category.service_provider_comments c
    WHERE c.service_provider_id = (SELECT service_provider_id FROM clinic_ctx)
      AND c.is_public = true
    ORDER BY c.create_date DESC
    LIMIT 10
)
SELECT
    ri.review_id::text AS ReviewId,
    ri.image_url AS ImageUrl
FROM category.review_images ri
WHERE ri.review_id IN (SELECT id FROM review_ids);";
    /*public static string DapperSQL = @"
-- SPECIALIST MAIN
SELECT 
    s.id::text AS Id,
    s.name_translations->>'en' AS Name,
    s.title_translations->>'en' AS Title,
    s.specialty_translations->>'en' AS Specialty,
    s.profile_image_url AS Image,
    s.rating,
    s.review_count AS Reviews,
    s.experience_years AS Experience,
    s.patients,
    s.success_rate,
    ps.is_active AS Verified,
    sp.name_translations->>'en' AS Clinic,
    sp.id::text AS ClinicId,
    (sp.city || ', ' || sp.country) AS Location,
    sp.response_time AS ResponseTime,
    s.consultation_fee
FROM category.provider_staffs ps
JOIN category.staff s ON s.id = ps.staff_id
JOIN category.service_providers sp ON sp.id = ps.service_provider_id
WHERE s.id = @SpecialistId;

-- LANGUAGES
SELECT language
FROM category.staff_languages
WHERE staff_id = @SpecialistId;

-- SPECIALIZATIONS
SELECT specialty
FROM category.staff_specializations
WHERE staff_id = @SpecialistId;

-- EDUCATION
SELECT 
    degree,
    institution,
    year
FROM category.staff_education
WHERE staff_id = @SpecialistId
ORDER BY year DESC;

-- CERTIFICATIONS
SELECT 
    name,
    issuer,
    is_verified AS Verified
FROM category.staff_certifications
WHERE staff_id = @SpecialistId;

-- ACHIEVEMENTS
SELECT 
    icon,
    title,
    organization
FROM category.staff_achievements
WHERE staff_id = @SpecialistId;

-- BEFORE / AFTER
SELECT 
    before_image AS Before,
    after_image AS After,
    procedure,
    months
FROM category.staff_before_after
WHERE staff_id = @SpecialistId;

-- REVIEWS
SELECT 
    id,
    customer_name AS Name,
    country,
    create_date::date::text AS Date,
    rating,
    treatment,
    comment_text AS ReviewText,
    is_verified AS Verified,
    helpful_count AS Helpful
FROM category.service_provider_comments
WHERE service_provider_id = (
    SELECT service_provider_id 
    FROM category.provider_staffs 
    WHERE staff_id = @SpecialistId
    LIMIT 1
)
ORDER BY create_date DESC
LIMIT 10;

-- REVIEW IMAGES
SELECT review_id, image_url
FROM category.review_images;";*/
    /*// ── 1️⃣  Specialist ----------------------------------------------
    public static readonly Specialist Specialist = new Specialist
        {
            Id = "1",
            Name = "John Doe",
            Title = "Senior Backend Engineer",
            Specialty = "Software Engineering",
            Image = "https://example.com/images/john.png",
            Rating = 4.8,
            Reviews = 12,
            Experience = 6,
            Patients = "100+",
            SuccessRate = "95%",
            Verified = true,
            Languages = new() { "English", "Spanish" },
            Clinic = "Tech Solutions Clinic",
            ClinicId = "CLN-101",
            Location = "Los Angeles, CA",
            ResponseTime = "24-48h",
            ConsultationFee = 250m
        };

        // ── 2️⃣  Education ----------------------------------------------
        public static readonly List<EducationEntry> Education = new()
        {
            new EducationEntry
            {
                Degree = "BS Computer Science",
                Institution = "MIT",
                Year = "2005"
            },
            new EducationEntry
            {
                Degree = "MS Software Engineering",
                Institution = "Stanford",
                Year = "2007"
            }
        };

        // ── 3️⃣  Certifications -----------------------------------------
        public static readonly List<Certification> Certifications = new()
        {
            new Certification
            {
                Name = "Certified Scrum Master",
                Issuer = "Scrum Alliance",
                Verified = true
            },
            new Certification
            {
                Name = "AWS Solutions Architect – Associate",
                Issuer = "Amazon",
                Verified = true
            }
        };

        // ── 4️⃣  Achievements ---------------------------------------------
        public static readonly List<Achievement> Achievements = new()
        {
            new Achievement
            {
                Icon = IconType.Award,
                Title = "Top Rated Backend Engineer 2021",
                Organization = "Engineering Guild"
            },
            new Achievement
            {
                Icon = IconType.Star,
                Title = "100+ 5‑Star Reviews",
                Organization = "Tech Solutions Clinic"
            },
            new Achievement
            {
                Icon = IconType.TrendingUp,
                Title = "100% Success Rate",
                Organization = "Tech Solutions Clinic"
            }
        };

        // ── 5️⃣  Reviews ----------------------------------------------
        public static readonly List<Review> Reviews = new()
        {
            new Review
            {
                Id = 1,
                Name = "Alice Smith",
                Country = "US",
                Date = "2024-07-12",
                Rating = 5,
                Treatment = "Backend Refactor",
                ReviewText = "Amazing! The new architecture increased performance by 25%.",
                Verified = true,
                Helpful = 8,
                Images = null
            },
            new Review
            {
                Id = 2,
                Name = "Bob Johnson",
                Country = "CA",
                Date = "2024-07-10",
                Rating = 4,
                Treatment = "Microservices Migration",
                ReviewText = "Great support and clear documentation.",
                Verified = false,
                Helpful = 4,
                Images = new() { "https://example.com/images/review2a.png" }
            }
        };

        // ── 6️⃣  Before/After -----------------------------------------
        public static readonly List<BeforeAfter> BeforeAfter = new()
        {
            new BeforeAfter
            {
                Before = "https://example.com/images/before1.png",
                After = "https://example.com/images/after1.png",
                Procedure = "Full‑stack overhaul",
                Months = "3"
            },
            new BeforeAfter
            {
                Before = "https://example.com/images/before2.png",
                After = "https://example.com/images/after2.png",
                Procedure = "API optimisation",
                Months = "2"
            }
        };

        // ── 7️⃣  Final payload (the whole array as one object) ----------
        public static readonly GetSpecialistPageResponse Response = new GetSpecialistPageResponse
        {
            Specialist = Specialist,
            Education = Education,
            Certifications = Certifications,
            Achievements = Achievements,
            Specializations = new() { "Backend Development", "Cloud Architecture", "Microservices" },
            RecentReviews = Reviews,
            BeforeAfter = BeforeAfter
        };*/
    }
