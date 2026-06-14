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

namespace LSevin.Modules.Category.ProviderType.Features.UpdateProviderAttributeDefinition;

internal sealed class UpdateProviderAttributeDefinitionEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPut(Routes.ProviderType.UpdateAttributeDefinition, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ProviderType.Group)
            .WithName(nameof(UpdateProviderAttributeDefinition))
            .WithDisplayName(nameof(UpdateProviderAttributeDefinition).Humanize())
            .WithSummaryAndDescription(
                nameof(UpdateProviderAttributeDefinition).Humanize(),
                nameof(UpdateProviderAttributeDefinition).Humanize()
            );
    }

    private static Task<Results<Ok<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [FromRoute] Guid providerTypeId,
        [FromRoute] Guid attributeDefinitionId,
        [FromBody] UpdateProviderAttributeDefinitionRequest request
    ) =>
        Result
            .Create(
                new UpdateProviderAttributeDefinitionCommand(
                    providerTypeId,
                    attributeDefinitionId,
                    request.Name,
                    request.Description,
                    request.AttributeTypeId,
                    request.IsRequired,
                    request.ValidationRules,
                    request.Options
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Ok<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
