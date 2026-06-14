using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Rule;

public sealed class ProviderServicePriceMustBePositiveRule(decimal price) : IBusinessRule
{
    public bool IsBroken() => price <= 0;

    public string Message => SharedResource.Greater_Than_Zero_Error_Message;
}
