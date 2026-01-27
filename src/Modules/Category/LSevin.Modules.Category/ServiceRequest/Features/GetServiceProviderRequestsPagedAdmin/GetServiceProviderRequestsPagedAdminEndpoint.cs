using BuildingBlocks.Core.Messaging.Queries.Paging;
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

namespace LSevin.Modules.Category.ServiceRequest.Features.GetServiceProviderRequestsPagedAdmin;

internal sealed class GetServiceProviderRequestsPagedAdminEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetAllRequestsAdmin, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IPageList<GetServiceProviderRequestsPagedAdminResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetServiceProviderRequestsPagedAdmin))
            .WithDisplayName(nameof(GetServiceProviderRequestsPagedAdmin).Humanize())
            .WithSummaryAndDescription(
                nameof(GetServiceProviderRequestsPagedAdmin).Humanize(),
                nameof(GetServiceProviderRequestsPagedAdmin).Humanize()
            );
    }

    private static Task<Results<Ok<IPageList<GetServiceProviderRequestsPagedAdminResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [AsParameters] GetServiceProviderRequestsPagedAdminQuery query
    ) =>
        Result
            .Create(query)
            .Bind(q => services.Gateway.SendQueryAsync(q, services.CancellationToken))
            .Match<
                IPageList<GetServiceProviderRequestsPagedAdminResponse>,
                Results<Ok<IPageList<GetServiceProviderRequestsPagedAdminResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
