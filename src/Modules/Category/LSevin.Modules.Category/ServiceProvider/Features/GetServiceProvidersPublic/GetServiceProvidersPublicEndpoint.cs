using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProvidersPublic;

internal sealed class GetServiceProvidersPublicEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetPublicAll, Handle)
            .RequireAuthorization()
            .Produces<IReadOnlyCollection<GetServiceProvidersPublicResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetServiceProvidersPublic))
            .WithDisplayName(nameof(GetServiceProvidersPublic).Humanize())
            .WithSummaryAndDescription(
                nameof(GetServiceProvidersPublic).Humanize(),
                nameof(GetServiceProvidersPublic).Humanize()
            );
    }

    private static Task<Results<Ok<IReadOnlyCollection<GetServiceProvidersPublicResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        string? countryCode,
        string? cityCode,
        string? filters
    ) =>
        Result
            .Create(new GetServiceProvidersPublicQuery(countryCode, cityCode, filters))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetServiceProvidersPublicResponse>,
                Results<Ok<IReadOnlyCollection<GetServiceProvidersPublicResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
