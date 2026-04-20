using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Core.Web.Constants;
using BuildingBlocks.Security.Common;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.ServiceProvider.Features.UpdateCategoryImage;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.UploadAnyFile;

internal sealed class UpdateCategoryEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPut(Routes.Category.UpdateImage, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .DisableAntiforgery()
            .Accepts<UploadAnyFileRequest>(RequestHeaderConstValues.MultipartFormDataContent)
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(UploadAnyFile))
            .WithDisplayName(nameof(UploadAnyFile).Humanize())
            .WithSummaryAndDescription(
                nameof(UploadAnyFile).Humanize(),
                nameof(UploadAnyFile).Humanize()
            );
    }

    private static Task<Results<Ok<string>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        int path,
        [FromForm] UploadAnyFileRequest request
    ) =>
        Result
            .Create(
                new UploadAnyFileCommand(
                    path,
                    request.File
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<string, Results<Ok<string>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
