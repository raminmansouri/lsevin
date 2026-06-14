using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceDefinition.Rule;

public sealed class ServiceRequirementDescriptionMustNotBeEmptyRule(string description) : IBusinessRule
{
    public bool IsBroken() => string.IsNullOrWhiteSpace(description);

    public string Message => CategoryResource.Service_Requirement_Description_Cannot_Be_Empty_Error_Message;
}
