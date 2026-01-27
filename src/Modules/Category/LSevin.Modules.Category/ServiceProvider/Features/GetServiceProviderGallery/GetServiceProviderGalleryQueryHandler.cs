using System.Text.Json;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderGallery;

internal sealed class GetServiceProviderGalleryQueryHandler(IDbConnectionFactory dbConnectionFactory)
    : IQueryHandler<GetServiceProviderGalleryQuery, IReadOnlyCollection<GetServiceProviderGalleryResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetServiceProviderGalleryResponse>>> Handle(
        GetServiceProviderGalleryQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
        parameters.Add("ServiceProviderId", request.ServiceProviderId);

        // First check if the service provider exists
        var serviceProviderExists = await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                "SELECT EXISTS(SELECT 1 FROM category.service_providers WHERE id = @ServiceProviderId)",
                parameters,
                cancellationToken: cancellationToken
            )
        );

        if (!serviceProviderExists)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);
        }

        // Query all gallery items for the service provider
        var gallerySql = $"""
            SELECT
                gi.id AS {nameof(GalleryItemRowDto.Id)},
                gi.title_translations AS {nameof(GalleryItemRowDto.TitleTranslations)},
                gi.description_translations AS {nameof(GalleryItemRowDto.DescriptionTranslations)},
                gi.url AS {nameof(GalleryItemRowDto.Url)},
                gi.media_type AS {nameof(GalleryItemRowDto.MediaType)},
                gi.display_order AS {nameof(GalleryItemRowDto.DisplayOrder)},
                gi.create_date AS {nameof(GalleryItemRowDto.CreateDate)},
                gi.last_modified_date AS {nameof(GalleryItemRowDto.LastModifiedDate)}
            FROM category.provider_gallery_items gi
            WHERE gi.service_provider_id = @ServiceProviderId
            ORDER BY gi.display_order
            """;

        var galleryItemRows = await connection.QueryAsync<GalleryItemRowDto>(
            new CommandDefinition(gallerySql, parameters, cancellationToken: cancellationToken)
        );

        // Map gallery items with deserialized JSONB fields
        var galleryItems = galleryItemRows
            .Select(gi =>
            {
                var titleTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    gi.TitleTranslations ?? "{}"
                );
                var descriptionTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    gi.DescriptionTranslations ?? "{}"
                );
                return new GetServiceProviderGalleryResponse(
                    gi.Id,
                    LocalizedContentResponseDto.FromTranslations(titleTranslations ?? new()),
                    LocalizedContentResponseDto.FromTranslations(descriptionTranslations ?? new()),
                    gi.Url,
                    gi.MediaType,
                    gi.DisplayOrder,
                    gi.CreateDate,
                    gi.LastModifiedDate
                );
            })
            .ToList();

        return galleryItems;
    }
}

// Internal row DTO for Dapper mapping
internal sealed record GalleryItemRowDto(
    Guid Id,
    string TitleTranslations,
    string DescriptionTranslations,
    string Url,
    string MediaType,
    int DisplayOrder,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
