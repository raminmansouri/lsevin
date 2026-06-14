using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAvailableCountries;

internal sealed class GetAvailableCountriesEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ServiceProvider.GetAvailableCountries, Handle)
            .RequireAuthorization()
            .Produces<IReadOnlyCollection<GetAvailableCountriesResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ServiceProvider.Group)
            .WithName(nameof(GetAvailableCountries))
            .WithDisplayName(nameof(GetAvailableCountries).Humanize())
            .WithSummaryAndDescription(
                nameof(GetAvailableCountries).Humanize(),
                nameof(GetAvailableCountries).Humanize()
            );
    }

    private static Task<Results<Ok<IReadOnlyCollection<GetAvailableCountriesResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services
    ) =>
        Result
            .Create(GetAvailableCountriesQuery.Create())
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetAvailableCountriesResponse>,
                Results<Ok<IReadOnlyCollection<GetAvailableCountriesResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
