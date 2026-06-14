using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Identity.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Identity.Identity.Features.VerifyOtp;

internal sealed class VerifyOtpEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.Identity.VerifyOtp, Handle)
            .AllowAnonymous()
            .Produces<VerifyOtpResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Identity.Group)
            .WithName(nameof(VerifyOtp))
            .WithDisplayName(nameof(VerifyOtp).Humanize())
            .WithSummaryAndDescription(nameof(VerifyOtp).Humanize(), nameof(VerifyOtp).Humanize());
    }

    private static Task<Results<Ok<VerifyOtpResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<IdentityModule> services,
        [FromBody] VerifyOtpRequest request
    ) =>
        Result
            .Create(new VerifyOtpCommand(request.Code, request.PhoneNumber))
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<VerifyOtpResponse, Results<Ok<VerifyOtpResponse>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
