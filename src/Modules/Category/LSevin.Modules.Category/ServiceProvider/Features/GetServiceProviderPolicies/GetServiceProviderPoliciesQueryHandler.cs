using System.Text.Json;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderPolicies;

internal sealed class GetServiceProviderPoliciesQueryHandler(IDbConnectionFactory dbConnectionFactory)
    : IQueryHandler<GetServiceProviderPoliciesQuery, IReadOnlyCollection<GetServiceProviderPoliciesResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetServiceProviderPoliciesResponse>>> Handle(
        GetServiceProviderPoliciesQuery request,
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

        // Query all policies for the service provider
        var policiesSql = $"""
            SELECT
                pp.id AS {nameof(PolicyRowDto.Id)},
                pp.type_translations AS {nameof(PolicyRowDto.TypeTranslations)},
                pp.description_translations AS {nameof(PolicyRowDto.DescriptionTranslations)},
                pp.create_date AS {nameof(PolicyRowDto.CreateDate)},
                pp.last_modified_date AS {nameof(PolicyRowDto.LastModifiedDate)}
            FROM category.provider_policies pp
            WHERE pp.service_provider_id = @ServiceProviderId
            """;

        var policyRows = await connection.QueryAsync<PolicyRowDto>(
            new CommandDefinition(policiesSql, parameters, cancellationToken: cancellationToken)
        );

        // Map policies with deserialized JSONB fields
        var policies = policyRows
            .Select(policy =>
            {
                var typeTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    policy.TypeTranslations ?? "{}"
                );
                var descriptionTranslations = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    policy.DescriptionTranslations ?? "{}"
                );
                return new GetServiceProviderPoliciesResponse(
                    policy.Id,
                    LocalizedContentResponseDto.FromTranslations(typeTranslations ?? new()),
                    LocalizedContentResponseDto.FromTranslations(descriptionTranslations ?? new()),
                    policy.CreateDate,
                    policy.LastModifiedDate
                );
            })
            .ToList();

        return policies;
    }
}

// Internal row DTO for Dapper mapping
internal sealed record PolicyRowDto(
    Guid Id,
    string TypeTranslations,
    string DescriptionTranslations,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
