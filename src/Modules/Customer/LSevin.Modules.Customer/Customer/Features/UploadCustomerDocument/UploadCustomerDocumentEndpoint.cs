using BuildingBlocks.Core.FileUpload.Attributes;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Customer.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Customer.Customer.Features.UploadCustomerDocument;

internal sealed class UploadCustomerDocumentEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.Customer.UploadDocument, Handle)
            .RequireAuthorization()
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Customer.Group)
            .WithName(nameof(UploadCustomerDocument))
            .WithDisplayName(nameof(UploadCustomerDocument).Humanize())
            .WithSummaryAndDescription(
                nameof(UploadCustomerDocument).Humanize(),
                nameof(UploadCustomerDocument).Humanize()
            );
    }

    [DisableFormValueModelBinding]
    [MultipartFormData]
    private static Task<Results<Ok<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CustomerModule> services,
        [AsParameters] UploadCustomerDocumentRequest requestQuery,
        HttpRequest request
    ) =>
        Result
            .Create(
                new UploadCustomerDocumentCommand(request.Body, request.ContentType ?? "", requestQuery.DocumentTypeId)
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Ok<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
