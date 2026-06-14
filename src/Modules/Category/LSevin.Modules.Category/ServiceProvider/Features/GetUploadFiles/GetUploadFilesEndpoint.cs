using BuildingBlocks.Core.ErrorHandling;
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

namespace LSevin.Modules.Category.ServiceProvider.Features.GetUploadFiles;

internal sealed class GetUploadFilesEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Booking.GetUploadFiles, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IReadOnlyCollection<GetUploadFilesResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetUploadFiles))
            .WithDisplayName(nameof(GetUploadFiles).Humanize())
            .WithSummaryAndDescription(
                nameof(GetUploadFiles).Humanize(),
                nameof(GetUploadFiles).Humanize()
            );
    }

    private static Task<Results<Ok<GetUploadFilesResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [AsParameters] GetUploadFilesRequest request
    ) =>
        Result
            .Create(GetUploadFilesQuery.Of(request.serviceId, request.IsActive))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                GetUploadFilesResponse,
                Results<Ok<GetUploadFilesResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
