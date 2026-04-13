using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetProvidersByServiceAndSpecialist;
using LSevin.Modules.Category.ServiceProvider.Features.GetBookingSpecialistByProviderAndService;
using System.Text;
using System.Text.Json;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetServicesByProviderAndSpecialist;

internal sealed class GetBookingGetServicesByProviderAndSpecialistQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetBookingGetServicesByProviderAndSpecialistQuery, GetBookingGetServicesByProviderAndSpecialistResponse>
{
    public async Task<Result<GetBookingGetServicesByProviderAndSpecialistResponse>> Handle(
        GetBookingGetServicesByProviderAndSpecialistQuery request,
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

        var response = GetBookingServiceSelectionSampleData.GetBookingSpecialistByProviderAndService().Services;
        return new GetBookingGetServicesByProviderAndSpecialistResponse
        {
            Services = response
        };
    }
}

