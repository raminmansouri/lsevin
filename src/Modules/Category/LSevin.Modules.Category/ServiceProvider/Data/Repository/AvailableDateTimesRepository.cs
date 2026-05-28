using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableDates;
using LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableTimes;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LSevin.Modules.Category.ServiceProvider.Data.Repository
{

    /// <summary>
    /// This is the aggregate I would hydrate with Dapper multi-mapping.
    /// For the actual "available dates" and "available times" endpoints, I would use projection queries,
    /// not multi-mapping, because those endpoints return flat read models.
    /// </summary>
    public sealed class BookingAvailabilityContext
    {
        public Guid ProviderId { get; set; }
        public string ProviderNameTranslationsJson { get; set; } = "{}";
        public string Country { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string TimezoneId { get; set; } = "UTC";

        public Guid ProviderServiceId { get; set; }
        public Guid ServiceDefinitionId { get; set; }
        public int DurationMinutes { get; set; }
        public int SlotIntervalMinutes { get; set; }

        public Guid SpecialistId { get; set; }
        public string SpecialistNameTranslationsJson { get; set; } = "{}";
        public string SpecialistTitleTranslationsJson { get; set; } = "{}";

        public List<AvailabilityRule> AvailabilityRules { get; } = new();
    }

    public sealed class AvailabilityRule
    {
        public Guid AvailabilityId { get; set; }
        public int DayOfWeek { get; set; }                  // ISO day: 1=Mon .. 7=Sun
        public bool IsRecurring { get; set; }
        public int AvailabilityStatusId { get; set; }
        public string AvailabilityStatusName { get; set; } = string.Empty;
        public DateTimeOffset? SpecificDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }

    public sealed class AvailableDateTimesRepository
    {
        private readonly IDbConnection _db;

        public AvailableDateTimesRepository(IDbConnection db)
        {
            _db = db;
        }

        /// <summary>
        /// Assumption:
        /// request.serviceId == category.provider_services.id
        /// This is the correct booking-side identifier because provider_services contains provider-specific
        /// duration, price, activation state, and slot settings.
        /// </summary>
        public async Task<BookingAvailabilityContext?> GetBookingAvailabilityContextAsync(
            GetBookingAvailableDatesRequest request,
            CancellationToken cancellationToken = default)
        {
            const string sql = """
        SELECT
            sp.id                                  AS ProviderId,
            sp.name_translations::text             AS ProviderNameTranslationsJson,
            sp.country                             AS Country,
            sp.city                                AS City,
            sp.timezone_id                         AS TimezoneId,

            ps.id                                  AS ProviderServiceId,
            ps.service_definition_id               AS ServiceDefinitionId,
            COALESCE(NULLIF(ps.duration_minutes, 0), sd.duration_minutes) AS DurationMinutes,
            COALESCE(NULLIF(ps.slot_interval_minutes, 0), COALESCE(NULLIF(ps.duration_minutes, 0), sd.duration_minutes)) AS SlotIntervalMinutes,

            s.id                                   AS SpecialistId,
            s.name_translations::text              AS SpecialistNameTranslationsJson,
            s.title_translations::text             AS SpecialistTitleTranslationsJson,

            sa.id                                  AS AvailabilityId,
            sa.day_of_week                         AS DayOfWeek,
            sa.is_recurring                        AS IsRecurring,
            sa.availability_status_id              AS AvailabilityStatusId,
            sas.name                               AS AvailabilityStatusName,
            sa.specific_date                       AS SpecificDate,
            sa.start_time                          AS StartTime,
            sa.end_time                            AS EndTime
        FROM category.provider_services ps
        INNER JOIN category.service_definitions sd
            ON sd.id = ps.service_definition_id
        INNER JOIN category.service_providers sp
            ON sp.id = ps.service_provider_id
           AND sp.is_active = TRUE
        INNER JOIN category.provider_staffs pst
            ON pst.service_provider_id = sp.id
           AND pst.staff_id = @SpecialistId
           AND pst.is_active = TRUE
        INNER JOIN category.staff s
            ON s.id = pst.staff_id
           AND s.is_active = TRUE
        INNER JOIN category.staff_services ss
            ON ss.staff_id = s.id
           AND ss.service_definition_id = ps.service_definition_id
           AND ss.is_active = TRUE
        LEFT JOIN category.staff_availabilities sa
            ON sa.staff_id = s.id
        LEFT JOIN category.staff_availability_statuses sas
            ON sas.id = sa.availability_status_id
        WHERE ps.id = @ServiceId
          AND ps.service_provider_id = @ProviderId
          AND ps.is_active = TRUE
        ORDER BY sa.is_recurring DESC, sa.day_of_week, sa.specific_date, sa.start_time;
        """;

            BookingAvailabilityContext? aggregate = null;
            var availabilityIds = new HashSet<Guid>();

            await _db.QueryAsync<BookingAvailabilityContext, AvailabilityRule, BookingAvailabilityContext>(
                new CommandDefinition(
                    commandText: sql,
                    parameters: new
                    {
                        ProviderId = Guid.Parse(request.providerId),
                        ServiceId = Guid.Parse(request.serviceId),
                        SpecialistId = Guid.Parse(request.specialistId)
                    },
                    cancellationToken: cancellationToken),
                map: (ctx, rule) =>
                {
                    if (aggregate is null)
                    {
                        aggregate = ctx;
                    }

                    if (rule is not null &&
                        rule.AvailabilityId != Guid.Empty &&
                        availabilityIds.Add(rule.AvailabilityId))
                    {
                        aggregate.AvailabilityRules.Add(rule);
                    }

                    return aggregate;
                },
                splitOn: "AvailabilityId");

            return aggregate;
        }

        /// <summary>
        /// Returns a 30-day calendar by default.
        /// The request contract does not contain a date range, so the horizon must come from code or configuration.
        /// </summary>
        public async Task<GetBookingAvailableDatesResponse> GetAvailableDatesAsync(
            GetBookingAvailableDatesRequest request,
            int daysAhead = 30,
            CancellationToken cancellationToken = default)
        {
            var fromDate = DateOnly.FromDateTime(DateTime.UtcNow.Date);
            var toDate = fromDate.AddDays(daysAhead - 1);

            const string sql = """
        WITH ctx AS (
            SELECT
                sp.id AS provider_id,
                sp.timezone_id,
                ps.id AS provider_service_id,
                ps.service_definition_id,
                COALESCE(NULLIF(ps.duration_minutes, 0), sd.duration_minutes) AS duration_minutes,
                COALESCE(NULLIF(ps.slot_interval_minutes, 0), COALESCE(NULLIF(ps.duration_minutes, 0), sd.duration_minutes)) AS slot_interval_minutes,
                s.id AS specialist_id
            FROM category.provider_services ps
            INNER JOIN category.service_definitions sd
                ON sd.id = ps.service_definition_id
            INNER JOIN category.service_providers sp
                ON sp.id = ps.service_provider_id
               AND sp.is_active = TRUE
            INNER JOIN category.provider_staffs pst
                ON pst.service_provider_id = sp.id
               AND pst.staff_id = @SpecialistId
               AND pst.is_active = TRUE
            INNER JOIN category.staff s
                ON s.id = pst.staff_id
               AND s.is_active = TRUE
            INNER JOIN category.staff_services ss
                ON ss.staff_id = s.id
               AND ss.service_definition_id = ps.service_definition_id
               AND ss.is_active = TRUE
            WHERE ps.id = @ServiceId
              AND ps.service_provider_id = @ProviderId
              AND ps.is_active = TRUE
        ),
        days AS (
            SELECT d::date AS booking_date
            FROM generate_series(@FromDate::date, @ToDate::date, interval '1 day') AS d
        ),
        open_windows AS (
            SELECT
                d.booking_date,
                (time '00:00' + sa.start_time)::time AS start_time,
                (time '00:00' + sa.end_time)::time AS end_time
            FROM days d
            CROSS JOIN ctx c
            INNER JOIN category.staff_availabilities sa
                ON sa.staff_id = c.specialist_id
            INNER JOIN category.staff_availability_statuses sas
                ON sas.id = sa.availability_status_id
            WHERE lower(sas.name) IN ('available', 'open', 'working')
              AND (
                    (sa.is_recurring = TRUE AND sa.day_of_week = EXTRACT(ISODOW FROM d.booking_date))
                    OR
                    (
                        sa.is_recurring = FALSE
                        AND sa.specific_date IS NOT NULL
                        AND (sa.specific_date AT TIME ZONE c.timezone_id)::date = d.booking_date
                    )
                  )
        ),
        blocked_windows AS (
            SELECT
                d.booking_date,
                (time '00:00' + sa.start_time)::time AS start_time,
                (time '00:00' + sa.end_time)::time AS end_time
            FROM days d
            CROSS JOIN ctx c
            INNER JOIN category.staff_availabilities sa
                ON sa.staff_id = c.specialist_id
            INNER JOIN category.staff_availability_statuses sas
                ON sas.id = sa.availability_status_id
            WHERE lower(sas.name) IN ('blocked', 'unavailable', 'leave', 'break')
              AND (
                    (sa.is_recurring = TRUE AND sa.day_of_week = EXTRACT(ISODOW FROM d.booking_date))
                    OR
                    (
                        sa.is_recurring = FALSE
                        AND sa.specific_date IS NOT NULL
                        AND (sa.specific_date AT TIME ZONE c.timezone_id)::date = d.booking_date
                    )
                  )
        ),
        candidate_slots AS (
            SELECT
                ow.booking_date,
                gs AS slot_start,
                gs + make_interval(mins => c.duration_minutes) AS slot_end
            FROM open_windows ow
            CROSS JOIN ctx c
            CROSS JOIN LATERAL generate_series(
                ow.booking_date::timestamp + ow.start_time,
                ow.booking_date::timestamp + ow.end_time - make_interval(mins => c.duration_minutes),
                make_interval(mins => c.slot_interval_minutes)
            ) AS gs
            WHERE NOT EXISTS (
                SELECT 1
                FROM blocked_windows bw
                WHERE bw.booking_date = ow.booking_date
                  AND gs::time < bw.end_time
                  AND (gs + make_interval(mins => c.duration_minutes))::time > bw.start_time
            )
        ),
        free_slots AS (
            SELECT
                cs.booking_date,
                cs.slot_start,
                cs.slot_end
            FROM candidate_slots cs
            CROSS JOIN ctx c
            WHERE NOT EXISTS (
                SELECT 1
                FROM booking.bookings b
                WHERE b.provider_id = c.provider_id
                  AND b.specialist_id = c.specialist_id
                  AND b.selected_date = cs.booking_date
                  AND b.booking_status IN ('Pending', 'Confirmed')
                  AND cs.slot_start::time < b.selected_time_to
                  AND cs.slot_end::time > b.selected_time_from
            )
        )
        SELECT
            to_char(d.booking_date, 'YYYY-MM-DD') AS Date,
            trim(to_char(d.booking_date, 'Dy'))   AS Day,
            EXISTS (
                SELECT 1
                FROM free_slots fs
                WHERE fs.booking_date = d.booking_date
            ) AS Available
        FROM days d
        ORDER BY d.booking_date;
        """;

            var rows = await _db.QueryAsync<GetBookingAvailableDatesDate>(
                new CommandDefinition(
                    commandText: sql,
                    parameters: new
                    {
                        ProviderId = Guid.Parse(request.providerId),
                        ServiceId = Guid.Parse(request.serviceId),
                        SpecialistId = Guid.Parse(request.specialistId),
                        FromDate = fromDate,
                        ToDate = toDate
                    },
                    cancellationToken: cancellationToken));

            return new GetBookingAvailableDatesResponse
            {
                Dates = rows.AsList()
            };
        }

        public async Task<GetBookingAvailableTimesResponse> GetAvailableTimesAsync(
            GetBookingAvailableTimesRequest request,
            CancellationToken cancellationToken = default)
        {
            const string sql = """
        WITH ctx AS (
            SELECT
                sp.id AS provider_id,
                sp.timezone_id,
                ps.id AS provider_service_id,
                ps.service_definition_id,
                COALESCE(NULLIF(ps.duration_minutes, 0), sd.duration_minutes) AS duration_minutes,
                COALESCE(NULLIF(ps.slot_interval_minutes, 0), COALESCE(NULLIF(ps.duration_minutes, 0), sd.duration_minutes)) AS slot_interval_minutes,
                s.id AS specialist_id
            FROM category.provider_services ps
            INNER JOIN category.service_definitions sd
                ON sd.id = ps.service_definition_id
            INNER JOIN category.service_providers sp
                ON sp.id = ps.service_provider_id
               AND sp.is_active = TRUE
            INNER JOIN category.provider_staffs pst
                ON pst.service_provider_id = sp.id
               AND pst.staff_id = @SpecialistId
               AND pst.is_active = TRUE
            INNER JOIN category.staff s
                ON s.id = pst.staff_id
               AND s.is_active = TRUE
            INNER JOIN category.staff_services ss
                ON ss.staff_id = s.id
               AND ss.service_definition_id = ps.service_definition_id
               AND ss.is_active = TRUE
            WHERE ps.id = @ServiceId
              AND ps.service_provider_id = @ProviderId
              AND ps.is_active = TRUE
        ),
        day_input AS (
            SELECT @SelectedDate::date AS booking_date
        ),
        open_windows AS (
            SELECT
                d.booking_date,
                (time '00:00' + sa.start_time)::time AS start_time,
                (time '00:00' + sa.end_time)::time AS end_time
            FROM day_input d
            CROSS JOIN ctx c
            INNER JOIN category.staff_availabilities sa
                ON sa.staff_id = c.specialist_id
            INNER JOIN category.staff_availability_statuses sas
                ON sas.id = sa.availability_status_id
            WHERE lower(sas.name) IN ('available', 'open', 'working')
              AND (
                    (sa.is_recurring = TRUE AND sa.day_of_week = EXTRACT(ISODOW FROM d.booking_date))
                    OR
                    (
                        sa.is_recurring = FALSE
                        AND sa.specific_date IS NOT NULL
                        AND (sa.specific_date AT TIME ZONE c.timezone_id)::date = d.booking_date
                    )
                  )
        ),
        blocked_windows AS (
            SELECT
                d.booking_date,
                (time '00:00' + sa.start_time)::time AS start_time,
                (time '00:00' + sa.end_time)::time AS end_time
            FROM day_input d
            CROSS JOIN ctx c
            INNER JOIN category.staff_availabilities sa
                ON sa.staff_id = c.specialist_id
            INNER JOIN category.staff_availability_statuses sas
                ON sas.id = sa.availability_status_id
            WHERE lower(sas.name) IN ('blocked', 'unavailable', 'leave', 'break')
              AND (
                    (sa.is_recurring = TRUE AND sa.day_of_week = EXTRACT(ISODOW FROM d.booking_date))
                    OR
                    (
                        sa.is_recurring = FALSE
                        AND sa.specific_date IS NOT NULL
                        AND (sa.specific_date AT TIME ZONE c.timezone_id)::date = d.booking_date
                    )
                  )
        ),
        candidate_slots AS (
            SELECT
                ow.booking_date,
                gs AS slot_start,
                gs + make_interval(mins => c.duration_minutes) AS slot_end
            FROM open_windows ow
            CROSS JOIN ctx c
            CROSS JOIN LATERAL generate_series(
                ow.booking_date::timestamp + ow.start_time,
                ow.booking_date::timestamp + ow.end_time - make_interval(mins => c.duration_minutes),
                make_interval(mins => c.slot_interval_minutes)
            ) AS gs
            WHERE NOT EXISTS (
                SELECT 1
                FROM blocked_windows bw
                WHERE bw.booking_date = ow.booking_date
                  AND gs::time < bw.end_time
                  AND (gs + make_interval(mins => c.duration_minutes))::time > bw.start_time
            )
        )
        SELECT
            to_char(cs.slot_start, 'HH12:MI AM') AS Time,
            NOT EXISTS (
                SELECT 1
                FROM booking.bookings b
                CROSS JOIN ctx c
                WHERE b.provider_id = c.provider_id
                  AND b.specialist_id = c.specialist_id
                  AND b.selected_date = cs.booking_date
                  AND b.booking_status IN ('Pending', 'Confirmed')
                  AND cs.slot_start::time < b.selected_time_to
                  AND cs.slot_end::time > b.selected_time_from
            ) AS Available
        FROM candidate_slots cs
        ORDER BY cs.slot_start;
        """;

            var rows = await _db.QueryAsync<GetBookingAvailableTimesTimeSlot>(
                new CommandDefinition(
                    commandText: sql,
                    parameters: new
                    {
                        ProviderId = Guid.Parse(request.providerId),
                        ServiceId = Guid.Parse(request.serviceId),
                        SpecialistId = Guid.Parse(request.specialistId),
                        SelectedDate = DateOnly.Parse(request.selectedDate)
                    },
                    cancellationToken: cancellationToken));

            return new GetBookingAvailableTimesResponse
            {
                TimeSlots = rows.AsList()
            };
        }
    }

}
