using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using System.Data;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetBookingByIdQueryHandler(
  IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) :IQueryHandler<GetBookingByIdQuery, GetBookingByIdResponse>
{
    public async Task<Result<GetBookingByIdResponse>> Handle(
        GetBookingByIdQuery request,
        CancellationToken cancellationToken
    )
    {

        Console.WriteLine("GetBookingById Query called");
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        //parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // Query service provider basic info
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

   
        var searchHistoryResponse = new GetBookingByIdResponse
        {
            Booking= GetBookingByIdDummyData.GetData()
        };


        return searchHistoryResponse;
    }

    public static string DapperSQL = @"
SELECT 
    b.id::text                AS ""Id"",
    ps.display_name_translations->>'en' AS ""Service"",
    sp.name_translations->>'en' AS ""Provider"",

    (
        SELECT url 
        FROM category.provider_gallery_items g 
        WHERE g.service_provider_id = sp.id 
        LIMIT 1
    ) AS ""ProviderImage"",

    b.booking_date::date::text AS ""Date"",
    b.booking_date::time::text AS ""Time"",

    bs.duration               AS ""Duration"",

    sp.city || ', ' || sp.country AS ""Location"",
    sp.address               AS ""FullAddress"",

    b.status                 AS ""Status"",
    b.payment_status         AS ""PaymentStatus"",

    b.total_price::int       AS ""Price"",
    b.deposit               AS ""Deposit"",
    b.remaining             AS ""Remaining"",

    sp.is_verified          AS ""Verified"",

    b.created_at::text      AS ""BookingDate"",
    b.confirmation_code     AS ""ConfirmationCode"",

    -- Contact
    u.phone_number          AS ""Phone"",
    u.email                 AS ""Email"",
    u.address               AS ""Address"",

    -- Agent (Doctor)
    s.name                  AS ""AgentName"",
    s.title                 AS ""AgentTitle"",
    s.experience            AS ""AgentExperience"",
    s.image_url             AS ""AgentImage"",

    -- Included services
    sd.name_translations->>'en' AS ""IncludedName"",
    sd.description_translations->>'en' AS ""IncludedTitle"",
    s.experience            AS ""IncludedExperience""

FROM booking.bookings b

LEFT JOIN booking.booking_services bs 
    ON bs.booking_id = b.id

LEFT JOIN category.provider_services ps 
    ON ps.id = bs.provider_service_id

LEFT JOIN category.service_providers sp 
    ON sp.id = ps.service_provider_id

LEFT JOIN category.service_definitions sd 
    ON sd.id = bs.service_definition_id

LEFT JOIN category.specialists s 
    ON s.id = bs.specialist_id

LEFT JOIN identity.users u 
    ON u.id = b.user_id

WHERE b.id = @BookingId;";


    public async Task<GetBookingByIdResponse> GetBookingById(
    IDbConnection db,
    string bookingId)
    {
        var sql = DapperSQL;

        var bookingDict = new Dictionary<string, BookingRecord>();

        var result = await db.QueryAsync<BookingRecord, Contact, Agent, dynamic>(
            sql,
            (booking, contact, agent) =>
            {
                if (!bookingDict.TryGetValue(booking.id, out var existing))
                {
                    existing = booking;

                    existing.contact = contact;
                    existing.doctor = new Agent
                    {
                        name = agent.name,
                        title = agent.title,
                        experience = agent.experience,
                        image = agent.image
                    };

                    existing.included = new List<INCLUDEDSERVICESTYPE>();

                    bookingDict.Add(existing.id, existing);
                }

                return existing;
            },
            new { BookingId = bookingId },
            splitOn: "Phone,AgentName"
        );

        // 🧩 Handle Included सेवices separately
        var includedSql = @"
        SELECT 
            sd.name_translations->>'en' AS name,
            sd.description_translations->>'en' AS title,
            s.experience AS experience
        FROM booking.booking_services bs
        LEFT JOIN category.service_definitions sd 
            ON sd.id = bs.service_definition_id
        LEFT JOIN category.specialists s 
            ON s.id = bs.specialist_id
        WHERE bs.booking_id = @BookingId;
    ";

        var included = await db.QueryAsync<INCLUDEDSERVICESTYPE>(
            includedSql,
            new { BookingId = bookingId }
        );

        var booking = bookingDict.Values.FirstOrDefault();

        if (booking != null)
            booking.included = included.ToList();

        return new GetBookingByIdResponse
        {
            Booking = booking
        };
    }
}

