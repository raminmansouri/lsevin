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

namespace LSevin.Modules.Category.ServiceDefinition.Features.DeleteServiceDefinition;

internal sealed class DeleteServiceDefinitionEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapDelete(Routes.ServiceDefinition.Delete, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceDefinition.Group)
            .WithName(nameof(DeleteServiceDefinition))
            .WithDisplayName(nameof(DeleteServiceDefinition).Humanize())
            .WithSummaryAndDescription(
                nameof(DeleteServiceDefinition).Humanize(),
                nameof(DeleteServiceDefinition).Humanize()
            );
    }

    private static Task<Results<Ok<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid serviceDefinitionId
    ) =>
        Result
            .Create(new DeleteServiceDefinitionCommand(serviceDefinitionId))
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Ok<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
