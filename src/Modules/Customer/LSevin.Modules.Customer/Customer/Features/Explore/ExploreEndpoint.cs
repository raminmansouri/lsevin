using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using LSevin.Modules.Customer;
using LSevin.Modules.Customer.Constants;
using LSevin.Modules.Customer.Customer.Features.Explore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.Explore;

internal sealed class ExploreEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Customer.Explore, Handle)
            .RequireAuthorization()
            .Produces<ExploreResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Customer.Group)
            .WithName(nameof(Explore))
            .WithDisplayName(nameof(Explore).Humanize())
            .WithSummaryAndDescription(
                nameof(Explore).Humanize(),
                nameof(Explore).Humanize()
            );
    }

    private static Task<Results<Ok<ExploreResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CustomerModule> services,
        [AsParameters] PageRequest pageRequest,
        [AsParameters] ExploreRequest exploreRequest

    ) =>
        Result
            .Create(ExploreQuery.Of(pageRequest, exploreRequest))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                ExploreResponse,
                Results<Ok<ExploreResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
