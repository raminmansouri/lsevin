using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceRequest.Features.AddServiceProviderRequest;

internal sealed class AddServiceProviderRequestEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.ServiceProvider.AddRequest, Handle)
            .RequireAuthorization()
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(AddServiceProviderRequest))
            .WithDisplayName(nameof(AddServiceProviderRequest).Humanize())
            .WithSummaryAndDescription(
                nameof(AddServiceProviderRequest).Humanize(),
                nameof(AddServiceProviderRequest).Humanize()
            );
    }

    private static Task<Results<Created<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid serviceProviderId,
        [FromBody] AddServiceProviderRequestRequest request
    ) =>
        Result
            .Create(new AddServiceProviderRequestCommand(serviceProviderId, request.Message))
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Created<Guid>, ProblemHttpResult>>(
                onSuccess: result =>
                    EndpointSucceedCreated(
                        uri: $"{Routes.ServiceProvider.MainUrl}/{serviceProviderId}/requests/{result}",
                        result
                    ),
                onFailure: error => EndpointFailed(error)
            );
}
