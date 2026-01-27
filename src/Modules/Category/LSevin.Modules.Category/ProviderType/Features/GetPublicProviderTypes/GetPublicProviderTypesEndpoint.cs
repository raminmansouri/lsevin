using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Endpoints;
using BuildingBlocks.Web.Extensions;
using Humanizer;
using LSevin.Modules.Category.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace LSevin.Modules.Category.ProviderType.Features.GetPublicProviderTypes;

internal sealed class GetPublicProviderTypesEndpoint : EndpointResponseHandler, IEndpointDefinition
{
    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(Routes.ProviderType.GetPublicProviderTypes, Handle)
            .Produces<IReadOnlyList<GetPublicProviderTypesResponse>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithTags(Routes.ProviderType.Group)
            .WithName(nameof(GetPublicProviderTypes))
            .WithDisplayName(nameof(GetPublicProviderTypes).Humanize())
            .WithSummaryAndDescription(
                nameof(GetPublicProviderTypes).Humanize(),
                nameof(GetPublicProviderTypes).Humanize()
            );
    }

    private static Task<Results<Ok<IReadOnlyList<GetPublicProviderTypesResponse>>, ProblemHttpResult>> Handle(
        [AsParameters] BaseEndpointServices<CategoryModule> services
    ) =>
        Result
            .Create(new GetPublicProviderTypesQuery())
            .Bind(query => services.Gateway.SendQueryAsync(query, services.CancellationToken))
            .Match<
                IReadOnlyList<GetPublicProviderTypesResponse>,
                Results<Ok<IReadOnlyList<GetPublicProviderTypesResponse>>, ProblemHttpResult>
            >(onSuccess: result => EndpointSucceedOk(result), onFailure: error => EndpointFailed(error));
}
