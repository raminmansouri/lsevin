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

namespace LSevin.Modules.Category.Staff.Features.UpdateStaffAvailability;

internal sealed class UpdateStaffAvailabilityEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPut(Routes.Staff.UpdateAvailability, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Staff.Group)
            .WithName(nameof(UpdateStaffAvailability))
            .WithDisplayName(nameof(UpdateStaffAvailability).Humanize())
            .WithSummaryAndDescription(
                nameof(UpdateStaffAvailability).Humanize(),
                nameof(UpdateStaffAvailability).Humanize()
            );
    }

    private static Task<Results<Ok<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid staffId,
        Guid availabilityId,
        UpdateStaffAvailabilityRequest request
    ) =>
        Result
            .Create(
                new UpdateStaffAvailabilityCommand(
                    staffId,
                    availabilityId,
                    request.DayOfWeek,
                    request.StartTime,
                    request.EndTime,
                    request.IsRecurring,
                    request.AvailabilityStatusId,
                    request.SpecificDate
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Ok<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
