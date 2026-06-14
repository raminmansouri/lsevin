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

namespace LSevin.Modules.Category.ServiceProvider.Features.GetTrendingServices;

internal sealed class GetTrendingServicesEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetTrendingServices, Handle)
            .RequireAuthorization()
            .Produces<GetTrendingServicesResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetTrendingServices))
            .WithDisplayName(nameof(GetTrendingServices).Humanize())
            .WithSummaryAndDescription(
                nameof(GetTrendingServices).Humanize(),
                nameof(GetTrendingServices).Humanize()
            );
    }

    private static Task<Results<Ok<GetTrendingServicesResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services
    ) =>
        Result
            .Create(GetTrendingServicesQuery.Of)
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                GetTrendingServicesResponse,
                Results<Ok<GetTrendingServicesResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
