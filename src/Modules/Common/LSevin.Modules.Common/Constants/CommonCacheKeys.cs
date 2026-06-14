using BuildingBlocks.Caching.Utilities;

namespace LSevin.Modules.Common.Constants;

public static class CommonCacheKeys
{
    public static string GetGlobalTag(string tag)
    {
        return CacheKey.With("global", [tag]);
    }

    public static string GetIdTag(string tag, string id)
    {
        return CacheKey.With("id", [tag, id]);
    }

    public static string GetUserTag(string tag, string userId)
    {
        return CacheKey.With("user", [tag, userId]);
    }
}
