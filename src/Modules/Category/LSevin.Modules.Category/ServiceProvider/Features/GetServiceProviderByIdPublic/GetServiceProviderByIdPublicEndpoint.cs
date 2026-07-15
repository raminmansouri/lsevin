using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

internal sealed class GetServiceProviderByIdPublicEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetPublicById, Handle)
            // Public provider details page is anonymous-accessible (no user context used).
            .AllowAnonymous()
            .Produces<GetServiceProviderByIdPublicResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetServiceProviderByIdPublic))
            .WithDisplayName(nameof(GetServiceProviderByIdPublic).Humanize())
            .WithSummaryAndDescription(
                nameof(GetServiceProviderByIdPublic).Humanize(),
                nameof(GetServiceProviderByIdPublic).Humanize()
            );
    }

    private static Task<Results<Ok<GetServiceProviderByIdPublicResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid serviceProviderId
    ) =>
        Result
            .Create(GetServiceProviderByIdPublicQuery.Of(serviceProviderId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                GetServiceProviderByIdPublicResponse,
                Results<Ok<GetServiceProviderByIdPublicResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
