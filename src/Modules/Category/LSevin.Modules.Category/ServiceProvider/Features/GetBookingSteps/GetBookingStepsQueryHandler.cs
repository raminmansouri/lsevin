using System.Text;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Currency.Services;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSteps;

internal sealed class GetBookingStepsQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetBookingStepsQuery, IPageList<GetBookingStepsResponse>>
{
    private static readonly List<string> _searchColumns = ["sp.name_translations", "sp.description_translations"];

    private static readonly List<string> _allowedSortColumns =
    [
        nameof(GetBookingStepsResponse.Name),
        nameof(GetBookingStepsResponse.IsActive),
        nameof(GetBookingStepsResponse.CreateDate),
    ];

    public async Task<Result<IPageList<GetBookingStepsResponse>>> Handle(
        GetBookingStepsQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();

        var baseFromBuilder = BuildBaseFromClause();
        ApplyFilters(baseFromBuilder, request, parameters);

        // Count Query
        var countParameters = new DynamicParameters(parameters);
        var countSql = $"SELECT COUNT(sp.id) {baseFromBuilder}";
        var totalCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, countParameters, cancellationToken: cancellationToken)
        );

        if (totalCount == 0)
        {
            return PageList<GetBookingStepsResponse>.Empty;
        }

        // Data Query
        var dataQueryBuilder = DapperExtensions.CreateSqlBuilder($"SELECT {GetSelectClause()} {baseFromBuilder}");

        dataQueryBuilder.AppendSorting(request, _allowedSortColumns, "sp.id", ensureDeterministicOrder: true);

        dataQueryBuilder.AppendPaging(request, parameters);

        var serviceProviders = await connection.QueryAsync<GetBookingStepsResponse>(
            new CommandDefinition(dataQueryBuilder.ToString(), parameters, cancellationToken: cancellationToken)
        );


   

        return PageList<GetBookingStepsResponse>.Create(
            serviceProviders.AsList(),
            request.PageNumber,
            request.PageSize,
            totalItems: totalCount
        );
    }

    private string GetSelectClause()
    {
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        return $"""
                sp.id AS {nameof(GetBookingStepsResponse.Id)},
                COALESCE(
                    sp.name_translations ->> '{currentLocale}',
                    sp.name_translations ->> '{defaultLocale}',
                    (sp.name_translations ->> (SELECT jsonb_object_keys(sp.name_translations) LIMIT 1))
                ) AS {nameof(GetBookingStepsResponse.Name)},
                COALESCE(
                    sp.description_translations ->> '{currentLocale}',
                    sp.description_translations ->> '{defaultLocale}',
                    (sp.description_translations ->> (SELECT jsonb_object_keys(sp.description_translations) LIMIT 1))
                ) AS {nameof(GetBookingStepsResponse.Description)},
                sp.email AS {nameof(GetBookingStepsResponse.ContactEmail)},
                sp.phone_number_country_code AS {nameof(GetBookingStepsResponse.PhoneNumberCountryCode)},
                sp.phone_number AS {nameof(GetBookingStepsResponse.PhoneNumber)},
                CONCAT(
                    COALESCE(
                        sp.street_translations ->> '{currentLocale}',
                        sp.street_translations ->> '{defaultLocale}',
                        (sp.street_translations ->> (SELECT jsonb_object_keys(sp.street_translations) LIMIT 1)),
                        ''
                    ),
                    ', ',
                    sp.city,
                    ', ',
                    sp.country,
                    ' ',
                    sp.zip_code,
                    ', ',
                    COALESCE(
                        sp.detail_translations ->> '{currentLocale}',
                        sp.detail_translations ->> '{defaultLocale}',
                        (sp.detail_translations ->> (SELECT jsonb_object_keys(sp.detail_translations) LIMIT 1)),
                        ''
                    )
                ) AS {nameof(GetBookingStepsResponse.Address)},
                sp.is_active AS {nameof(GetBookingStepsResponse.IsActive)},
                sp.provider_type_id AS {nameof(GetBookingStepsResponse.ProviderTypeId)},
                COALESCE(
                    pt.name_translations ->> '{currentLocale}',
                    pt.name_translations ->> '{defaultLocale}',
                    (pt.name_translations ->> (SELECT jsonb_object_keys(pt.name_translations) LIMIT 1))
                ) AS {nameof(GetBookingStepsResponse.ProviderTypeName)},
                (SELECT COUNT(*)::int FROM category.provider_services WHERE service_provider_id = sp.id) AS {nameof(
                GetBookingStepsResponse.ServiceCount
            )},
                (SELECT COUNT(*)::int FROM category.provider_gallery_items WHERE service_provider_id = sp.id) AS {nameof(
                GetBookingStepsResponse.GalleryItemCount
            )},
                (SELECT COUNT(*)::int FROM category.provider_policies WHERE service_provider_id = sp.id) AS {nameof(
                GetBookingStepsResponse.PolicyCount
            )},
                (SELECT COUNT(*)::int FROM category.provider_staffs WHERE service_provider_id = sp.id) AS {nameof(
                GetBookingStepsResponse.StaffCount
            )},
                sp.create_date AS {nameof(GetBookingStepsResponse.CreateDate)},
                sp.last_modified_date AS {nameof(GetBookingStepsResponse.LastModifiedDate)}
            """;
    }

    private static StringBuilder BuildBaseFromClause()
    {
        return DapperExtensions.CreateSqlBuilder(
            """
            FROM category.service_providers sp
            JOIN category.provider_types pt ON sp.provider_type_id = pt.id
            """
        );
    }

    private static void ApplyFilters(
        StringBuilder baseFromBuilder,
        GetBookingStepsQuery request,
        DynamicParameters parameters
    )
    {
        // Filter by active status if specified
        if (request.IsActive.HasValue)
        {
            baseFromBuilder.AppendWhereOrAnd("sp.is_active = @IsActive");
            parameters.Add("IsActive", request.IsActive.Value);
        }

        if (request.ProviderTypeIds?.Length > 0)
        {
            baseFromBuilder.AppendWhereOrAnd("sp.provider_type_id = ANY(@ProviderTypeIds)");
            parameters.Add("ProviderTypeIds", request.ProviderTypeIds.ToArray());
        }

        // Apply search filter if provided
        if (!string.IsNullOrWhiteSpace(request.Filters))
        {
            baseFromBuilder.AppendSearchFilter(request.Filters, _searchColumns, parameters, isJsonbColumn: true);
        }

        // Apply date range filters if provided
        if (request.StartDate.HasValue || request.EndDate.HasValue)
        {
            baseFromBuilder.AppendDateRange(request.StartDate, request.EndDate, "sp.create_date", parameters);
        }
    }
}
