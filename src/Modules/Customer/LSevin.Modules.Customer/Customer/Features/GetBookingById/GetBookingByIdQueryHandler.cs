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
            CancelledGetBookingById = GetBookingById.CancelledGetBookingById().ToList(),
            UpcomingGetBookingById = GetBookingById.UpcomingGetBookingById().ToList(),
            PastGetBookingById = GetBookingById.PastGetBookingById().ToList(),
        };


        return searchHistoryResponse;
    }
}

