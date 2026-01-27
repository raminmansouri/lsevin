using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Common;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceDefinition.Features.UpdateServiceAttributeDefinition;

internal sealed class UpdateServiceAttributeDefinitionEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPut(Routes.ServiceDefinition.UpdateAttributeDefinition, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceDefinition.Group)
            .WithName(nameof(UpdateServiceAttributeDefinition))
            .WithDisplayName(nameof(UpdateServiceAttributeDefinition).Humanize())
            .WithSummaryAndDescription(
                nameof(UpdateServiceAttributeDefinition).Humanize(),
                nameof(UpdateServiceAttributeDefinition).Humanize()
            );
    }

    private static Task<Results<Ok<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [FromRoute] Guid serviceDefinitionId,
        [FromRoute] Guid attributeDefinitionId,
        [FromBody] UpdateServiceAttributeDefinitionRequest request
    ) =>
        Result
            .Create(
                new UpdateServiceAttributeDefinitionCommand(
                    serviceDefinitionId,
                    attributeDefinitionId,
                    request.Name,
                    request.Description,
                    request.AttributeType,
                    request.IsRequired,
                    request.AffectsPricing,
                    request.DisplayOrder,
                    request.Options
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Ok<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
