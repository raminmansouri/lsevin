using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Customer.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Customer.Customer.Features.GetCurrentCustomer;

internal sealed class GetCurrentCustomerEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Customer.GetCurrent, Handle)
            .RequireAuthorization()
            .Produces<GetCurrentCustomerResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Customer.Group)
            .WithName(nameof(GetCurrentCustomer))
            .WithDisplayName(nameof(GetCurrentCustomer).Humanize())
            .WithSummaryAndDescription(nameof(GetCurrentCustomer).Humanize(), nameof(GetCurrentCustomer).Humanize());
    }

    private static Task<Results<Ok<GetCurrentCustomerResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CustomerModule> services
    ) =>
        Result
            .Create(new GetCurrentCustomerQuery())
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<GetCurrentCustomerResponse, Results<Ok<GetCurrentCustomerResponse>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
