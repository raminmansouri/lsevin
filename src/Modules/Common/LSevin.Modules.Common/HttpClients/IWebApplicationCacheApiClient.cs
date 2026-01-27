using BuildingBlocks.Core.ResultPattern;

namespace LSevin.Modules.Common.HttpClients;

public interface IWebApplicationCacheApiClient
{
    Task<Result<bool>> InvalidateCacheAsync(IEnumerable<string> tags, CancellationToken cancellationToken = default);
}
