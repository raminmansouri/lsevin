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

namespace LSevin.Modules.Category.ServiceRequest.Features.ApproveServiceProviderRequest;

internal sealed class ApproveServiceProviderRequestEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPatch($"{Routes.ServiceProvider.AdminUrl}/requests/{{requestId:guid}}/approve", Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<bool>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(ApproveServiceProviderRequest))
            .WithDisplayName(nameof(ApproveServiceProviderRequest).Humanize())
            .WithSummaryAndDescription(
                nameof(ApproveServiceProviderRequest).Humanize(),
                nameof(ApproveServiceProviderRequest).Humanize()
            );
    }

    private static Task<Results<Ok<bool>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid requestId
    ) =>
        Result
            .Create(new ApproveServiceProviderRequestCommand(requestId))
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<bool, Results<Ok<bool>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
