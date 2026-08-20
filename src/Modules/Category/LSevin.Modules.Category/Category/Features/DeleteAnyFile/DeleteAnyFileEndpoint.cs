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

namespace LSevin.Modules.Category.Category.Features.DeleteAnyFile;

/// <summary>
/// Admin-only deletion of a stored media object by its relative path.
/// </summary>
/// <remarks>
/// Returns <c>true</c> when an object was removed and <c>false</c> when the path already held
/// nothing; both are successful outcomes. A path outside the media namespace is rejected by the
/// validator as a bad request, not treated as a missing file.
/// </remarks>
internal sealed class DeleteAnyFileEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    /// <inheritdoc />
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapDelete(Routes.Category.DeleteAnyFile, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<bool>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(DeleteAnyFile))
            .WithDisplayName(nameof(DeleteAnyFile).Humanize())
            .WithSummaryAndDescription(
                nameof(DeleteAnyFile).Humanize(),
                "Deletes a stored media object by its relative path. Restricted to the media namespace."
            );
    }

    private static Task<Results<Ok<bool>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        string path
    ) =>
        Result
            .Create(new DeleteAnyFileCommand(path))
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<bool, Results<Ok<bool>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
