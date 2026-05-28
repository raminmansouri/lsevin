using BuildingBlocks.Core.ErrorHandling;
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

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSpecialistByProviderAndService;

internal sealed class GetBookingSpecialistByProviderAndServiceEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Booking.GetBookingSpecialistByProviderAndService, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IReadOnlyCollection<GetBookingSpecialistByProviderAndServiceResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetBookingSpecialistByProviderAndService))
            .WithDisplayName(nameof(GetBookingSpecialistByProviderAndService).Humanize())
            .WithSummaryAndDescription(
                nameof(GetBookingSpecialistByProviderAndService).Humanize(),
                nameof(GetBookingSpecialistByProviderAndService).Humanize()
            );
    }

    private static Task<Results<Ok<GetBookingSpecialistByProviderAndServiceResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [AsParameters] GetBookingSpecialistByProviderAndServiceRequest request
    ) =>
        Result
            .Create(GetBookingSpecialistByProviderAndServiceQuery.Of(
    request.providerId,
    request.serviceId,
    request.specialistId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                GetBookingSpecialistByProviderAndServiceResponse,
                Results<Ok<GetBookingSpecialistByProviderAndServiceResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
