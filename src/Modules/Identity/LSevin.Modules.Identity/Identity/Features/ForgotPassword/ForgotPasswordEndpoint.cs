using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Identity.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Identity.Identity.Features.ForgotPassword;

internal sealed class ForgotPasswordEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.Identity.ForgotPassword, Handle)
            .AllowAnonymous()
            .Produces<ForgotPasswordResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Identity.Group)
            .WithName(nameof(ForgotPassword))
            .WithDisplayName(nameof(ForgotPassword).Humanize())
            .WithSummaryAndDescription(nameof(ForgotPassword).Humanize(), nameof(ForgotPassword).Humanize());
    }

    private static Task<Results<Ok<ForgotPasswordResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<IdentityModule> services,
        ForgotPasswordRequest request
    ) =>
        Result
            .Create(new ForgotPasswordCommand(request.UserNameOrEmail))
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<ForgotPasswordResponse, Results<Ok<ForgotPasswordResponse>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
