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

namespace LSevin.Modules.Category.ServiceRequest.Features.GetServiceProviderRequestsAdmin;

internal sealed class GetServiceProviderRequestsAdminEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetRequestsByProviderAdmin, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IReadOnlyCollection<GetServiceProviderRequestsAdminResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetServiceProviderRequestsAdmin))
            .WithDisplayName(nameof(GetServiceProviderRequestsAdmin).Humanize())
            .WithSummaryAndDescription(
                nameof(GetServiceProviderRequestsAdmin).Humanize(),
                nameof(GetServiceProviderRequestsAdmin).Humanize()
            );
    }

    private static Task<
        Results<Ok<IReadOnlyCollection<GetServiceProviderRequestsAdminResponse>>, ProblemHttpResult>
    > Handle([AsParameters] BaseEndpointServices<CategoryModule> services, Guid serviceProviderId) =>
        Result
            .Create(new GetServiceProviderRequestsAdminQuery(serviceProviderId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetServiceProviderRequestsAdminResponse>,
                Results<Ok<IReadOnlyCollection<GetServiceProviderRequestsAdminResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
