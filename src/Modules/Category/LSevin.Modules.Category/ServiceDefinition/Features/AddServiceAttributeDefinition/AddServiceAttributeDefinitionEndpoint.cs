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

namespace LSevin.Modules.Category.ServiceDefinition.Features.AddServiceAttributeDefinition;

internal sealed class AddServiceAttributeDefinitionEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.ServiceDefinition.AddAttributeDefinition, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceDefinition.Group)
            .WithName(nameof(AddServiceAttributeDefinition))
            .WithDisplayName(nameof(AddServiceAttributeDefinition).Humanize())
            .WithSummaryAndDescription(
                nameof(AddServiceAttributeDefinition).Humanize(),
                nameof(AddServiceAttributeDefinition).Humanize()
            );
    }

    private static Task<Results<Ok<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [FromRoute] Guid serviceDefinitionId,
        [FromBody] AddServiceAttributeDefinitionRequest request
    ) =>
        Result
            .Create(
                new AddServiceAttributeDefinitionCommand(
                    serviceDefinitionId,
                    request.Name,
                    request.Description,
                    request.AttributeType,
                    request.IsRequired,
                    request.Options
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Ok<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
