using System.Text.Json;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;
using LSevin.Modules.Category.ProviderType.Dtos;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypeById;

internal sealed class GetProviderTypeByIdQueryHandler(IDbConnectionFactory dbConnectionFactory)
    : IQueryHandler<GetProviderTypeByIdQuery, GetProviderTypeByIdResponse>
{
    public async Task<Result<GetProviderTypeByIdResponse>> Handle(
        GetProviderTypeByIdQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var sql =
            @"
            SELECT
                pt.id AS Id,
                pt.name_translations AS NameTranslations,
                pt.description_translations AS DescriptionTranslations,
                pt.is_active AS IsActive,
                pt.icon_url AS IconUrl,
                pt.create_date AS CreateDate,
                pt.last_modified_date AS LastModifiedDate
            FROM category.provider_types pt
            WHERE pt.id = @ProviderTypeId;

            SELECT
                pad.id AS Id,
                pad.name_translations AS NameTranslations,
                pad.description_translations AS DescriptionTranslations,
                pad.attribute_type_id AS AttributeTypeId,
                pad.is_required AS IsRequired,
                pad.validation_rules AS ValidationRules,
                pado.display_name_translations AS DisplayNameTranslations,
                pado.value_translations AS ValueTranslations,
                pado.id AS OptionId
            FROM category.provider_attribute_definitions pad
            LEFT JOIN category.provider_attribute_definition_domain_options pado ON pad.id = pado.provider_attribute_definition_id
            WHERE pad.provider_type_id = @ProviderTypeId
            ORDER BY pad.id;";

        await using var multi = await connection.QueryMultipleAsync(sql, new { request.ProviderTypeId });

        var providerType = await multi.ReadSingleOrDefaultAsync<ProviderTypeRowDto>();
        if (providerType == null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Provider_Type);
        }

        // Parse provider type JSON translations
        var nameTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
            providerType.NameTranslations ?? "{}"
        );
        var descriptionTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
            providerType.DescriptionTranslations ?? "{}"
        );

        // Read attribute definitions and options
        var attributeRows = await multi.ReadAsync<ProviderAttributeRowDto>();
        var attributeDefinitions = new List<ProviderAttributeDefinitionResponseDto>();
        var currentAttributeId = Guid.Empty;
        var currentOptions = new List<AttributeOptionResponseDto>();
        ProviderAttributeDefinitionResponseDto? currentAttribute = null;

        foreach (var row in attributeRows)
        {
            if (currentAttributeId != row.Id)
            {
                if (currentAttribute != null)
                {
                    attributeDefinitions.Add(currentAttribute);
                    currentOptions = new List<AttributeOptionResponseDto>();
                }

                // Parse attribute definition JSON translations
                var attrNameTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    row.NameTranslations ?? "{}"
                );
                var attrDescTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    row.DescriptionTranslations ?? "{}"
                );

                string attributeType = AttributeType.GetNameFromId(row.AttributeTypeId);
                currentAttribute = new ProviderAttributeDefinitionResponseDto(
                    row.Id,
                    LocalizedContentResponseDto.FromTranslations(
                        attrNameTranslations ?? new Dictionary<string, string>()
                    ),
                    LocalizedContentResponseDto.FromTranslations(
                        attrDescTranslations ?? new Dictionary<string, string>()
                    ),
                    attributeType,
                    row.IsRequired,
                    row.ValidationRules,
                    currentOptions.AsReadOnly()
                );

                currentAttributeId = row.Id;
            }

            if (row.DisplayNameTranslations != null)
            {
                var displayNameTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    row.DisplayNameTranslations ?? "{}"
                );
                var valueTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    row.ValueTranslations ?? "{}"
                );

                currentOptions.Add(
                    new AttributeOptionResponseDto(
                        LocalizedContentResponseDto.FromTranslations(
                            displayNameTranslations ?? new Dictionary<string, string>()
                        ),
                        LocalizedContentResponseDto.FromTranslations(
                            valueTranslations ?? new Dictionary<string, string>()
                        )
                    )
                );
            }
        }

        if (currentAttribute != null)
        {
            attributeDefinitions.Add(currentAttribute);
        }

        var response = new GetProviderTypeByIdResponse(
            providerType.Id,
            LocalizedContentResponseDto.FromTranslations(nameTranslations ?? new Dictionary<string, string>()),
            LocalizedContentResponseDto.FromTranslations(descriptionTranslations ?? new Dictionary<string, string>()),
            providerType.IsActive,
            providerType.IconUrl,
            providerType.CreateDate,
            providerType.LastModifiedDate,
            attributeDefinitions.AsReadOnly()
        );

        return response;
    }
}

internal sealed record ProviderTypeRowDto(
    Guid Id,
    string NameTranslations,
    string DescriptionTranslations,
    bool IsActive,
    string? IconUrl,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);

internal sealed record ProviderAttributeRowDto(
    Guid Id,
    string NameTranslations,
    string DescriptionTranslations,
    int AttributeTypeId,
    bool IsRequired,
    string? ValidationRules,
    string? DisplayNameTranslations,
    string? ValueTranslations,
    int? OptionId
);
