using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetFeaturedServices;

internal sealed class GetFeaturedServicesEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetFeaturedServices, Handle)
            .RequireAuthorization()
            .Produces<GetFeaturedServicesResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetFeaturedServices))
            .WithDisplayName(nameof(GetFeaturedServices).Humanize())
            .WithSummaryAndDescription(
                nameof(GetFeaturedServices).Humanize(),
                nameof(GetFeaturedServices).Humanize()
            );
    }

    private static Task<Results<Ok<GetFeaturedServicesResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services
    ) =>
        Result
            .Create(GetFeaturedServicesQuery.Of)
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                GetFeaturedServicesResponse,
                Results<Ok<GetFeaturedServicesResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
