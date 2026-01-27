using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;

namespace LSevin.Modules.Category.ServiceDefinition.Rule;

public sealed class ServiceRequirementMustBeUniqueRule(
    IEnumerable<ServiceRequirement> existingRequirements,
    string description
) : IBusinessRule
{
    public bool IsBroken() =>
        existingRequirements.Any(r =>
            string.Equals(r.Description.DefaultValue, description, StringComparison.OrdinalIgnoreCase)
        );

    public string Message => CategoryResource.Service_Requirement_Must_Be_Unique_Error_Message;
}
