using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Common;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.Staff.Features.GetStaffById;

internal sealed class GetStaffByIdEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Staff.GetById, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<GetStaffByIdResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Staff.Group)
            .WithName(nameof(GetStaffById))
            .WithDisplayName(nameof(GetStaffById).Humanize())
            .WithSummaryAndDescription(nameof(GetStaffById).Humanize(), nameof(GetStaffById).Humanize());
    }

    private static Task<Results<Ok<GetStaffByIdResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid staffId
    ) =>
        Result
            .Create(new GetStaffByIdQuery(staffId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<GetStaffByIdResponse, Results<Ok<GetStaffByIdResponse>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
