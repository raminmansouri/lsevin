using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Customer.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Customer.Consulting.Features.RequestConsulting;

internal sealed class RequestConsultingEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.Consulting.Create, Handle)
            .RequireAuthorization()
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Consulting.Group)
            .WithName(nameof(RequestConsulting))
            .WithDisplayName(nameof(RequestConsulting).Humanize())
            .WithSummaryAndDescription(nameof(RequestConsulting).Humanize(), nameof(RequestConsulting).Humanize());
    }

    private static Task<Results<Created<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CustomerModule> services,
        [FromBody] RequestConsultingRequest request
    ) =>
        Result
            .Create(
                new RequestConsultingCommand(
                    request.Description,
                    request.CategoryId,
                    request.CategoryName,
                    request.DocumentIds
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Created<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedCreated(uri: $"{Routes.Consulting.MainUrl}/{result}", result),
                onFailure: error => EndpointFailed(error)
            );
}
