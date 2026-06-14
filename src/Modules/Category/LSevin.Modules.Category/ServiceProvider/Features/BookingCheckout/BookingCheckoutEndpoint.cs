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

namespace LSevin.Modules.Category.ServiceProvider.Features.BookingCheckout;

internal sealed class BookingCheckoutEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.Booking.BookingCheckout, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(BookingCheckout))
            .WithDisplayName(nameof(BookingCheckout).Humanize())
            .WithSummaryAndDescription(
                nameof(BookingCheckout).Humanize(),
                nameof(BookingCheckout).Humanize()
            );
    }

    private static Task<Results<Ok<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        BookingCheckoutRequest request
    ) =>
        Result
            .Create(
                new BookingCheckoutCommand(
                    request.ProviderId,
                    request.ServiceId,
                    request.SpecialistId,
                    request.SelectedDate,
                    request.SelectedDateFrom,
                    request.SelectedDateTo,
                    request.SelectedTime,
                    request.SelectedTimeFrom,
                    request.SelectedTimeTo,
                    request.PaymentMethod,
                    request.AddOns,
                    request.UploadFiles,
                    request.AdditionalServices,
                    request.Step
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Ok<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
