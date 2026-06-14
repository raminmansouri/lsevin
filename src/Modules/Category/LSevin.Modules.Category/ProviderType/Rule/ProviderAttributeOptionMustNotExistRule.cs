using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Rule;

public sealed class ProviderAttributeOptionMustNotExistRule(
    IEnumerable<AttributeOption> existingOptions,
    string optionValue
) : IBusinessRule
{
    public bool IsBroken() => existingOptions.Any(o => string.Equals(o.Value, optionValue, StringComparison.Ordinal));

    public string Message => CategoryResource.Provider_Attribute_Option_Already_Exists_Error_Message;
}
