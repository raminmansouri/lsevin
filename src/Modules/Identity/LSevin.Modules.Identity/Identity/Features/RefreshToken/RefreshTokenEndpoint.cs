using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Identity.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Identity.Identity.Features.RefreshToken;

internal sealed class RefreshTokenEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.Identity.RefreshToken, Handle)
            .AllowAnonymous()
            .Produces<RefreshTokenResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Identity.Group)
            .WithName(nameof(RefreshToken))
            .WithDisplayName(nameof(RefreshToken).Humanize())
            .WithSummaryAndDescription(nameof(RefreshToken).Humanize(), nameof(RefreshToken).Humanize());
    }

    private static Task<Results<Ok<RefreshTokenResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<IdentityModule> services,
        RefreshTokenRequest request
    ) =>
        Result
            .Create(new RefreshTokenCommand(request.AccessToken, request.RefreshToken))
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<RefreshTokenResponse, Results<Ok<RefreshTokenResponse>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
