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

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderService;

internal sealed class UpdateProviderServiceEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPut(Routes.ServiceProvider.UpdateService, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<bool>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(UpdateProviderService))
            .WithDisplayName(nameof(UpdateProviderService).Humanize())
            .WithSummaryAndDescription(
                nameof(UpdateProviderService).Humanize(),
                nameof(UpdateProviderService).Humanize()
            );
    }

    private static Task<Results<Ok<bool>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid serviceProviderId,
        Guid serviceId,
        UpdateProviderServiceRequest request
    ) =>
        Result
            .Create(
                new UpdateProviderServiceCommand(
                    serviceProviderId,
                    serviceId,
                    request.Name,
                    request.Description,
                    request.Price,
                    request.Currency,
                    request.DurationMinutes,
                    request.IsActive
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<bool, Results<Ok<bool>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
