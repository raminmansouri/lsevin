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

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderPolicy;

internal sealed class RemoveProviderPolicyEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapDelete(Routes.ServiceProvider.RemovePolicy, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<bool>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(RemoveProviderPolicy))
            .WithDisplayName(nameof(RemoveProviderPolicy).Humanize())
            .WithSummaryAndDescription(
                nameof(RemoveProviderPolicy).Humanize(),
                nameof(RemoveProviderPolicy).Humanize()
            );
    }

    private static Task<Results<Ok<bool>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid serviceProviderId,
        Guid policyId
    ) =>
        Result
            .Create(new RemoveProviderPolicyCommand(serviceProviderId, policyId))
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<bool, Results<Ok<bool>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
