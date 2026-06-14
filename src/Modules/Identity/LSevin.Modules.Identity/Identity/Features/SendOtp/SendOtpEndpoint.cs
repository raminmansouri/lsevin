using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Identity.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Identity.Identity.Features.SendOtp;

internal sealed class SendOtpEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.Identity.SendOtp, Handle)
            .RequireAuthorization()
            .Produces<SendOtpResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Identity.Group)
            .WithName(nameof(SendOtp))
            .WithDisplayName(nameof(SendOtp).Humanize())
            .WithSummaryAndDescription(nameof(SendOtp).Humanize(), nameof(SendOtp).Humanize());
    }

    private static Task<Results<Ok<SendOtpResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<IdentityModule> services
    ) =>
        Result
            .Create(new SendOtpCommand())
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<SendOtpResponse, Results<Ok<SendOtpResponse>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
