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

namespace LSevin.Modules.Identity.Identity.Features.ResendOtp;

internal sealed class ResendOtpEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.Identity.ResendOtp, Handle)
            .AllowAnonymous()
            .Produces<ResendOtpResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Identity.Group)
            .WithName(nameof(ResendOtp))
            .WithDisplayName(nameof(ResendOtp).Humanize())
            .WithSummaryAndDescription(nameof(ResendOtp).Humanize(), nameof(ResendOtp).Humanize());
    }

    private static Task<Results<Ok<ResendOtpResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<IdentityModule> services,
        [FromBody] ResendOtpRequest request
    ) =>
        Result
            .Create(new ResendOtpCommand(request.PhoneNumber))
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<ResendOtpResponse, Results<Ok<ResendOtpResponse>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
