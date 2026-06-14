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
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProviderComment.Features.GetCommentsByServiceProvider;

internal sealed class GetCommentsByServiceProviderEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetComments, Handle)
            .RequireAuthorization()
            .Produces<IPageList<GetCommentsByServiceProviderResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetCommentsByServiceProvider))
            .WithDisplayName(nameof(GetCommentsByServiceProvider).Humanize())
            .WithSummaryAndDescription(
                nameof(GetCommentsByServiceProvider).Humanize(),
                nameof(GetCommentsByServiceProvider).Humanize()
            );
    }

    private static Task<Results<Ok<IPageList<GetCommentsByServiceProviderResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [FromRoute] Guid serviceProviderId,
        [AsParameters] PageRequest pageRequest
    ) =>
        Result
            .Create(GetCommentsByServiceProviderQuery.Of(serviceProviderId, pageRequest))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IPageList<GetCommentsByServiceProviderResponse>,
                Results<Ok<IPageList<GetCommentsByServiceProviderResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
