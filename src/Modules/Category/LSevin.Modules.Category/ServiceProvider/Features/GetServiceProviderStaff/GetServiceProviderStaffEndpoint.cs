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

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderStaff;

internal sealed class GetServiceProviderStaffEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetStaff, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IReadOnlyCollection<GetServiceProviderStaffResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetServiceProviderStaff))
            .WithDisplayName(nameof(GetServiceProviderStaff).Humanize())
            .WithSummaryAndDescription(
                nameof(GetServiceProviderStaff).Humanize(),
                nameof(GetServiceProviderStaff).Humanize()
            );
    }

    private static Task<Results<Ok<IReadOnlyCollection<GetServiceProviderStaffResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid id,
        [AsParameters] GetServiceProviderStaffRequest request
    ) =>
        Result
            .Create(GetServiceProviderStaffQuery.Of(id, request.IsActive))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetServiceProviderStaffResponse>,
                Results<Ok<IReadOnlyCollection<GetServiceProviderStaffResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
