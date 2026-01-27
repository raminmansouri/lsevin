using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.ProviderType.Entities;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Rule;

public sealed class ProviderAttributeDefinitionMustNotExistRule(
    IEnumerable<ProviderAttributeDefinition> existingDefinitions,
    string attributeName
) : IBusinessRule
{
    public bool IsBroken() =>
        existingDefinitions.Any(a => string.Equals(a.Name, attributeName, StringComparison.OrdinalIgnoreCase));

    public string Message => CategoryResource.Provider_Attribute_Definition_Already_Exists_Error_Message;
}
