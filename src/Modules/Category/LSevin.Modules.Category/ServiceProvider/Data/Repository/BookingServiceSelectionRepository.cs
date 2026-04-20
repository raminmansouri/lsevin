using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetProvidersByServiceAndSpecialist;
using LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetServicesByProviderAndSpecialist;
using LSevin.Modules.Category.ServiceProvider.Features.GetBookingSpecialistByProviderAndService;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static BuildingBlocks.Core.Observability.TelemetryTags.Tracing;

namespace LSevin.Modules.Category.ServiceProvider.Data.Repository
{

    public class GetBookingSelectionResponse
    {
        public List<GetBookingServiceSelectionDataProvider> Providers { get; internal set; }
        public List<GetBookingGetServicesByProviderAndSpecialistService> Services { get; internal set; }
        public List<GetBookingServiceSelectionDataSpecialist> Specialists { get; internal set; }
    }

    public class BookingServiceSelectionRepository
    {
        private readonly IDbConnection _db;

        public BookingServiceSelectionRepository(IDbConnection db)
            => _db = db ?? throw new ArgumentNullException(nameof(db));

        // ─────────────────────────────────────────────────────────────────────────
        // 1. PROVIDERS
        //
        //    Source table : category.service_providers
        //    Column mapping:
        //      id                      → Id
        //      name_translations       → Name    (JSONB, locale-resolved)
        //      description_translations→ Description
        //      rating                  → Rating
        //      accredited              → Verified
        //      is_sponsored            → Popular
        //      image_url               → Image   (added via migration)
        //
        //    No child rows → plain QueryAsync, no multi-mapping.
        // ─────────────────────────────────────────────────────────────────────────

private static void EnsureAtLeastOneFilter(
    Guid? providerId,
    Guid? serviceId,
    Guid? specialistId)
    {
      /*  if (providerId is null && serviceId is null && specialistId is null)
        {
            throw new ArgumentException(
                "At least one of providerId, serviceId, specialistId must be provided.");
        }*/
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. PROVIDERS
    // ─────────────────────────────────────────────────────────────────────────────
    public async Task<List<GetBookingServiceSelectionDataProvider>> GetProvidersAsync(
        Guid? providerId,
        Guid? serviceId,
        Guid? specialistId,
        string locale = "en",
        CancellationToken ct = default)
    {
        EnsureAtLeastOneFilter(providerId, serviceId, specialistId);

        const string sql = """
    SELECT
        sp.id::text                                                        AS "Id",
        common.get_translation_t(sp.name_translations, @Locale, 'en')      AS "Name",
        common.get_translation_t(sp.description_translations, @Locale, 'en') AS "Description",
        COALESCE(sp.rating, 0)::double precision                           AS "Rating",
        COALESCE(sp.accredited, false)                                     AS "Verified",
        COALESCE(sp.is_sponsored, false)                                   AS "Popular",
        COALESCE(sp.image_url, '')                                         AS "Image"
    FROM category.service_providers sp
    WHERE sp.is_active = true
      AND (@ProviderId IS NULL OR sp.id = @ProviderId)
      AND (
            @ServiceId IS NULL
            OR EXISTS (
                SELECT 1
                FROM category.provider_services ps
                WHERE ps.id = @ServiceId
                  AND ps.service_provider_id = sp.id
                  AND ps.is_active = true
            )
          )
      AND (
            @SpecialistId IS NULL
            OR EXISTS (
                SELECT 1
                FROM category.provider_staffs pss
                WHERE pss.service_provider_id = sp.id
                  AND pss.staff_id = @SpecialistId
                  AND pss.is_active = true
            )
          )
    ORDER BY
        sp.featured_score DESC NULLS LAST,
        sp.rating DESC NULLS LAST;
    """;

        var cmd = new CommandDefinition(
            sql,
            new
            {
                ProviderId = providerId,
                ServiceId = serviceId,
                SpecialistId = specialistId,
                Locale = locale
            },
            cancellationToken: ct);

        var rows = await _db.QueryAsync<GetBookingServiceSelectionDataProvider>(cmd);
        return rows.AsList();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. SERVICES
    // ─────────────────────────────────────────────────────────────────────────────
    public async Task<List<GetBookingGetServicesByProviderAndSpecialistService>> GetServicesAsync(
        Guid? providerId,
        Guid? serviceId,
        Guid? specialistId,
        string locale = "en",
        CancellationToken ct = default)
    {
        EnsureAtLeastOneFilter(providerId, serviceId, specialistId);

        const string sql = """
    SELECT
        ps.id::text                                                          AS "Id",
        common.get_translation_t(ps.display_name_translations, @Locale, 'en') AS "Name",
        common.get_translation_t(ps.description_translations, @Locale, 'en')  AS "Description",
        ps.duration_minutes::text || ' min'                                  AS "Duration",
        common.get_translation_t(sp.name_translations, @Locale, 'en')        AS "Provider",
        COALESCE(ps.rating, 0)::int                                          AS "Rating",
        CASE WHEN COALESCE(sp.accredited, false) THEN 1 ELSE 0 END           AS "Accreditation",
        COALESCE(ps.value, 0)::int                                           AS "Price",
        common.get_translation_t(cat.name_translations, @Locale, 'en')       AS "Category",
        COALESCE(ps.is_popular, false)                                       AS "Popular",
        COALESCE(ps.image_url, '')                                           AS "Image"
    FROM category.provider_services ps
    JOIN category.service_providers sp
      ON sp.id = ps.service_provider_id
    JOIN category.service_definitions sd
      ON sd.id = ps.service_definition_id
    JOIN category.categories cat
      ON cat.id = sd.category_id
    WHERE ps.is_active = true
      AND sp.is_active = true
      AND sd.is_active = true
      AND (@ProviderId IS NULL OR ps.service_provider_id = @ProviderId)
      AND (@ServiceId IS NULL OR ps.id = @ServiceId)
      AND (
            @SpecialistId IS NULL
            OR (
                EXISTS (
                    SELECT 1
                    FROM category.provider_staffs pss
                    WHERE pss.service_provider_id = ps.service_provider_id
                      AND pss.staff_id = @SpecialistId
                      AND pss.is_active = true
                )
                AND EXISTS (
                    SELECT 1
                    FROM category.staff_services ss
                    WHERE ss.staff_id = @SpecialistId
                      AND ss.service_definition_id = ps.service_definition_id
                      AND ss.is_active = true
                )
            )
          )
    ORDER BY
        ps.trending_score DESC NULLS LAST,
        ps.rating DESC NULLS LAST;
    """;

        var cmd = new CommandDefinition(
            sql,
            new
            {
                ProviderId = providerId,
                ServiceId = serviceId,
                SpecialistId = specialistId,
                Locale = locale
            },
            cancellationToken: ct);

        var rows = await _db.QueryAsync<GetBookingGetServicesByProviderAndSpecialistService>(cmd);
        return rows.AsList();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. SPECIALISTS  (specialist = category.staff)
    // ─────────────────────────────────────────────────────────────────────────────
    public async Task<List<GetBookingServiceSelectionDataSpecialist>> GetSpecialistsAsync(
        Guid? providerId,
        Guid? serviceId,
        Guid? specialistId,
        string locale = "en",
        CancellationToken ct = default)
    {
        EnsureAtLeastOneFilter(providerId, serviceId, specialistId);

        const string sql = """
    SELECT
        st.id::text                                                            AS "Id",
        common.get_translation_t(st.name_translations, @Locale, 'en')          AS "Name",
        COALESCE(
            common.get_translation_t(st.specialty_translations, @Locale, 'en'),
            COALESCE(st.specialty, '')
        )                                                                      AS "Specialty",
        COALESCE(st.experience, '')                                            AS "Experience",
        COALESCE(st.rating, 0)::double precision                               AS "Rating",
        COALESCE(st.review_count, 0)                                           AS "Reviews",
        COALESCE(st.patients, '')                                              AS "Patients",
        COALESCE(lang.languages, ARRAY[]::text[])                              AS "Languages",
        st.is_active                                                           AS "Verified",
        COALESCE(st.consultation_fee, 0)::int                                  AS "Consultation",
        COALESCE(st.profile_image_url, '')                                     AS "Image",
        COALESCE(st.next_available_label, '')                                  AS "NextAvailable",

        sc.id                                                                  AS cred_id,
        sc.staff_id                                                            AS cred_staff_id,
        sc.credential                                                          AS "Credential"
    FROM category.staff st
    LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(sl.language ORDER BY sl.language) AS languages
        FROM category.staff_languages sl
        WHERE sl.staff_id = st.id
    ) lang ON true
    LEFT JOIN category.staff_credentials sc
      ON sc.staff_id = st.id
    WHERE st.is_active = true
      AND (@SpecialistId IS NULL OR st.id = @SpecialistId)
      AND (
            @ProviderId IS NULL
            OR EXISTS (
                SELECT 1
                FROM category.provider_staffs pss
                WHERE pss.staff_id = st.id
                  AND pss.service_provider_id = @ProviderId
                  AND pss.is_active = true
            )
          )
      AND (
            @ServiceId IS NULL
            OR EXISTS (
                SELECT 1
                FROM category.provider_services psf
                JOIN category.provider_staffs pss
                  ON pss.service_provider_id = psf.service_provider_id
                 AND pss.staff_id = st.id
                 AND pss.is_active = true
                JOIN category.staff_services ss
                  ON ss.staff_id = st.id
                 AND ss.service_definition_id = psf.service_definition_id
                 AND ss.is_active = true
                WHERE psf.id = @ServiceId
                  AND psf.is_active = true
            )
          )
    ORDER BY
        st.rating DESC NULLS LAST,
        st.review_count DESC NULLS LAST,
        st.id,
        sc.id;
    """;

        return await ExecuteSpecialistMultiMapAsync(
            sql,
            new
            {
                ProviderId = providerId,
                ServiceId = serviceId,
                SpecialistId = specialistId,
                Locale = locale
            },
            ct);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // FILTERED OVERLOADS
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<List<GetBookingServiceSelectionDataSpecialist>> ExecuteSpecialistMultiMapAsync(
    string sql,
    object param,
    CancellationToken ct = default)
    {
        var lookup = new Dictionary<string, GetBookingServiceSelectionDataSpecialist>();

        var cmd = new CommandDefinition(sql, param, cancellationToken: ct);

        await _db.QueryAsync<GetBookingServiceSelectionDataSpecialist, SpecialistCredentialRow, GetBookingServiceSelectionDataSpecialist>(
            cmd,
            (specialist, credential) =>
            {
                if (!lookup.TryGetValue(specialist.Id, out var existing))
                {
                    existing = specialist;
                    existing.Credentials ??= [];
                    lookup.Add(existing.Id, existing);
                }

                if (credential is not null && !string.IsNullOrWhiteSpace(credential.Credential))
                {
                    existing.Credentials ??= [];
                    var list = existing.Credentials.ToList();
                    list.Add(credential.Credential);
                    existing.Credentials= list.ToArray();
                }

                return existing;
            },
            splitOn: "cred_id");

        return lookup.Values.ToList();
    }

    private sealed class SpecialistCredentialRow
    {
        public Guid? cred_id { get; set; }
        public Guid? cred_staff_id { get; set; }
        public string? Credential { get; set; }
}

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Shared multi-mapping execution used by every specialist query.
    /// Deduplicates on <c>Id</c> and accumulates credential strings.
    /// </summary>
    private async Task<List<GetBookingServiceSelectionDataSpecialist>> ExecuteSpecialistMultiMapAsync(
            string sql,
            object param)
        {
            var map = new Dictionary<string, GetBookingServiceSelectionDataSpecialist>();

            await _db.QueryAsync<SpecialistRow, CredentialRow, GetBookingServiceSelectionDataSpecialist>(
                sql,
                map: (row, cred) =>
                {
                    if (!map.TryGetValue(row.Id, out var dto))
                    {
                        dto = new GetBookingServiceSelectionDataSpecialist
                        {
                            Id = row.Id,
                            Name = row.Name,
                            Specialty = row.Specialty,
                            Experience = row.Experience,
                            Rating = row.Rating,
                            Reviews = row.Reviews,
                            Patients = row.Patients,
                            Languages = row.Languages,
                            Verified = row.Verified,
                            Consultation = row.Consultation,
                            Image = row.Image,
                            NextAvailable = row.NextAvailable,
                            Credentials = Array.Empty<string>(),
                        };
                        map[row.Id] = dto;
                    }

                    if (cred?.Credential is not null)
                    {
                        var list = dto.Credentials.ToList();
                        list.Add(cred.Credential);
                        dto.Credentials = list.ToArray();
                    }

                    return dto;
                },
                param: param,
                splitOn: "cred_id",
                commandType: CommandType.Text
            );

            return map.Values.ToList();
        }

        // ── Intermediate row types ────────────────────────────────────────────────

        /// <summary>Left side of the specialist multi-mapping join (up to cred_id).</summary>
        private sealed class SpecialistRow
        {
            public string Id { get; init; } = null!;
            public string Name { get; init; } = null!;
            public string Specialty { get; init; } = null!;
            public string Experience { get; init; } = null!;
            public double Rating { get; init; }
            public int Reviews { get; init; }
            public string Patients { get; init; } = null!;
            public string[] Languages { get; init; } = Array.Empty<string>();
            public bool Verified { get; init; }
            public int Consultation { get; init; }
            public string Image { get; init; } = null!;
            public string NextAvailable { get; init; } = null!;
        }

        /// <summary>Right side of the multi-mapping join – one row per credential.</summary>
        private sealed class CredentialRow
        {
            public Guid? Id { get; init; }   // cred_id – the splitOn column
            public Guid? StaffId { get; init; }   // cred_staff_id
            public string? Credential { get; init; }
        }
    }
}

