using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Exceptions;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.GetStaffServices;

internal sealed class GetStaffServicesQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetStaffServicesQuery, IReadOnlyCollection<GetStaffServicesResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetStaffServicesResponse>>> Handle(
        GetStaffServicesQuery request,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        // First check if staff exists
        const string checkStaffSql =
            @"
            SELECT EXISTS(SELECT 1 FROM category.staff WHERE id = @StaffId)";

        var staffExists = await connection.ExecuteScalarAsync<bool>(checkStaffSql, new { request.StaffId });
        if (!staffExists)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Staff);
        }

        // Get staff services with localized fields
        var sql = GetSelectQuery();

        var services = await connection.QueryAsync<GetStaffServicesResponse>(sql, new { request.StaffId });

        return services.AsList();
    }

    private string GetSelectQuery()
    {
        var currentLocale = localeAccessor.CurrentLocale; // e.g., "en-US"
        var defaultLocale = localeAccessor.DefaultLocale; // e.g., "en-US"

        return $@"
            SELECT
                ss.id AS {nameof(GetStaffServicesResponse.Id)},
                ss.service_definition_id AS {nameof(GetStaffServicesResponse.ServiceId)},
                COALESCE(
                    sd.name_translations ->> '{currentLocale}',
                    sd.name_translations ->> '{defaultLocale}',
                    (sd.name_translations ->> (SELECT jsonb_object_keys(sd.name_translations) LIMIT 1))
                ) AS {nameof(GetStaffServicesResponse.ServiceName)},
                COALESCE(
                    sd.description_translations ->> '{currentLocale}',
                    sd.description_translations ->> '{defaultLocale}',
                    (sd.description_translations ->> (SELECT jsonb_object_keys(sd.description_translations) LIMIT 1))
                ) AS {nameof(GetStaffServicesResponse.ServiceDescription)},
                sd.value AS {nameof(GetStaffServicesResponse.Price)},
                sd.duration_minutes AS {nameof(GetStaffServicesResponse.DurationInMinutes)},
                ss.is_active AS {nameof(GetStaffServicesResponse.IsActive)},
                COALESCE(
                    ss.notes_translations ->> '{currentLocale}',
                    ss.notes_translations ->> '{defaultLocale}',
                    (ss.notes_translations ->> (SELECT jsonb_object_keys(ss.notes_translations) LIMIT 1))
                ) AS {nameof(GetStaffServicesResponse.Notes)},
                ss.create_date AS {nameof(GetStaffServicesResponse.CreateDate)},
                ss.last_modified_date AS {nameof(GetStaffServicesResponse.LastModifiedDate)}
            FROM category.staff_services ss
            JOIN category.service_definitions sd ON ss.service_definition_id = sd.id
            WHERE ss.staff_id = @StaffId
            ORDER BY COALESCE(
                sd.name_translations ->> '{currentLocale}',
                sd.name_translations ->> '{defaultLocale}',
                (sd.name_translations ->> (SELECT jsonb_object_keys(sd.name_translations) LIMIT 1))
            )";
    }
}
