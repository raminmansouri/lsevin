using System.Text;
using System.Text.Json;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableDates;

internal sealed class GetBookingAvailableDatesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetBookingAvailableDatesQuery, GetBookingAvailableDatesResponse>
{
    public async Task<Result<GetBookingAvailableDatesResponse>> Handle(
        GetBookingAvailableDatesQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
       


        // Build the query with optional filters
        var sql = new StringBuilder();
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;


  /*      var response=await new AvailableDateTimesRepository(connection).GetAvailableDatesAsync
            (new GetBookingAvailableDatesRequest
            (request.providerId,
    request.serviceId,
    request.specialistId
                ));*/
        var response= GetBookingAvailableDatesProvider.GetBookingAvailableDates();
        return response;
    }
}

