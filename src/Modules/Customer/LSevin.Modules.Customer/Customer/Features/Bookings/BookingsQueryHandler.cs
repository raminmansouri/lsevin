using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

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

   
        var searchHistoryResponse = new BookingsResponse
        {
            CancelledBookings = Bookings.CancelledBookings().ToList(),
            UpcomingBookings = Bookings.UpcomingBookings().ToList(),
            PastBookings = Bookings.PastBookings().ToList(),
        };


        return searchHistoryResponse;
    }
}

