using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceDefinition.ValueObjects;

public sealed record ServiceAttributeDefinitionId(Guid Value) : TypedIdValueBase(Value)
{
    public static ServiceAttributeDefinitionId Create(Guid value) => new(value);

    public static implicit operator Guid(ServiceAttributeDefinitionId id) => id.Value;

    public static implicit operator ServiceAttributeDefinitionId(Guid id) => Create(id);
}
