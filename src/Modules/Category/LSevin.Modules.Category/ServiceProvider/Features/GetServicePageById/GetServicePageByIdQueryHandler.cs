using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Currency.Services;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceById;
using System.Threading;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServicePageById;

internal sealed class GetServicePageByIdQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetServicePageByIdQuery, GetServicePageByIdResponse>
{
    public async Task<Result<GetServicePageByIdResponse>> Handle(
        GetServicePageByIdQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();

        try
        {

            var response = await GetServicePage(request.serviceId, cancellationToken);
            //var response = GetServicePageByIdResponse.FromJson(GetServicePageByIdResponse.SampleJson);

            return response;
        }
        catch(Exception e)
        {
            throw;
        }
    }

    public async Task<GetServicePageByIdResponse> GetServicePage(Guid serviceId, CancellationToken cancellationToken)
    {
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        //using var connection = _dbConnection;

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        using var multi = await connection.QueryMultipleAsync(
            GetServicePageByIdResponse.DapperSQL,
            new { ServiceId = serviceId,
                CurrentLocale = currentLocale,
                DefaultLocale = defaultLocale
            });

        // 1. Service
        var service = await multi.ReadFirstOrDefaultAsync<Service>();
        if (service == null)
            return null;


               // 2. Images
        service.Images = (await multi.ReadAsync<string>())?.ToArray();

        // 3. Other currencies
        service.OtherCurrencies = (await multi.ReadAsync<OtherCurrency>())?.ToArray();

        // 4. Included
        var included = (await multi.ReadAsync<string>())?.ToArray();

        // 5. Process
        var process = (await multi.ReadAsync<Process>())?.ToArray();

        // 6. FAQs
        var faqs = (await multi.ReadAsync<Faq>())?.ToArray();

        // 7. Reviews
        var reviews = (await multi.ReadAsync<TopReview>()).ToList();

        // 8. Review Images
        var reviewImages = (await multi.ReadAsync<(string ReviewId, string ImageUrl)>()).ToList();

        var reviewLookup = reviewImages
            .GroupBy(x => x.ReviewId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.ImageUrl).ToArray());

        foreach (var r in reviews)
        {
            if (reviewLookup.TryGetValue(r.Id, out var imgs))
                r.Images = imgs;
        }

        // 9. Local Recommendations
        var local = (await multi.ReadAsync<AlRecommendation>())?.ToArray();

        // 10. International Recommendations
        var international = (await multi.ReadAsync<AlRecommendation>())?.ToArray();

        return new GetServicePageByIdResponse
        {
            Service = service,
            Included = included,
            Process = process,
            Faqs = faqs,
            TopReviews = reviews.ToArray(),
            LocalRecommendations = local,
            InternationalRecommendations = international
        };
    }
}


