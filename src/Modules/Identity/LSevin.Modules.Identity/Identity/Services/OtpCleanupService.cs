using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using Dapper;

namespace LSevin.Modules.Identity.Identity.Services;

internal sealed class OtpCleanupService(IDbConnectionFactory dbConnectionFactory) : IOtpCleanupService
{
    public async Task<Result<int>> DeleteExpiredCodesAsync(
        DateTime expiredBefore,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

            const string sql = """
                DELETE FROM identity.phone_login_codes
                WHERE expires_at < @ExpiredBefore
                AND used_at IS NULL
                AND is_invalidated = false
                """;

            return await connection.ExecuteAsync(
                new CommandDefinition(sql, new { ExpiredBefore = expiredBefore }, cancellationToken: cancellationToken)
            );
        }
        catch (Exception ex)
        {
            return AppError.ApplicationErrorMessage("OTP Cleanup", $"Failed to delete expired OTP codes: {ex}");
        }
    }

    public async Task<Result<int>> DeleteOldUsedCodesAsync(
        int olderThanDays = 30,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            var cutoffDate = SystemClock.Now.AddDays(-olderThanDays);

            await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);

            const string sql = """
                DELETE FROM identity.phone_login_codes
                WHERE used_at IS NOT NULL
                AND used_at < @CutoffDate
                """;

            return await connection.ExecuteAsync(
                new CommandDefinition(sql, new { CutoffDate = cutoffDate }, cancellationToken: cancellationToken)
            );
        }
        catch (Exception ex)
        {
            return AppError.ApplicationErrorMessage("OTP Cleanup", $"Failed to delete old used OTP codes: {ex}");
        }
    }
}
