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

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitionDetails;

internal sealed class GetServiceDefinitionDetailsEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceDefinition.GetById, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<GetServiceDefinitionDetailsResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceDefinition.Group)
            .WithName(nameof(GetServiceDefinitionDetails))
            .WithDisplayName(nameof(GetServiceDefinitionDetails).Humanize())
            .WithSummaryAndDescription(
                nameof(GetServiceDefinitionDetails).Humanize(),
                nameof(GetServiceDefinitionDetails).Humanize()
            );
    }

    private static Task<Results<Ok<GetServiceDefinitionDetailsResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid serviceDefinitionId
    ) =>
        Result
            .Create(new GetServiceDefinitionDetailsQuery(serviceDefinitionId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                GetServiceDefinitionDetailsResponse,
                Results<Ok<GetServiceDefinitionDetailsResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
