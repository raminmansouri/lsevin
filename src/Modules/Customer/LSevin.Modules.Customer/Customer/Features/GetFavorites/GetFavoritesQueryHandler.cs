using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using LSevin.Modules.Customer.Customer.Data.Repository;
using QuickType;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetFavoritesQueryHandler(
  IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor,
    IUserAccessor userAccessor

) : IQueryHandler<GetFavoritesQuery, GetFavoritesResponse>
{
    public async Task<Result<GetFavoritesResponse>> Handle(
        GetFavoritesQuery request,
        CancellationToken cancellationToken
    )
    {

        Console.WriteLine("GetFavorites Query called");
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        //parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // Query service provider basic info
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;


        var repository = new FavoritesRepository(connection);

        var response=await repository.GetFavoritesAsync(userAccessor.GetUserIdentity, currentLocale);

        return response;
        //var searchHistoryResponse = GetFavoritesResponse.FromJson(GetFavoritesResponse.SampleJson);


        //return searchHistoryResponse;
    }
}

