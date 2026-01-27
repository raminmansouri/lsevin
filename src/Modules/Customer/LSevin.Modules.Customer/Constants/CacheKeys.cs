using LSevin.Modules.Common.Constants;
using LSevin.Modules.Customer.Customer.ValueObjects;

namespace LSevin.Modules.Customer.Constants;

public static class CacheKeys
{
    public static class Customer
    {
        private const string Prefix = "users";

        public static string[] GetInvalidationTags(CustomerId customerId)
        {
            return
            [
                CommonCacheKeys.GetGlobalTag(Prefix),
                CommonCacheKeys.GetUserTag(Prefix, userId: customerId.Value.ToString()),
            ];
        }
    }
}
