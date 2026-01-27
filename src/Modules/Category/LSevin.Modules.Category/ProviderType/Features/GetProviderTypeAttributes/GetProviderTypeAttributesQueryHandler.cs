using System.Data;
using System.Text.Json;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Features.GetProviderTypeAttributes;

internal sealed class GetProviderTypeAttributesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetProviderTypeAttributesQuery, GetProviderTypeAttributesResponse>
{
    public async Task<Result<GetProviderTypeAttributesResponse>> Handle(
        GetProviderTypeAttributesQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        // Fetch provider type information
        var providerTypeSql =
            $@"
            SELECT
                id AS Id,
                COALESCE(
                    name_translations ->> '{currentLocale}',
                    name_translations ->> '{defaultLocale}',
                    (name_translations ->> (SELECT jsonb_object_keys(name_translations) LIMIT 1))
                ) AS Name
            FROM category.provider_types
            WHERE id = @ProviderTypeId";

        var providerType = await connection.QuerySingleOrDefaultAsync<ProviderTypeDto>(
            new CommandDefinition(providerTypeSql, new { request.ProviderTypeId }, cancellationToken: cancellationToken)
        );

        if (providerType is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Provider_Type);
        }

        // Query attributes - only return filterable types (Text, Number, DateTime, Boolean, Select)
        var attributesSql =
            $@"
            SELECT
                pad.id AS Id,
                COALESCE(
                    pad.name_translations ->> '{currentLocale}',
                    pad.name_translations ->> '{defaultLocale}',
                    (pad.name_translations ->> (SELECT jsonb_object_keys(pad.name_translations) LIMIT 1))
                ) AS Name,
                COALESCE(
                    pad.description_translations ->> '{currentLocale}',
                    pad.description_translations ->> '{defaultLocale}',
                    (pad.description_translations ->> (SELECT jsonb_object_keys(pad.description_translations) LIMIT 1))
                ) AS Description,
                at.name AS AttributeType,
                pad.is_required AS IsRequired
            FROM category.provider_attribute_definitions pad
            INNER JOIN category.attribute_types at ON pad.attribute_type_id = at.id
            WHERE pad.provider_type_id = @ProviderTypeId
                AND pad.attribute_type_id IN (1, 2, 3, 4, 5)
            ORDER BY pad.create_date";

        var attributes = await connection.QueryAsync<AttributeRowDto>(
            new CommandDefinition(attributesSql, new { request.ProviderTypeId }, cancellationToken: cancellationToken)
        );

        var attributesList = attributes.AsList();

        // Query options for Select type attributes (only if there are attributes)
        List<AttributeOptionDto> optionsList = [];
        Dictionary<Guid, List<AttributeOptionDto>> optionsByAttribute = [];

        if (attributesList.Count > 0)
        {
            var attributeIds = attributesList.Select(a => a.Id).ToArray();
            var optionsSql =
                $@"
                SELECT
                    pado.provider_attribute_definition_id AS AttributeDefinitionId,
                    COALESCE(
                        pado.display_name_translations ->> '{currentLocale}',
                        pado.display_name_translations ->> '{defaultLocale}',
                        (pado.display_name_translations ->> (SELECT jsonb_object_keys(pado.display_name_translations) LIMIT 1))
                    ) AS DisplayName,
                    COALESCE(
                        pado.value_translations ->> '{currentLocale}',
                        pado.value_translations ->> '{defaultLocale}',
                        (pado.value_translations ->> (SELECT jsonb_object_keys(pado.value_translations) LIMIT 1))
                    ) AS Value
                FROM category.provider_attribute_definition_domain_options pado
                WHERE pado.provider_attribute_definition_id = ANY(@AttributeIds)
                ORDER BY pado.id";

            var options = await connection.QueryAsync<OptionRowDto>(
                new CommandDefinition(
                    optionsSql,
                    new { AttributeIds = attributeIds },
                    cancellationToken: cancellationToken
                )
            );

            // Group options by attribute definition ID
            optionsByAttribute = options
                .GroupBy(o => o.AttributeDefinitionId)
                .ToDictionary(g => g.Key, g => g.Select(o => new AttributeOptionDto(o.DisplayName, o.Value)).ToList());
        }

        // Build attributes list
        var attributesDtoList = attributesList
            .Select(attr => new ProviderAttributeDto(
                attr.Id,
                attr.Name,
                attr.Description,
                attr.AttributeType,
                attr.IsRequired,
                optionsByAttribute.GetValueOrDefault(attr.Id, [])?.AsReadOnly()
            ))
            .ToList();

        // Build response
        var result = new GetProviderTypeAttributesResponse(
            providerType.Id,
            providerType.Name,
            attributesDtoList.AsReadOnly()
        );

        return result;
    }

    private sealed class ProviderTypeDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = null!;
    }

    private sealed class AttributeRowDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = null!;
        public string Description { get; init; } = null!;
        public string AttributeType { get; init; } = null!;
        public bool IsRequired { get; init; }
    }

    private sealed class OptionRowDto
    {
        public Guid AttributeDefinitionId { get; init; }
        public string DisplayName { get; init; } = null!;
        public string Value { get; init; } = null!;
    }
}
