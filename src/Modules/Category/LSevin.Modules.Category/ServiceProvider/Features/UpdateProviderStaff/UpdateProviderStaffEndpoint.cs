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

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderStaff;

internal sealed class UpdateProviderStaffEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPut(Routes.ServiceProvider.UpdateStaff, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<bool>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(UpdateProviderStaff))
            .WithDisplayName(nameof(UpdateProviderStaff).Humanize())
            .WithSummaryAndDescription(nameof(UpdateProviderStaff).Humanize(), nameof(UpdateProviderStaff).Humanize());
    }

    private static Task<Results<Ok<bool>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid serviceProviderId,
        Guid staffId,
        UpdateProviderStaffRequest request
    ) =>
        Result
            .Create(
                new UpdateProviderStaffCommand(
                    serviceProviderId,
                    staffId,
                    request.Notes,
                    request.IsActive,
                    request.NewStaffId
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<bool, Results<Ok<bool>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
