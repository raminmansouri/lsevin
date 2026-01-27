using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.User.Dtos;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Identity.User.Features.GetUserByEmail;

internal sealed class GetUserByEmailEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.User.GetByEmail, Handle)
            .RequireAuthorization()
            .Produces<IdentityUserDto>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.User.Group)
            .WithName(nameof(GetUserByEmail))
            .WithDisplayName(nameof(GetUserByEmail).Humanize())
            .WithSummaryAndDescription(nameof(GetUserByEmail).Humanize(), nameof(GetUserByEmail).Humanize());
    }

    private static Task<Results<Ok<IdentityUserDto>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<IdentityModule> services,
        [FromRoute] string email
    ) =>
        Result
            .Create(new GetUserByEmailQuery(email))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<GetUserByEmailResponse, Results<Ok<IdentityUserDto>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result?.UserIdentity),
                onFailure: error => EndpointFailed(error)
            );
}
