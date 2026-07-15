using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Identity.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Identity.Identity.Features.ResetPassword;

internal sealed class ResetPasswordEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.Identity.ResetPassword, Handle)
            .AllowAnonymous()
            .Produces<ResetPasswordResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Identity.Group)
            .WithName(nameof(ResetPassword))
            .WithDisplayName(nameof(ResetPassword).Humanize())
            .WithSummaryAndDescription(nameof(ResetPassword).Humanize(), nameof(ResetPassword).Humanize());
    }

    private static Task<Results<Ok<ResetPasswordResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<IdentityModule> services,
        ResetPasswordRequest request
    ) =>
        Result
            .Create(
                new ResetPasswordCommand(
                    request.UserNameOrEmail,
                    request.Code,
                    request.NewPassword,
                    request.ConfirmPassword
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<ResetPasswordResponse, Results<Ok<ResetPasswordResponse>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
