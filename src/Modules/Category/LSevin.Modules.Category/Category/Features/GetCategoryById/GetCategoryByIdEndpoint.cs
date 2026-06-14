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

namespace LSevin.Modules.Category.Category.Features.GetCategoryById;

internal sealed class GetCategoryByIdEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Category.GetById, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<GetCategoryByIdResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Category.Group)
            .WithName(nameof(GetCategoryById))
            .WithDisplayName(nameof(GetCategoryById).Humanize())
            .WithSummaryAndDescription(nameof(GetCategoryById).Humanize(), nameof(GetCategoryById).Humanize());
    }

    private static Task<Results<Ok<GetCategoryByIdResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid categoryId
    ) =>
        Result
            .Create(new GetCategoryByIdQuery(categoryId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<GetCategoryByIdResponse, Results<Ok<GetCategoryByIdResponse>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
