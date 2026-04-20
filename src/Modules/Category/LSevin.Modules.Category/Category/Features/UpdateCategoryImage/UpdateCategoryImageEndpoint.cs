using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Core.Web.Constants;
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

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateCategoryImage;

internal sealed class UpdateCategoryImageEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPut(Routes.Category.UpdateImage, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .DisableAntiforgery()
            .Accepts<UpdateCategoryImageRequest>(RequestHeaderConstValues.MultipartFormDataContent)
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(UpdateCategoryImage))
            .WithDisplayName(nameof(UpdateCategoryImage).Humanize())
            .WithSummaryAndDescription(
                nameof(UpdateCategoryImage).Humanize(),
                nameof(UpdateCategoryImage).Humanize()
            );
    }

    private static Task<Results<Ok<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid categoryId,
        [FromForm] UpdateCategoryImageRequest request
    ) =>
        Result
            .Create(
                new UpdateCategoryImageCommand(
                    categoryId,
                    request.File
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Ok<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
