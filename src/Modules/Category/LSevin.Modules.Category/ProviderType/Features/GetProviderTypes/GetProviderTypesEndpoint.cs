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

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypes;

internal sealed class GetProviderTypesEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ProviderType.GetAll, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<PageList<GetProviderTypesResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ProviderType.Group)
            .WithName(nameof(GetProviderTypes))
            .WithDisplayName(nameof(GetProviderTypes).Humanize())
            .WithSummaryAndDescription(nameof(GetProviderTypes).Humanize(), nameof(GetProviderTypes).Humanize());
    }

    private static Task<Results<Ok<IPageList<GetProviderTypesResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [AsParameters] GetProviderTypesRequest request,
        [AsParameters] PageRequest pageRequest
    ) =>
        Result
            .Create(GetProviderTypesQuery.Of(request, pageRequest))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IPageList<GetProviderTypesResponse>,
                Results<Ok<IPageList<GetProviderTypesResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
