using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using LSevin.Modules.Customer;
using LSevin.Modules.Customer.Constants;
using LSevin.Modules.Customer.Customer.Features.GetFavorites;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;
using QuickType;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetFavorites;

internal sealed class GetFavoritesEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Customer.GetFavorites, Handle)
            .RequireAuthorization()
            .Produces<GetFavoritesResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Customer.Group)
            .WithName(nameof(GetFavorites))
            .WithDisplayName(nameof(GetFavorites).Humanize())
            .WithSummaryAndDescription(
                nameof(GetFavorites).Humanize(),
                nameof(GetFavorites).Humanize()
            );
    }

    private static Task<Results<Ok<GetFavoritesResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CustomerModule> services,
        [AsParameters] PageRequest pageRequest,
        [AsParameters] GetFavoritesRequest exploreRequest

    ) =>
        Result
            .Create(GetFavoritesQuery.Of(pageRequest, exploreRequest))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                GetFavoritesResponse,
                Results<Ok<GetFavoritesResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
