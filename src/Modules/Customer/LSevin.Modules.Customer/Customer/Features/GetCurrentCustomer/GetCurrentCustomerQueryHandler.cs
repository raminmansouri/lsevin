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
        var streetTranslations = ParseTranslations(customerRow.StreetTranslations);
        var detailTranslations = ParseTranslations(customerRow.DetailTranslations);

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

    // Translations are stored as a JSONB object ({"en":"..."}), but some legacy
    // rows are double-encoded — the column holds a JSON *string* that contains the
    // object ("{\"en\":\"...\"}"). Deserializing those directly to a Dictionary
    // throws and 500s the endpoint, so unwrap the string form first.
    private static Dictionary<string, string>? ParseTranslations(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return null;
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(value);
        }
        catch (JsonException)
        {
            var inner = JsonSerializer.Deserialize<string>(value);
            return string.IsNullOrEmpty(inner)
                ? null
                : JsonSerializer.Deserialize<Dictionary<string, string>>(inner);
        }
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
