using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.User.Dtos;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Identity.User.Features.RegisterUser;

internal sealed class RegisterUserEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.User.RegisterUser, Handle)
            .AllowAnonymous()
            .Produces<IdentityUserDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.User.Group)
            .WithName(nameof(RegisterUser))
            .WithDisplayName(nameof(RegisterUser).Humanize())
            .WithSummaryAndDescription(nameof(RegisterUser).Humanize(), nameof(RegisterUser).Humanize());
    }

    private static Task<Results<Created<IdentityUserDto>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<IdentityModule> services,
        RegisterUserRequest request
    ) =>
        Result
            .Create(
                new RegisterUserCommand(
                    request.FirstName,
                    request.LastName,
                    request.UserName,
                    request.Email,
                    request.PhoneNumberCountryCode,
                    request.PhoneNumber,
                    request.Password,
                    request.ConfirmPassword
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<RegisterUserResponse, Results<Created<IdentityUserDto>, ProblemHttpResult>>(
                onSuccess: result =>
                    EndpointSucceedCreated(
                        uri: $"{Routes.User.MainUrl}/{result?.UserIdentity?.Id}",
                        result?.UserIdentity
                    ),
                onFailure: error => EndpointFailed(error)
            );
}
