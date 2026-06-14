using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using LSevin.Modules.Customer;
using LSevin.Modules.Customer.Constants;
using LSevin.Modules.Customer.Customer.Features.Offers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.Offers;

internal sealed class OffersEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Customer.Offers, Handle)
            .RequireAuthorization()
            .Produces<OffersResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Customer.Group)
            .WithName(nameof(Offers))
            .WithDisplayName(nameof(Offers).Humanize())
            .WithSummaryAndDescription(
                nameof(Offers).Humanize(),
                nameof(Offers).Humanize()
            );
    }

    private static Task<Results<Ok<OffersResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CustomerModule> services,
        [AsParameters] PageRequest pageRequest,
        [AsParameters] OffersRequest exploreRequest

    ) =>
        Result
            .Create(OffersQuery.Of(pageRequest, exploreRequest))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                OffersResponse,
                Results<Ok<OffersResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
