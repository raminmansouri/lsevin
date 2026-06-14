using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Exceptions;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Features.GetStaffAvailability;

internal sealed class GetStaffAvailabilityQueryHandler(IDbConnectionFactory dbConnectionFactory)
    : IQueryHandler<GetStaffAvailabilityQuery, IReadOnlyCollection<GetStaffAvailabilityResponse>>
{
    public async Task<Result<IReadOnlyCollection<GetStaffAvailabilityResponse>>> Handle(
        GetStaffAvailabilityQuery request,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

        // First check if staff exists
        const string checkStaffSql =
            @"
            SELECT EXISTS(SELECT 1 FROM staff WHERE id = @StaffId)";

        var staffExists = await connection.ExecuteScalarAsync<bool>(checkStaffSql, new { request.StaffId });
        if (!staffExists)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Staff);
        }

        // Get staff availability
        const string sql =
            @"
            SELECT
                sa.id AS Id,
                sa.day_of_week AS DayOfWeek,
                sa.start_time AS StartTime,
                sa.end_time AS EndTime,
                sa.is_recurring AS IsRecurring,
                sa.specific_date AS SpecificDate,
                sa.availability_status_id AS AvailabilityStatusId,
                sas.name AS AvailabilityStatusName,
                sa.create_date AS CreateDate,
                sa.last_modified_date AS LastModifiedDate
            FROM staff_availabilities sa
            JOIN staff_availability_statuses sas ON sa.availability_status_id = sas.id
            WHERE sa.staff_id = @StaffId
            ORDER BY sa.day_of_week, sa.start_time";

        var availabilities = await connection.QueryAsync<GetStaffAvailabilityResponse>(sql, new { request.StaffId });

        return availabilities.ToList().AsReadOnly();
    }
}
