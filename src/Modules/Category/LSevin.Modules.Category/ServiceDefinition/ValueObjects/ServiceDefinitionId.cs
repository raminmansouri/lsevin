using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceDefinition.ValueObjects;

public sealed record ServiceDefinitionId(Guid Value) : TypedIdValueBase(Value)
{
    public static ServiceDefinitionId Create(Guid value) => new(value);

    public static implicit operator Guid(ServiceDefinitionId serviceDefinitionId) => serviceDefinitionId.Value;

    public static implicit operator ServiceDefinitionId(Guid serviceDefinitionId) => Create(serviceDefinitionId);
}
