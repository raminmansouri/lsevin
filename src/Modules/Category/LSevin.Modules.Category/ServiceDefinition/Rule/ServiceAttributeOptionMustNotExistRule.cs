using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;

namespace LSevin.Modules.Category.ServiceDefinition.Rule;

public sealed class ServiceAttributeOptionMustNotExistRule(
    IEnumerable<AttributeOption> existingOptions,
    string optionValue
) : IBusinessRule
{
    public bool IsBroken() => existingOptions.Any(o => string.Equals(o.Value, optionValue, StringComparison.Ordinal));

    public string Message => CategoryResource.Service_Attribute_Option_Already_Exists_Error_Message;
}
