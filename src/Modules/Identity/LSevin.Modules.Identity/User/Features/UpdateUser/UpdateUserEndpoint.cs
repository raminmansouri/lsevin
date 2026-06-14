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

namespace LSevin.Modules.Identity.User.Features.UpdateUser;

internal sealed class UpdateUserEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPut(Routes.User.Update, Handle)
            .RequireAuthorization()
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.User.Group)
            .WithName(nameof(UpdateUser))
            .WithDisplayName(nameof(UpdateUser).Humanize())
            .WithSummaryAndDescription(nameof(UpdateUser).Humanize(), nameof(UpdateUser).Humanize());
    }

    private static Task<Results<Ok<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<IdentityModule> services,
        [FromBody] UpdateUserRequest request
    ) =>
        Result
            .Create(
                new UpdateUserCommand(
                    request.FirstName,
                    request.LastName,
                    request.UserName,
                    request.Email,
                    request.PhoneNumberCountryCode,
                    request.PhoneNumber
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Ok<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
