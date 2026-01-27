using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceRequest.Features.GetMyServiceProviderRequests;

internal sealed class GetMyServiceProviderRequestsEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetMyRequests, Handle)
            .RequireAuthorization()
            .Produces<IReadOnlyCollection<GetMyServiceProviderRequestsResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetMyServiceProviderRequests))
            .WithDisplayName(nameof(GetMyServiceProviderRequests).Humanize())
            .WithSummaryAndDescription(
                nameof(GetMyServiceProviderRequests).Humanize(),
                nameof(GetMyServiceProviderRequests).Humanize()
            );
    }

    private static Task<
        Results<Ok<IReadOnlyCollection<GetMyServiceProviderRequestsResponse>>, ProblemHttpResult>
    > Handle([AsParameters] BaseEndpointServices<CategoryModule> services, Guid serviceProviderId) =>
        Result
            .Create(new GetMyServiceProviderRequestsQuery(serviceProviderId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetMyServiceProviderRequestsResponse>,
                Results<Ok<IReadOnlyCollection<GetMyServiceProviderRequestsResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
