using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
<<<<<<< HEAD
using System.Threading;
=======
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class BookingsQueryHandler(
  IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) :IQueryHandler<BookingsQuery, BookingsResponse>
{
    public async Task<Result<BookingsResponse>> Handle(
        BookingsQuery request,
        CancellationToken cancellationToken
    )
    {

        Console.WriteLine("Bookings Query called");
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        //parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // Query service provider basic info
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

<<<<<<< HEAD

        var searchHistoryResponse = await GetBookingsAsync(cancellationToken);/*new BookingsResponse
=======
   
        var searchHistoryResponse = new BookingsResponse
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
        {
            CancelledBookings = Bookings.CancelledBookings().ToList(),
            UpcomingBookings = Bookings.UpcomingBookings().ToList(),
            PastBookings = Bookings.PastBookings().ToList(),
<<<<<<< HEAD
        };*/
=======
        };
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965


        return searchHistoryResponse;
    }
<<<<<<< HEAD

    public async Task<BookingsResponse> GetBookingsAsync(CancellationToken cancellationToken)
    {
        var sql = @"
            SELECT 
                b.id, b.service, b.provider, b.image, 
                b.selected_date AS date, b.selected_time AS time, 
                b.location, b.payment_status, b.price, 
                b.status, b.verified, b.cancel_reason
            FROM booking.bookings b
            WHERE b.selected_date >= CURRENT_DATE AND b.status = 'Upcoming'

            UNION ALL

            SELECT 
                b.id, b.service, b.provider, b.image, 
                b.selected_date AS date, b.selected_time AS time, 
                b.location, b.payment_status, b.price, 
                b.status, b.verified, b.cancel_reason
            FROM booking.bookings b
            WHERE b.selected_date < CURRENT_DATE AND b.status = 'Past'

            UNION ALL

            SELECT 
                b.id, b.service, b.provider, b.image, 
                b.selected_date AS date, b.selected_time AS time, 
                b.location, b.payment_status, b.price, 
                b.status, b.verified, b.cancel_reason
            FROM booking.bookings b
            WHERE b.status = 'Cancelled';";
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var bookings = await connection.QueryAsync<Booking>(sql);

        var upcomingBookings = bookings.Where(b => b.Status == "Upcoming").ToList();
        var pastBookings = bookings.Where(b => b.Status == "Past").ToList();
        var cancelledBookings = bookings.Where(b => b.Status == "Cancelled").ToList();

        return new BookingsResponse
        {
            UpcomingBookings = upcomingBookings,
            PastBookings = pastBookings,
            CancelledBookings = cancelledBookings
        };
    }
=======
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
}

