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

namespace LSevin.Modules.Category.Staff.Features.GetStaffAvailability;

internal sealed class GetStaffAvailabilityEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Staff.GetAvailabilities, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IReadOnlyCollection<GetStaffAvailabilityResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Staff.Group)
            .WithName(nameof(GetStaffAvailability))
            .WithDisplayName(nameof(GetStaffAvailability).Humanize())
            .WithSummaryAndDescription(
                nameof(GetStaffAvailability).Humanize(),
                nameof(GetStaffAvailability).Humanize()
            );
    }

    private static Task<Results<Ok<IReadOnlyCollection<GetStaffAvailabilityResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid staffId
    ) =>
        Result
            .Create(new GetStaffAvailabilityQuery(staffId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetStaffAvailabilityResponse>,
                Results<Ok<IReadOnlyCollection<GetStaffAvailabilityResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
