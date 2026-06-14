using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAllAvailableCitiesByCountry;

internal sealed class GetAllAvailableCitiesByCountryEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Location.GetAllCitiesByCountry, Handle)
            .RequireAuthorization()
            .Produces<IReadOnlyCollection<GetAllAvailableCitiesByCountryResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Location.Group)
            .WithName(nameof(GetAllAvailableCitiesByCountry))
            .WithDisplayName(nameof(GetAllAvailableCitiesByCountry).Humanize())
            .WithSummaryAndDescription(
                nameof(GetAllAvailableCitiesByCountry).Humanize(),
                nameof(GetAllAvailableCitiesByCountry).Humanize()
            );
    }

    private static Task<
        Results<Ok<IReadOnlyCollection<GetAllAvailableCitiesByCountryResponse>>, ProblemHttpResult>
    > Handle([AsParameters] BaseEndpointServices<CategoryModule> services, string countryCode) =>
        Result
            .Create(GetAllAvailableCitiesByCountryQuery.Of(countryCode))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetAllAvailableCitiesByCountryResponse>,
                Results<Ok<IReadOnlyCollection<GetAllAvailableCitiesByCountryResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
