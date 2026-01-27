using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Common;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.Category.Features.CreateCategory;

internal sealed class CreateCategoryEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.Category.Create, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Category.Group)
            .WithName(nameof(CreateCategory))
            .WithDisplayName(nameof(CreateCategory).Humanize())
            .WithSummaryAndDescription(nameof(CreateCategory).Humanize(), nameof(CreateCategory).Humanize());
    }

    private static Task<Results<Created<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [FromBody] CreateCategoryRequest request
    ) =>
        Result
            .Create(
                new CreateCategoryCommand(
                    request.Name,
                    request.Description,
                    request.ParentId,
                    request.DisplayOrder,
                    request.IsActive,
                    request.IconUrl
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Created<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedCreated(uri: $"{Routes.Category.MainUrl}/{result}", result),
                onFailure: error => EndpointFailed(error)
            );
}
