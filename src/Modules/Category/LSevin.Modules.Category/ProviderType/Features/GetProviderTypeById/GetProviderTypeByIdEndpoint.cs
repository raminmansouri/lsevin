using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Common;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypeById;

internal sealed class GetProviderTypeByIdEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ProviderType.GetById, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<GetProviderTypeByIdResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ProviderType.Group)
            .WithName(nameof(GetProviderTypeById))
            .WithDisplayName(nameof(GetProviderTypeById).Humanize())
            .WithSummaryAndDescription(nameof(GetProviderTypeById).Humanize(), nameof(GetProviderTypeById).Humanize());
    }

    private static Task<Results<Ok<GetProviderTypeByIdResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid providerTypeId
    ) =>
        Result
            .Create(new GetProviderTypeByIdQuery(providerTypeId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<GetProviderTypeByIdResponse, Results<Ok<GetProviderTypeByIdResponse>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
