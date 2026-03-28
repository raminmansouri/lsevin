using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Common;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviders;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetTrustedProviders;

internal sealed class GetTrustedProvidersEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetTrustedProviders, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IPageList<GetTrustedProvidersResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetTrustedProviders))
            .WithDisplayName(nameof(GetTrustedProviders).Humanize())
            .WithSummaryAndDescription(nameof(GetTrustedProviders).Humanize(), nameof(GetTrustedProviders).Humanize());
    }

    private static Task<Results<Ok<IPageList<GetTrustedProvidersResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [AsParameters] GetTrustedProvidersRequest request,
        [AsParameters] PageRequest pageRequest
    ) =>
        Result
            .Create(GetTrustedProvidersQuery.Of(request, pageRequest))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IPageList<GetTrustedProvidersResponse>,
                Results<Ok<IPageList<GetTrustedProvidersResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
