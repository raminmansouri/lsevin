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

namespace LSevin.Modules.Category.Category.Features.GetCategories;

internal sealed class GetCategoriesEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Category.GetAll, Handle)
            // .RequireAuthorization(SecurityConstants.Role.Admin)
            .RequireAuthorization()
            .Produces<IPageList<GetCategoriesResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Category.Group)
            .WithName(nameof(GetCategories))
            .WithDisplayName(nameof(GetCategories).Humanize())
            .WithSummaryAndDescription(nameof(GetCategories).Humanize(), nameof(GetCategories).Humanize());
    }

    private static Task<Results<Ok<IPageList<GetCategoriesResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [AsParameters] GetCategoriesQuery query
    ) =>
        Result
            .Create(query)
            .Bind(q => services.Gateway.SendQueryAsync(q, services.CancellationToken))
            .Match<IPageList<GetCategoriesResponse>, Results<Ok<IPageList<GetCategoriesResponse>>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
