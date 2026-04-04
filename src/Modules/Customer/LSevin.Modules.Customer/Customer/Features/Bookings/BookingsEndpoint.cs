using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using LSevin.Modules.Customer;
using LSevin.Modules.Customer.Constants;
using LSevin.Modules.Customer.Customer.Features.Bookings;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.Bookings;

internal sealed class BookingsEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Customer.Bookings, Handle)
            .RequireAuthorization()
            .Produces<BookingsResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Customer.Group)
            .WithName(nameof(Bookings))
            .WithDisplayName(nameof(Bookings).Humanize())
            .WithSummaryAndDescription(
                nameof(Bookings).Humanize(),
                nameof(Bookings).Humanize()
            );
    }

    private static Task<Results<Ok<BookingsResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CustomerModule> services,
        [AsParameters] PageRequest pageRequest,
        [AsParameters] BookingsRequest exploreRequest

    ) =>
        Result
            .Create(BookingsQuery.Of(pageRequest, exploreRequest))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                BookingsResponse,
                Results<Ok<BookingsResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
