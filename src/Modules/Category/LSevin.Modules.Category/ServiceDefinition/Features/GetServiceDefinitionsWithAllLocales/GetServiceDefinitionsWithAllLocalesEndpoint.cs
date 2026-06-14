using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries.Paging;
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

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitionsWithAllLocales;

internal sealed class GetServiceDefinitionsWithAllLocalesEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceDefinition.GetAllLocales, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IPageList<GetServiceDefinitionsWithAllLocalesResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceDefinition.Group)
            .WithName(nameof(GetServiceDefinitionsWithAllLocales))
            .WithDisplayName(nameof(GetServiceDefinitionsWithAllLocales).Humanize())
            .WithSummaryAndDescription(
                nameof(GetServiceDefinitionsWithAllLocales).Humanize(),
                nameof(GetServiceDefinitionsWithAllLocales).Humanize()
            );
    }

    private static Task<Results<Ok<IPageList<GetServiceDefinitionsWithAllLocalesResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [AsParameters] GetServiceDefinitionsWithAllLocalesRequest request,
        [AsParameters] PageRequest pageRequest
    ) =>
        Result
            .Create(GetServiceDefinitionsWithAllLocalesQuery.Of(request, pageRequest))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IPageList<GetServiceDefinitionsWithAllLocalesResponse>,
                Results<Ok<IPageList<GetServiceDefinitionsWithAllLocalesResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
