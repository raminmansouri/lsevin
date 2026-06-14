using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Currency.Services;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetProviderPageData;

internal sealed class GetProviderPageDataQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetProviderPageDataQuery, ProviderDataResponse>
{
    public async Task<Result<ProviderDataResponse>> Handle(
        GetProviderPageDataQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        var parameters = new DynamicParameters();

        //var response=ProviderDataFactory.Build();
        var response =await GetProviderData(request.providerId, cancellationToken);
        return response;
    }


    public async Task<ProviderDataResponse> GetProviderData(Guid providerId,CancellationToken cancellationToken)
    {
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        using var multi = await connection.QueryMultipleAsync(ProviderDataFactory.DapperSQL,
            new { ProviderId = providerId,
                CurrentLocale = currentLocale,
                DefaultLocale = defaultLocale
            });

        // 1. Provider
        var provider = await multi.ReadFirstOrDefaultAsync<Provider>();

        // 2. Images
        var images = (await multi.ReadAsync<string>()).ToList();

        // 3. Certifications
        var certifications = (await multi.ReadAsync<Certification>()).ToList();

        // 4. Languages
        var languages = (await multi.ReadAsync<string>()).ToList();

        // Attach to provider
        provider.Images = images;
        provider.Certifications = certifications;
        provider.Languages = languages;

        // 5. Services
        var services = (await multi.ReadAsync<Service>()).ToList();

        // 6. Specialists
        var specialists = (await multi.ReadAsync<Specialist>()).ToList();

        // 7. Reviews
        var reviews = (await multi.ReadAsync<Review>()).ToList();

        // 8. Review Images
        var reviewImages = (await multi.ReadAsync<(Guid ReviewId, string ImageUrl)>()).ToList();

        var reviewImageLookup = reviewImages
            .GroupBy(x => x.ReviewId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(x => x.ImageUrl).ToList()
            );

        foreach (var review in reviews)
        {
            if (reviewImageLookup.TryGetValue(review.Id, out var imgs))
                review.Images = imgs;
        }

        // 9. Local Recommendations
        var localRecommendations = (await multi.ReadAsync<Recommendation>()).ToList();

        // 10. International Recommendations
        var internationalRecommendations = (await multi.ReadAsync<Recommendation>()).ToList();

        return new ProviderDataResponse
        {
            Provider = provider,
            Services = services,
            Specialists = specialists,
            RecentReviews = reviews,
            LocalRecommendations = localRecommendations,
            InternationalRecommendations = internationalRecommendations
        };
    }
}
