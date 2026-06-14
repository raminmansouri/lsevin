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

namespace LSevin.Modules.Category.Staff.Features.GetStaffDetails;

internal sealed class GetStaffDetailsEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Staff.GetDetails, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<GetStaffDetailsResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Staff.Group)
            .WithName(nameof(GetStaffDetails))
            .WithDisplayName(nameof(GetStaffDetails).Humanize())
            .WithSummaryAndDescription(nameof(GetStaffDetails).Humanize(), nameof(GetStaffDetails).Humanize());
    }

    private static Task<Results<Ok<GetStaffDetailsResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid staffId
    ) =>
        Result
            .Create(new GetStaffDetailsQuery(staffId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<GetStaffDetailsResponse, Results<Ok<GetStaffDetailsResponse>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
