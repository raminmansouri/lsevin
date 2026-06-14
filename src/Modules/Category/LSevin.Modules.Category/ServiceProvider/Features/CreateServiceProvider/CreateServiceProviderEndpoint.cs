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

namespace LSevin.Modules.Category.ServiceProvider.Features.CreateServiceProvider;

internal sealed class CreateServiceProviderEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost(Routes.ServiceProvider.Create, Handle)
            .RequireAuthorization(SecurityConstants.Role.Admin)
            .Produces<Guid>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(CreateServiceProvider))
            .WithDisplayName(nameof(CreateServiceProvider).Humanize())
            .WithSummaryAndDescription(
                nameof(CreateServiceProvider).Humanize(),
                nameof(CreateServiceProvider).Humanize()
            );
    }

    private static Task<Results<Ok<Guid>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        CreateServiceProviderRequest request
    ) =>
        Result
            .Create(
                new CreateServiceProviderCommand(
                    request.Name,
                    request.Description,
                    request.ContactEmail,
                    request.ContactPhone,
                    request.CountryCode,
                    request.Address,
                    request.ProviderTypeId,
                    request.IsActive,
                    request.GradeId
                )
            )
            .Bind(command => services.Gateway.SendCommandAsync(command, services.CancellationToken))
            .Match<Guid, Results<Ok<Guid>, ProblemHttpResult>>(
                onSuccess: result => EndpointSucceedOk(result),
                onFailure: error => EndpointFailed(error)
            );
}
