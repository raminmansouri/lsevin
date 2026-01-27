using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProvidersByProviderType;

internal sealed class GetServiceProvidersByProviderTypeEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetByProviderType, Handle)
            .RequireAuthorization()
            .Produces<IPageList<GetServiceProvidersByProviderTypeResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetServiceProvidersByProviderType))
            .WithDisplayName(nameof(GetServiceProvidersByProviderType).Humanize())
            .WithSummaryAndDescription(
                nameof(GetServiceProvidersByProviderType).Humanize(),
                nameof(GetServiceProvidersByProviderType).Humanize()
            );
    }

    private static Task<Results<Ok<IPageList<GetServiceProvidersByProviderTypeResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [AsParameters] GetServiceProvidersByProviderTypeRequest request,
        [AsParameters] PageRequest pageRequest
    ) =>
        Result
            .Create(GetServiceProvidersByProviderTypeQuery.Of(request, pageRequest))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IPageList<GetServiceProvidersByProviderTypeResponse>,
                Results<Ok<IPageList<GetServiceProvidersByProviderTypeResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
