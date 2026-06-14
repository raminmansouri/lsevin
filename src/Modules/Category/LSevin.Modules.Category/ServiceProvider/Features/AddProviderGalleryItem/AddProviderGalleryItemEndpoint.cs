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

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderGalleryItem;

internal sealed class AddProviderGalleryItemEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.ServiceProvider.AddGalleryItem, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .DisableAntiforgery()
            .Accepts<AddProviderGalleryItemRequest>(RequestHeaderConstValues.MultipartFormDataContent)
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(AddProviderGalleryItem))
            .WithDisplayName(nameof(AddProviderGalleryItem).Humanize())
            .WithSummaryAndDescription(
                nameof(AddProviderGalleryItem).Humanize(),
                nameof(AddProviderGalleryItem).Humanize()
            );
    }

    private static Task<Results<Ok<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid serviceProviderId,
        [FromForm] AddProviderGalleryItemRequest request
    ) =>
        Result
            .Create(
                new AddProviderGalleryItemCommand(serviceProviderId, request.File, request.Title, request.Description)
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Ok<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
