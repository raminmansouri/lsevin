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

namespace LSevin.Modules.Category.Staff.Features.GetStaff;

internal sealed class GetStaffEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Staff.GetAll, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IPageList<GetStaffResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Staff.Group)
            .WithName(nameof(GetStaff))
            .WithDisplayName(nameof(GetStaff).Humanize())
            .WithSummaryAndDescription(nameof(GetStaff).Humanize(), nameof(GetStaff).Humanize());
    }

    private static Task<Results<Ok<IPageList<GetStaffResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        [AsParameters] GetStaffRequest request,
        [AsParameters] PageRequest pageRequest
    ) =>
        Result
            .Create(GetStaffQuery.Of(request, pageRequest))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<IPageList<GetStaffResponse>, Results<Ok<IPageList<GetStaffResponse>>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
