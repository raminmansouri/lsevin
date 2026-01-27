using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Services;

internal sealed class ServiceProviderUniquenessCheckerService(IDbConnectionFactory dbConnectionFactory)
    : IServiceProviderUniquenessCheckerService
{
    /// <inheritdoc />
    public Result<bool> IsGradeUnique(
        ServiceProviderGrade grade,
        ProviderTypeId providerTypeId,
        string countryCode,
        string cityCode,
        ServiceProviderId? serviceProviderId = null
    )
    {
        using var connection = dbConnectionFactory.GetOrCreateConnection();

        const string sql = """
            SELECT
                id
            FROM
                category.service_providers
            WHERE
                grade_id = @GradeId
                AND provider_type_id = @ProviderTypeId
                AND country = @CountryCode
                AND city = @CityCode
            LIMIT 1
            """;

        var existingProviderId = connection.QuerySingleOrDefault<Guid?>(
            sql,
            new
            {
                GradeId = grade.Id,
                ProviderTypeId = providerTypeId.Value,
                CountryCode = countryCode,
                CityCode = cityCode,
            }
        );

        var existInDb = existingProviderId.HasValue;
        var sameProvider = existInDb && existingProviderId == serviceProviderId?.Value;
        return !existInDb || sameProvider;
    }
}
