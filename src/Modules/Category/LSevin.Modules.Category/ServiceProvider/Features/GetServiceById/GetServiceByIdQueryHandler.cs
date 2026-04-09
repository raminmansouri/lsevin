using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Currency.Services;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Dtos;
using System.Text.Json;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceById;

internal sealed class GetServiceByIdQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetServiceByIdQuery, GetServiceByIdResponse>
{
    public async Task<Result<GetServiceByIdResponse>> Handle(
        GetServiceByIdQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;


        var data = GetServiceByIdDataProvider.GetSampleData();

        return data;
    }
}
