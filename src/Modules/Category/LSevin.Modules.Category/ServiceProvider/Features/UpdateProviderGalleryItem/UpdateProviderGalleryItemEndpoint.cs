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

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderGalleryItem;

internal sealed class UpdateProviderGalleryItemEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPut(Routes.ServiceProvider.UpdateGalleryItem, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .DisableAntiforgery()
            .Accepts<UpdateProviderGalleryItemRequest>(RequestHeaderConstValues.MultipartFormDataContent)
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(UpdateProviderGalleryItem))
            .WithDisplayName(nameof(UpdateProviderGalleryItem).Humanize())
            .WithSummaryAndDescription(
                nameof(UpdateProviderGalleryItem).Humanize(),
                nameof(UpdateProviderGalleryItem).Humanize()
            );
    }

    private static Task<Results<Ok<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid serviceProviderId,
        Guid galleryItemId,
        [FromForm] UpdateProviderGalleryItemRequest request
    ) =>
        Result
            .Create(
                new UpdateProviderGalleryItemCommand(
                    serviceProviderId,
                    galleryItemId,
                    request.File,
                    request.Title,
                    request.Description,
                    request.DisplayOrder
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Ok<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
