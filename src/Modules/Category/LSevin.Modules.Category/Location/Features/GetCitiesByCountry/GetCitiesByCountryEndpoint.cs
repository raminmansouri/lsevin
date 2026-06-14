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

namespace LSevin.Modules.Category.Location.Features.GetCitiesByCountry;

internal sealed class GetCitiesByCountryEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Location.GetCitiesByCountry, Handle)
            .RequireAuthorization()
            .Produces<IReadOnlyCollection<GetCitiesByCountryResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Location.Group)
            .WithName(nameof(GetCitiesByCountry))
            .WithDisplayName(nameof(GetCitiesByCountry).Humanize())
            .WithSummaryAndDescription(nameof(GetCitiesByCountry).Humanize(), nameof(GetCitiesByCountry).Humanize());
    }

    private static Task<Results<Ok<IReadOnlyCollection<GetCitiesByCountryResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services,
        Guid countryId
    ) =>
        Result
            .Create(GetCitiesByCountryQuery.Of(countryId))
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetCitiesByCountryResponse>,
                Results<Ok<IReadOnlyCollection<GetCitiesByCountryResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
