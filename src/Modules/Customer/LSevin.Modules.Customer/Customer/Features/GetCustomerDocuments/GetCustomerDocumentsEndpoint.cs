using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Common;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Customer.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Customer.Customer.Features.GetCustomerDocuments;

internal sealed class GetCustomerDocumentsEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Customer.GetDocuments, Handle)
            .RequireAuthorization()
            .Produces<IReadOnlyCollection<GetCustomerDocumentsResponse>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Customer.Group)
            .WithName(nameof(GetCustomerDocuments))
            .WithDisplayName(nameof(GetCustomerDocuments).Humanize())
            .WithSummaryAndDescription(
                nameof(GetCustomerDocuments).Humanize(),
                nameof(GetCustomerDocuments).Humanize()
            );
    }

    private static Task<Results<Ok<IReadOnlyCollection<GetCustomerDocumentsResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CustomerModule> services
    ) =>
        Result
            .Create(new GetCustomerDocumentsQuery())
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetCustomerDocumentsResponse>,
                Results<Ok<IReadOnlyCollection<GetCustomerDocumentsResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
