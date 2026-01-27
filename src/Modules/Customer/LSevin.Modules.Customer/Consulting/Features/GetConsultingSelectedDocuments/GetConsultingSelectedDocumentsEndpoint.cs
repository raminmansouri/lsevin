using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Common;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Customer.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Customer.Consulting.Features.GetConsultingSelectedDocuments;

internal sealed class GetConsultingSelectedDocumentsEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Consulting.GetSelectedDocuments, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<IReadOnlyCollection<GetConsultingSelectedDocumentsResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Consulting.Group)
            .WithName(nameof(GetConsultingSelectedDocuments))
            .WithDisplayName(nameof(GetConsultingSelectedDocuments).Humanize())
            .WithSummaryAndDescription(
                nameof(GetConsultingSelectedDocuments).Humanize(),
                nameof(GetConsultingSelectedDocuments).Humanize()
            );
    }

    private static Task<
        Results<Ok<IReadOnlyCollection<GetConsultingSelectedDocumentsResponse>>, ProblemHttpResult>
    > Handle([AsParameters] BaseEndpointServices<CustomerModule> services, [FromRoute] Guid consultingId) =>
        Result
            .Create(new GetConsultingSelectedDocumentsQuery(consultingId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetConsultingSelectedDocumentsResponse>,
                Results<Ok<IReadOnlyCollection<GetConsultingSelectedDocumentsResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
