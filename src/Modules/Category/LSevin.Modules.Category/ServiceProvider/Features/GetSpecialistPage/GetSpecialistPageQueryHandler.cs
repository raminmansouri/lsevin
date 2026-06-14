using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Currency.Services;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetSpecialistPage;

internal sealed class GetSpecialistPageQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetSpecialistPageQuery, GetSpecialistPageResponse>
{
    public async Task<Result<GetSpecialistPageResponse>> Handle(
        GetSpecialistPageQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        //var response = SpecialistPageData.Response;
        var response = await GetSpecialistPage(request.specialistId,cancellationToken);

        return response;
    }

    public async Task<GetSpecialistPageResponse?> GetSpecialistPage(Guid specialistId, CancellationToken cancellationToken)
    {
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        using var multi = await connection.QueryMultipleAsync(
            SpecialistPageData.DapperSQL,
            new
            {
                SpecialistId = specialistId,
                CurrentLocale = currentLocale,
                DefaultLocale = defaultLocale
            });

        // 1. Specialist
        var specialist = await multi.ReadFirstOrDefaultAsync<Specialist>();
        if (specialist is null)
            return null;

        // 2. Languages
        specialist = specialist with
        {
            Languages = (await multi.ReadAsync<string>()).ToList()
        };

        // 3. Specializations
        var specializations = (await multi.ReadAsync<string>()).ToList();

        // 4. Education
        var education = (await multi.ReadAsync<EducationEntry>()).ToList();

        // 5. Certifications
        var certifications = (await multi.ReadAsync<Certification>()).ToList();

        // 6. Achievements
        var achievements = (await multi.ReadAsync<Achievement>()).ToList();

        // 7. Before/After
        var beforeAfter = (await multi.ReadAsync<BeforeAfter>()).ToList();

        // 8. Reviews
        var reviews = (await multi.ReadAsync<Review>()).ToList();

        // 9. Review Images
        var reviewImages = (await multi.ReadAsync<(string ReviewId, string ImageUrl)>()).ToList();

        var reviewLookup = reviewImages
            .GroupBy(x => x.ReviewId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.ImageUrl).ToList());

        foreach (var r in reviews)
        {
            if (reviewLookup.TryGetValue(r.Id, out var imgs))
                r.Images = imgs;
        }

        return new GetSpecialistPageResponse
        {
            Specialist = specialist,
            Specializations = specializations,
            Education = education,
            Certifications = certifications,
            Achievements = achievements,
            BeforeAfter = beforeAfter,
            RecentReviews = reviews
        };
    }
}


