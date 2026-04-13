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

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetServicesByProviderAndSpecialist;

internal sealed class GetBookingGetServicesByProviderAndSpecialistEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Booking.GetBookingGetServicesByProviderAndSpecialist, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IReadOnlyCollection<GetBookingGetServicesByProviderAndSpecialistResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetBookingGetServicesByProviderAndSpecialist))
            .WithDisplayName(nameof(GetBookingGetServicesByProviderAndSpecialist).Humanize())
            .WithSummaryAndDescription(
                nameof(GetBookingGetServicesByProviderAndSpecialist).Humanize(),
                nameof(GetBookingGetServicesByProviderAndSpecialist).Humanize()
            );
    }

    private static Task<Results<Ok<GetBookingGetServicesByProviderAndSpecialistResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [AsParameters] GetBookingGetServicesByProviderAndSpecialistRequest request
    ) =>
        Result
            .Create(GetBookingGetServicesByProviderAndSpecialistQuery.Of())
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                GetBookingGetServicesByProviderAndSpecialistResponse,
                Results<Ok<GetBookingGetServicesByProviderAndSpecialistResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
