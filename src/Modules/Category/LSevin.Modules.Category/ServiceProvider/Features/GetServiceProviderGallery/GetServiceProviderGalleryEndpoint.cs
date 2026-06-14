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

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderGallery;

internal sealed class GetServiceProviderGalleryEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetGalleryItems, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IReadOnlyCollection<GetServiceProviderGalleryResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetServiceProviderGallery))
            .WithDisplayName(nameof(GetServiceProviderGallery).Humanize())
            .WithSummaryAndDescription(
                nameof(GetServiceProviderGallery).Humanize(),
                nameof(GetServiceProviderGallery).Humanize()
            );
    }

    private static Task<Results<Ok<IReadOnlyCollection<GetServiceProviderGalleryResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid id
    ) =>
        Result
            .Create(GetServiceProviderGalleryQuery.Of(id))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetServiceProviderGalleryResponse>,
                Results<Ok<IReadOnlyCollection<GetServiceProviderGalleryResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
