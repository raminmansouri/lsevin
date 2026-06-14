using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypeAttributes;

internal sealed class GetProviderTypeAttributesEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ProviderType.GetAttributes, Handle)
            .RequireAuthorization()
            .Produces<GetProviderTypeAttributesResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ProviderType.Group)
            .WithName(nameof(GetProviderTypeAttributes))
            .WithDisplayName(nameof(GetProviderTypeAttributes).Humanize())
            .WithSummaryAndDescription(
                nameof(GetProviderTypeAttributes).Humanize(),
                nameof(GetProviderTypeAttributes).Humanize()
            );
    }

    private static Task<Results<Ok<GetProviderTypeAttributesResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid providerTypeId
    ) =>
        Result
            .Create(GetProviderTypeAttributesQuery.Of(providerTypeId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                GetProviderTypeAttributesResponse,
                Results<Ok<GetProviderTypeAttributesResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
