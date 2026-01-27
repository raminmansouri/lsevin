using System.Text.Json;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Customer.Resources;

namespace LSevin.Modules.Customer.Customer.Features.GetCurrentCustomer;

internal sealed class GetCurrentCustomerQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    IUserAccessor userAccessor,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetCurrentCustomerQuery, GetCurrentCustomerResponse>
{
    public async Task<Result<GetCurrentCustomerResponse>> Handle(
        GetCurrentCustomerQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        var sql = """
            SELECT
                c.id AS CustomerId,
                c.first_name AS FirstName,
                c.last_name AS LastName,
                c.email AS Email,
                c.phone_number_country_code AS PhoneNumberCountryCode,
                c.phone_number AS PhoneNumber,
                c.birth_date AS BirthDate,
                c.gender AS Gender,
                c.country AS Country,
                c.city AS City,
                c.street_translations::text AS StreetTranslations,
                c.detail_translations::text AS DetailTranslations,
                c.zip_code AS ZipCode
            FROM
                customer.customers AS c
            WHERE
                c.id = @CustomerId
            """;
        var customerRow = await connection.QuerySingleOrDefaultAsync<CustomerRowDto>(
            new CommandDefinition(
                sql,
                new { CustomerId = userAccessor.GetUserIdentity },
                cancellationToken: cancellationToken
            )
        );

        if (customerRow is null)
        {
            return AppError.NotFoundErrorMessage(CustomerResource.Customer);
        }

        // Deserialize JSONB translations
        var streetTranslations = !string.IsNullOrEmpty(customerRow.StreetTranslations)
            ? JsonSerializer.Deserialize<Dictionary<string, string>>(customerRow.StreetTranslations)
            : null;
        var detailTranslations = !string.IsNullOrEmpty(customerRow.DetailTranslations)
            ? JsonSerializer.Deserialize<Dictionary<string, string>>(customerRow.DetailTranslations)
            : null;

        // Build address DTO
        AddressDto? address = null;
        if (!string.IsNullOrEmpty(customerRow.Country) || !string.IsNullOrEmpty(customerRow.City))
        {
            address = new AddressDto(
                customerRow.Country,
                customerRow.City,
                streetTranslations != null ? LocalizedContentDto.Create(streetTranslations) : null,
                detailTranslations != null ? LocalizedContentDto.Create(detailTranslations) : null,
                customerRow.ZipCode,
                Coordinates: null
            );
        }

        return new GetCurrentCustomerResponse(
            customerRow.CustomerId,
            customerRow.FirstName,
            customerRow.LastName,
            customerRow.Email,
            customerRow.PhoneNumberCountryCode,
            customerRow.PhoneNumber,
            customerRow.BirthDate,
            customerRow.Gender,
            address
        );
    }
}

// Internal row DTO for Dapper mapping
internal sealed record CustomerRowDto(
    Guid CustomerId,
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumberCountryCode,
    string PhoneNumber,
    DateTime? BirthDate,
    string? Gender,
    string Country,
    string City,
    string? StreetTranslations,
    string? DetailTranslations,
    string? ZipCode
);
