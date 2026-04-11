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

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableDateTimes;

internal sealed class GetBookingAvailableDateTimesEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Booking.GetBookingAvailableDateTimes, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IReadOnlyCollection<GetBookingAvailableDateTimesResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetBookingAvailableDateTimes))
            .WithDisplayName(nameof(GetBookingAvailableDateTimes).Humanize())
            .WithSummaryAndDescription(
                nameof(GetBookingAvailableDateTimes).Humanize(),
                nameof(GetBookingAvailableDateTimes).Humanize()
            );
    }

    private static Task<Results<Ok<IReadOnlyCollection<GetBookingAvailableDateTimesResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid id,
        [AsParameters] GetBookingAvailableDateTimesRequest request
    ) =>
        Result
            .Create(GetBookingAvailableDateTimesQuery.Of(id, request.IsActive))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetBookingAvailableDateTimesResponse>,
                Results<Ok<IReadOnlyCollection<GetBookingAvailableDateTimesResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
