using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using LSevin.Modules.Customer;
using LSevin.Modules.Customer.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetNotificationCount;

internal sealed class GetNotificationCountEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Customer.GetNotificationCount, Handle)
            .RequireAuthorization()
            .Produces<GetNotificationCountResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Customer.Group)
            .WithName(nameof(GetNotificationCount))
            .WithDisplayName(nameof(GetNotificationCount).Humanize())
            .WithSummaryAndDescription(
                nameof(GetNotificationCount).Humanize(),
                nameof(GetNotificationCount).Humanize()
            );
    }

    private static Task<Results<Ok<GetNotificationCountResponse>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CustomerModule> services,
        [AsParameters] PageRequest pageRequest
    ) =>
        Result
            .Create(GetNotificationCountQuery.Of)
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                GetNotificationCountResponse,
                Results<Ok<GetNotificationCountResponse>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
