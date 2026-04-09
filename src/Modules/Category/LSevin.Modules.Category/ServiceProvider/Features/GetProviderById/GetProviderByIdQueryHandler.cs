using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Currency.Services;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Dtos;
using System.Text.Json;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetProviderById;

internal sealed class GetProviderByIdQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetProviderByIdQuery, ProviderResponse>
{
    public async Task<Result<ProviderResponse>> Handle(
        GetProviderByIdQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;






        var sampleResponse = ProviderDataProvider.GetSampleProviderResponse();

        return new ProviderResponse
        {
            InternationalRecommendations = sampleResponse.InternationalRecommendations,
            LocalRecommendations = sampleResponse.LocalRecommendations,
            Provider = sampleResponse.Provider,
            RecentReviews = sampleResponse.RecentReviews,
            Services = sampleResponse.Services,
            Specialists = sampleResponse.Specialists,
        };
    }
}

// Internal row DTOs for Dapper mapping
internal sealed record ServiceProviderRowDto(
    Guid Id,
    string NameTranslations,
    string DescriptionTranslations,
    string ContactEmail,
    string ContactPhone,
    string Country,
    string City,
    string? StreetTranslations,
    string? DetailTranslations,
    string ZipCode,
    decimal? Longitude,
    decimal? Latitude,
    bool IsActive,
    Guid ProviderTypeId,
    string ProviderTypeName,
    int? GradeId,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);

internal sealed record ProviderAttributeRowDto(
    Guid Id,
    Guid AttributeDefinitionId,
    string AttributeName,
    string ValueTranslations
);

internal sealed record GalleryItemRowDto(
    Guid Id,
    string TitleTranslations,
    string DescriptionTranslations,
    string Url,
    string MediaType,
    int DisplayOrder
);

internal sealed record PolicyRowDto(Guid Id, string TypeTranslations, string DescriptionTranslations);

internal sealed record ProviderServiceRowDto(
    Guid Id,
    Guid ServiceDefinitionId,
    int DurationMinutes,
    string DisplayNameTranslations,
    string DescriptionTranslations,
    bool IsActive,
    string Currency,
    decimal Value
);

internal sealed record ProviderStaffRowDto(
    Guid Id,
    Guid StaffId,
    string StaffName,
    string StaffTitle,
    string NotesTranslations,
    bool IsActive
);
