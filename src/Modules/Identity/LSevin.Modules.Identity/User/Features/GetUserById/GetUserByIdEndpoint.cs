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

namespace LSevin.Modules.Identity.User.Features.GetUserById;

internal sealed class GetUserByIdEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.User.GetById, Handle)
            .RequireAuthorization()
            .Produces<IdentityUserDto>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.User.Group)
            .WithName(nameof(GetUserById))
            .WithDisplayName(nameof(GetUserById).Humanize())
            .WithSummaryAndDescription(nameof(GetUserById).Humanize(), nameof(GetUserById).Humanize());
    }

    private static Task<Results<Ok<IdentityUserDto>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<IdentityModule> services,
        [FromRoute] Guid userId
    ) =>
        Result
            .Create(new GetUserByIdQuery(userId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<GetUserByIdResponse, Results<Ok<IdentityUserDto>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result?.IdentityUser),
                onFailure: error => EndpointFailed(error)
            );
}
