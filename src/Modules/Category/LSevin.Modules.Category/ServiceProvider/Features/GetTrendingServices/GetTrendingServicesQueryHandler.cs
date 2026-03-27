using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Currency.Services;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetTrendingServicesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetTrendingServicesQuery, GetTrendingServicesResponse>
{
    public async Task<Result<GetTrendingServicesResponse>> Handle(
        GetTrendingServicesQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        //parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // Query service provider basic info
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;



        var serviceProvider = new GetTrendingServicesResponse
        {
           Title=""
        };


        

        // Query services
        var servicesSql =
            $@"
            SELECT
                id AS Id,
                service_definition_id AS ServiceDefinitionId,
                duration_minutes AS DurationMinutes,
                COALESCE(
                    display_name_translations ->> '{currentLocale}',
                    display_name_translations ->> '{defaultLocale}',
                    (display_name_translations ->> (SELECT jsonb_object_keys(display_name_translations) LIMIT 1))
                ) AS DisplayName,
                COALESCE(
                    description_translations ->> '{currentLocale}',
                    description_translations ->> '{defaultLocale}',
                    (description_translations ->> (SELECT jsonb_object_keys(description_translations) LIMIT 1))
                ) AS Description,
                is_active AS IsActive,
                currency AS Currency,
                value AS Value
            FROM category.provider_services
            WHERE is_active = true
            ORDER BY display_name_translations ->> '{currentLocale}', display_name_translations ->> '{defaultLocale}'
 limit 10
        ";

        var services = await connection.QueryAsync<TrendingServiceDto>(
            new CommandDefinition(servicesSql, new {  }, cancellationToken: cancellationToken)
        );

        if (services != null)
        {
            foreach (var serviceProviderServiceDto in services)
            {
                serviceProviderServiceDto.Value =
                    currencyService.ConvertPrice(serviceProviderServiceDto.Value, serviceProviderServiceDto?.Currency);

                serviceProviderServiceDto.Currency =
                    currencyService.ConvertCurrencySymbol(serviceProviderServiceDto?.Currency);

           }

            serviceProvider.Services = services.AsList();
        }


        return serviceProvider;
    }
}

