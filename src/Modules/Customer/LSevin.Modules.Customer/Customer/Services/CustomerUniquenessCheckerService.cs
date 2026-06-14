using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;
using LSevin.Modules.Customer.Customer.ValueObjects;

namespace LSevin.Modules.Customer.Customer.Services;

internal sealed class CustomerUniquenessCheckerService(IDbConnectionFactory dbConnectionFactory)
    : ICustomerUniquenessCheckerService
{
    /// <inheritdoc />
    public Result<bool> IsUnique(Email email, CustomerId? customerId = null)
    {
        using var connection = dbConnectionFactory.GetOrCreateConnection();

        const string sql = $"""
            SELECT
                id
            FROM
                customer.customers
            WHERE
                email = @Email
            LIMIT 1
            """;

        var existingCustomerId = connection.QuerySingleOrDefault<Guid?>(sql, new { Email = email.Value });

        var existInDb = existingCustomerId.HasValue;
        var sameCustomer = existInDb && existingCustomerId == customerId?.Value;
        return !existInDb || sameCustomer;
    }

    /// <inheritdoc />
    public Result<bool> IsUnique(PhoneNumber phoneNumber, CustomerId? customerId = null)
    {
        using var connection = dbConnectionFactory.GetOrCreateConnection();

        const string sql = $"""
            SELECT
                c.id
            FROM
                customer.customers c
            WHERE
                c.phone_number = @PhoneNumber AND
                c.phone_number_country_code = @PhoneNumberCountryCode
            LIMIT 1
            """;

        var existingCustomerId = connection.QuerySingleOrDefault<Guid?>(
            sql,
            new { PhoneNumber = phoneNumber.Value, PhoneNumberCountryCode = phoneNumber.CountryCode }
        );

        var existInDb = existingCustomerId.HasValue;
        var sameCustomer = existInDb && existingCustomerId == customerId?.Value;
        return !existInDb || sameCustomer;
    }
}
