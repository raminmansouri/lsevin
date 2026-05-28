using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using QuickType;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetRewardsPageQueryHandler(
  IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) :IQueryHandler<GetRewardsPageQuery, GetRewardsPageResponse>
{
    public async Task<Result<GetRewardsPageResponse>> Handle(
        GetRewardsPageQuery request,
        CancellationToken cancellationToken
    )
    {

        Console.WriteLine("GetRewardsPage Query called");
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        //parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // Query service provider basic info
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

   
        var searchHistoryResponse = GetRewardsPageResponse.FromJson(GetRewardsPageResponse.SampleJson);


        return searchHistoryResponse;
    }
}

