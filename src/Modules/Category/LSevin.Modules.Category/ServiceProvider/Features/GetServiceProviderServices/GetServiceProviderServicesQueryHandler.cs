using System.Text;
using System.Text.Json;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderServices;

internal sealed class GetServiceProviderServicesQueryHandler(IDbConnectionFactory dbConnectionFactory)
    : IQueryHandler<GetServiceProviderServicesQuery, IReadOnlyCollection<GetServiceProviderServicesResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetServiceProviderServicesResponse>>> Handle(
        GetServiceProviderServicesQuery request,
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

        // Build the query to get all provider services
        var sql = new StringBuilder();

        if (request.IsActive.HasValue)
        {
            parameters.Add("IsActive", request.IsActive.Value);
            sql.Append("AND ps.is_active = @IsActive ");
        }

        var servicesSql = $"""
            SELECT
                ps.id AS {nameof(ProviderServiceRowDto.Id)},
                ps.service_definition_id AS {nameof(ProviderServiceRowDto.ServiceDefinitionId)},
                sd.name AS {nameof(ProviderServiceRowDto.ServiceDefinitionName)},
                ps.display_name_translations AS {nameof(ProviderServiceRowDto.DisplayNameTranslations)},
                ps.description_translations AS {nameof(ProviderServiceRowDto.DescriptionTranslations)},
                ps.is_active AS {nameof(ProviderServiceRowDto.IsActive)},
                ps.currency AS {nameof(ProviderServiceRowDto.Currency)},
                ps.value AS {nameof(ProviderServiceRowDto.Value)},
                ps.create_date AS {nameof(ProviderServiceRowDto.CreateDate)},
                ps.last_modified_date AS {nameof(ProviderServiceRowDto.LastModifiedDate)}
            FROM category.provider_services ps
            JOIN category.service_definitions sd ON ps.service_definition_id = sd.id
            WHERE ps.service_provider_id = @ServiceProviderId
            {sql}
            """;

        // Query for the services
        var servicesLookup = new Dictionary<Guid, GetServiceProviderServicesResponse>();

        var serviceRows = await connection.QueryAsync<ProviderServiceRowDto>(
            new CommandDefinition(servicesSql, parameters, cancellationToken: cancellationToken)
        );

        foreach (var serviceRow in serviceRows)
        {
            var displayNameTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                serviceRow.DisplayNameTranslations ?? "{}"
            );
            var descriptionTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                serviceRow.DescriptionTranslations ?? "{}"
            );

            var service = new GetServiceProviderServicesResponse(
                serviceRow.Id,
                serviceRow.ServiceDefinitionId,
                serviceRow.ServiceDefinitionName,
                LocalizedContentResponseDto.FromTranslations(displayNameTranslations ?? new()),
                LocalizedContentResponseDto.FromTranslations(descriptionTranslations ?? new()),
                serviceRow.IsActive,
                serviceRow.Currency,
                serviceRow.Value,
                new List<ServiceAttributeValueDto>(),
                serviceRow.CreateDate,
                serviceRow.LastModifiedDate
            );
            servicesLookup[service.Id] = service;
        }

        if (servicesLookup.Count == 0)
        {
            return new List<GetServiceProviderServicesResponse>();
        }

        // Query for the attribute values associated with these services
        var serviceIds = servicesLookup.Keys.ToArray();

        var attributeValuesSql = $"""
            SELECT
                sav.id AS {nameof(AttributeValueRowDto.Id)},
                sav.attribute_definition_id AS {nameof(AttributeValueRowDto.AttributeDefinitionId)},
                sad.name AS {nameof(AttributeValueRowDto.AttributeName)},
                sav.value_translations AS {nameof(AttributeValueRowDto.ValueTranslations)},
                sav.provider_service_id AS {nameof(AttributeValueRowDto.ProviderServiceId)}
            FROM category.service_attribute_values sav
            JOIN category.service_attribute_definitions sad ON sav.attribute_definition_id = sad.id
            WHERE sav.provider_service_id = ANY(@ServiceIds)
            ORDER BY sad.display_order
            """;

        var attributeValueParams = new DynamicParameters();
        attributeValueParams.Add("ServiceIds", serviceIds);

        var attributeValueRows = await connection.QueryAsync<AttributeValueRowDto>(
            new CommandDefinition(attributeValuesSql, attributeValueParams, cancellationToken: cancellationToken)
        );

        // Associate attribute values with their respective services
        foreach (var row in attributeValueRows)
        {
            if (servicesLookup.TryGetValue(row.ProviderServiceId, out var service))
            {
                var valueTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    row.ValueTranslations ?? "{}"
                );

                var attributeValue = new ServiceAttributeValueDto(
                    row.Id,
                    row.AttributeDefinitionId,
                    row.AttributeName,
                    LocalizedContentResponseDto.FromTranslations(valueTranslations ?? new())
                );

                var existingValues = (service.AttributeValues as List<ServiceAttributeValueDto>)!;
                existingValues.Add(attributeValue);
            }
        }

        return servicesLookup.Values.AsList();
    }
}

// Internal row DTOs for Dapper mapping
internal sealed record ProviderServiceRowDto(
    Guid Id,
    Guid ServiceDefinitionId,
    string ServiceDefinitionName,
    string DisplayNameTranslations,
    string DescriptionTranslations,
    bool IsActive,
    string Currency,
    decimal Value,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);

internal sealed record AttributeValueRowDto(
    Guid Id,
    Guid AttributeDefinitionId,
    string AttributeName,
    string ValueTranslations,
    Guid ProviderServiceId
);
