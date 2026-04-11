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

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetProvidersByServiceAndSpecialist;

internal sealed class GetBookingGetProvidersByServiceAndSpecialistEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Booking.GetBookingGetProvidersByServiceAndSpecialist, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IReadOnlyCollection<GetBookingGetProvidersByServiceAndSpecialistResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetBookingGetProvidersByServiceAndSpecialist))
            .WithDisplayName(nameof(GetBookingGetProvidersByServiceAndSpecialist).Humanize())
            .WithSummaryAndDescription(
                nameof(GetBookingGetProvidersByServiceAndSpecialist).Humanize(),
                nameof(GetBookingGetProvidersByServiceAndSpecialist).Humanize()
            );
    }

    private static Task<Results<Ok<GetBookingGetProvidersByServiceAndSpecialistResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid id,
        [AsParameters] GetBookingGetProvidersByServiceAndSpecialistRequest request
    ) =>
        Result
            .Create(GetBookingGetProvidersByServiceAndSpecialistQuery.Of(id, request.IsActive))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                GetBookingGetProvidersByServiceAndSpecialistResponse,
                Results<Ok<GetBookingGetProvidersByServiceAndSpecialistResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
