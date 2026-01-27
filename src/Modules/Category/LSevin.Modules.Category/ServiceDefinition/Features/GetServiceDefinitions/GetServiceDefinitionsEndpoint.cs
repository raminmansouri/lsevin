using System.Collections.Generic;
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

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitions;

internal sealed class GetServiceDefinitionsEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceDefinition.GetAll, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IPageList<GetServiceDefinitionsResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceDefinition.Group)
            .WithName(nameof(GetServiceDefinitions))
            .WithDisplayName(nameof(GetServiceDefinitions).Humanize())
            .WithSummaryAndDescription(
                nameof(GetServiceDefinitions).Humanize(),
                nameof(GetServiceDefinitions).Humanize()
            );
    }

    private static Task<Results<Ok<IPageList<GetServiceDefinitionsResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [AsParameters] GetServiceDefinitionsRequest request,
        [AsParameters] PageRequest pageRequest
    ) =>
        Result
            .Create(GetServiceDefinitionsQuery.Of(request, pageRequest))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IPageList<GetServiceDefinitionsResponse>,
                Results<Ok<IPageList<GetServiceDefinitionsResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
