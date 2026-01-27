using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Common;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.User.Dtos;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Identity.User.Features.GetUsers;

internal sealed class GetUsersEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.User.GetAll, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IPageList<IdentityUserDto>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.User.Group)
            .WithName(nameof(GetUsers))
            .WithDisplayName(nameof(GetUsers).Humanize())
            .WithSummaryAndDescription(nameof(GetUsers).Humanize(), nameof(GetUsers).Humanize());
    }

    private static Task<Results<Ok<IPageList<IdentityUserDto>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<IdentityModule> services,
        [AsParameters] PageRequest request
    ) =>
        Result
            .Create(request.Of<GetUsersQuery, GetUsersResponse>())
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<GetUsersResponse, Results<Ok<IPageList<IdentityUserDto>>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result?.IdentityUsers),
                onFailure: error => EndpointFailed(error)
            );
}
