using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAllAvailableCountries;

internal sealed class GetAllAvailableCountriesEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.Location.GetAllCountries, Handle)
            .RequireAuthorization()
            .Produces<IReadOnlyCollection<GetAllAvailableCountriesResponse>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.Location.Group)
            .WithName(nameof(GetAllAvailableCountries))
            .WithDisplayName(nameof(GetAllAvailableCountries).Humanize())
            .WithSummaryAndDescription(
                nameof(GetAllAvailableCountries).Humanize(),
                nameof(GetAllAvailableCountries).Humanize()
            );
    }

    private static Task<Results<Ok<IReadOnlyCollection<GetAllAvailableCountriesResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services
    ) =>
        Result
            .Create(GetAllAvailableCountriesQuery.Create())
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyCollection<GetAllAvailableCountriesResponse>,
                Results<Ok<IReadOnlyCollection<GetAllAvailableCountriesResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
