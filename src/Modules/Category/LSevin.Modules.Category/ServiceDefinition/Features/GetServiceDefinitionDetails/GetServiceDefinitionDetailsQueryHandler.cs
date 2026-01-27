using System.Text.Json;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.Dtos;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ServiceDefinition.Features.GetServiceDefinitionDetails;

internal sealed class GetServiceDefinitionDetailsQueryHandler(IDbConnectionFactory dbConnectionFactory)
    : IQueryHandler<GetServiceDefinitionDetailsQuery, GetServiceDefinitionDetailsResponse>
{
    public async Task<Result<GetServiceDefinitionDetailsResponse>> Handle(
        GetServiceDefinitionDetailsQuery request,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var sql =
            @"
            SELECT
                sd.id AS Id,
                sd.name_translations AS NameTranslations,
                sd.description_translations AS DescriptionTranslations,
                sd.category_id AS CategoryId,
                c.name_translations ->> 'en-US' AS CategoryName,
                sd.duration_minutes AS DurationMinutes,
                sd.currency AS Currency,
                sd.value AS Value,
                sd.pricing_model AS PricingModel,
                sd.is_active AS IsActive
            FROM category.service_definitions sd
            JOIN category.categories c ON sd.category_id = c.id
            WHERE sd.id = @ServiceDefinitionId;

            SELECT
                sad.id AS Id,
                sad.name_translations AS NameTranslations,
                sad.description_translations AS DescriptionTranslations,
                sad.attribute_type_id AS AttributeTypeId,
                sad.is_required AS IsRequired,
                sad.affects_pricing AS AffectsPricing,
                sad.display_order AS DisplayOrder,
                ao.display_name_translations AS DisplayNameTranslations,
                ao.value_translations AS ValueTranslations,
                ao.additional_price AS AdditionalPrice
            FROM category.service_attribute_definitions sad
            LEFT JOIN category.service_attribute_definition_options ao ON sad.id = ao.service_attribute_definition_id
            WHERE sad.service_definition_id = @ServiceDefinitionId
            ORDER BY sad.display_order, sad.id;

            SELECT
                sr.description_translations AS DescriptionTranslations,
                sr.is_mandatory AS IsMandatory
            FROM category.service_definition_domain_requirements sr
            WHERE sr.service_definition_id = @ServiceDefinitionId;";

        await using var multi = await connection.QueryMultipleAsync(sql, new { request.ServiceDefinitionId });

        var serviceDefinition = await multi.ReadSingleOrDefaultAsync<ServiceDefinitionRowDto>();
        if (serviceDefinition == null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Definition);
        }

        // Parse service definition translations
        var nameTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
            serviceDefinition.NameTranslations ?? "{}"
        );
        var descriptionTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
            serviceDefinition.DescriptionTranslations ?? "{}"
        );

        // Read attribute definitions and options
        var attributeRows = await multi.ReadAsync<ServiceAttributeRowDto>();
        var attributeDefinitions = new List<ServiceAttributeDefinitionDto>();
        var currentAttributeId = Guid.Empty;
        var currentOptions = new List<AttributeOptionDto>();
        ServiceAttributeDefinitionDto? currentAttribute = null;

        foreach (var row in attributeRows)
        {
            if (currentAttributeId != row.Id)
            {
                if (currentAttribute != null)
                {
                    attributeDefinitions.Add(currentAttribute);
                    currentOptions = new List<AttributeOptionDto>();
                }

                // Parse attribute definition translations
                var attrNameTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    row.NameTranslations ?? "{}"
                );
                var attrDescriptionTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    row.DescriptionTranslations ?? "{}"
                );

                string attributeType = AttributeType.GetNameFromId(row.AttributeTypeId);
                currentAttribute = new ServiceAttributeDefinitionDto(
                    row.Id,
                    LocalizedContentResponseDto.FromTranslations(
                        attrNameTranslations ?? new Dictionary<string, string>()
                    ),
                    LocalizedContentResponseDto.FromTranslations(
                        attrDescriptionTranslations ?? new Dictionary<string, string>()
                    ),
                    attributeType,
                    row.IsRequired,
                    row.AffectsPricing,
                    row.DisplayOrder,
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
                    new AttributeOptionDto(
                        LocalizedContentResponseDto.FromTranslations(
                            displayNameTranslations ?? new Dictionary<string, string>()
                        ),
                        LocalizedContentResponseDto.FromTranslations(
                            valueTranslations ?? new Dictionary<string, string>()
                        ),
                        row.AdditionalPrice
                    )
                );
            }
        }

        if (currentAttribute != null)
        {
            attributeDefinitions.Add(currentAttribute);
        }

        // Read requirements
        var requirementRows = await multi.ReadAsync<ServiceRequirementRowDto>();
        var requirements = requirementRows
            .Select(r =>
            {
                var reqDescTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    r.DescriptionTranslations ?? "{}"
                );
                return new ServiceRequirementDto(
                    LocalizedContentResponseDto.FromTranslations(
                        reqDescTranslations ?? new Dictionary<string, string>()
                    ),
                    r.IsMandatory
                );
            })
            .ToList();

        return new GetServiceDefinitionDetailsResponse(
            serviceDefinition.Id,
            LocalizedContentResponseDto.FromTranslations(nameTranslations ?? new Dictionary<string, string>()),
            LocalizedContentResponseDto.FromTranslations(descriptionTranslations ?? new Dictionary<string, string>()),
            serviceDefinition.CategoryId,
            serviceDefinition.CategoryName,
            serviceDefinition.DurationMinutes,
            serviceDefinition.Currency,
            serviceDefinition.Value,
            serviceDefinition.PricingModel,
            serviceDefinition.IsActive,
            attributeDefinitions.AsReadOnly(),
            requirements.AsReadOnly()
        );
    }
}

internal sealed record ServiceDefinitionRowDto(
    Guid Id,
    string NameTranslations,
    string DescriptionTranslations,
    Guid CategoryId,
    string CategoryName,
    int DurationMinutes,
    string Currency,
    decimal Value,
    string PricingModel,
    bool IsActive
);

internal sealed record ServiceAttributeRowDto(
    Guid Id,
    string NameTranslations,
    string DescriptionTranslations,
    int AttributeTypeId,
    bool IsRequired,
    bool AffectsPricing,
    int DisplayOrder,
    string? DisplayNameTranslations,
    string? ValueTranslations,
    decimal? AdditionalPrice
);

internal sealed record ServiceRequirementRowDto(string DescriptionTranslations, bool IsMandatory);
