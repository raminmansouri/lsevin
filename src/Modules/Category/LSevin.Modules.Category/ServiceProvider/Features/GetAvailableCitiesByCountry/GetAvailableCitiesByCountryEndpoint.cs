using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAvailableCitiesByCountry;

internal sealed class GetAvailableCitiesByCountryEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetAvailableCitiesByCountry, Handle)
            .RequireAuthorization()
            .Produces<IReadOnlyCollection<GetAvailableCitiesByCountryResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetAvailableCitiesByCountry))
            .WithDisplayName(nameof(GetAvailableCitiesByCountry).Humanize())
            .WithSummaryAndDescription(
                nameof(GetAvailableCitiesByCountry).Humanize(),
                nameof(GetAvailableCitiesByCountry).Humanize()
            );
    }

    private static Task<
        Results<Ok<IReadOnlyCollection<GetAvailableCitiesByCountryResponse>>, ProblemHttpResult>
    > Handle([AsParameters] BaseEndpointServices<CategoryModule> services, string countryCode) =>
        Result
            .Create(GetAvailableCitiesByCountryQuery.Of(countryCode))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetAvailableCitiesByCountryResponse>,
                Results<Ok<IReadOnlyCollection<GetAvailableCitiesByCountryResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
