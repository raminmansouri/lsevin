using BuildingBlocks.Core.Domain.Services;
using BuildingBlocks.Core.ResultPattern;

namespace LSevin.Modules.Identity.Identity.Services;

public interface IOtpCleanupService : IDomainService
{
    Task<Result<int>> DeleteExpiredCodesAsync(DateTime expiredBefore, CancellationToken cancellationToken = default);

    Task<Result<int>> DeleteOldUsedCodesAsync(int olderThanDays = 30, CancellationToken cancellationToken = default);
}
