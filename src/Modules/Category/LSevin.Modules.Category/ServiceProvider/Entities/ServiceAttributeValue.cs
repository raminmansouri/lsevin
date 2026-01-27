using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Entities;

public sealed class ServiceAttributeValue : Entity<ServiceAttributeValueId>
{
    #region Constructors

    private ServiceAttributeValue()
    {
        Value = null!;
        AttributeDefinitionId = null!;
    }

    private ServiceAttributeValue(ServiceAttributeDefinitionId attributeDefinitionId, LocalizedString value)
        : this()
    {
        Id = ServiceAttributeValueId.Create(IdGenerator.NewId());
        AttributeDefinitionId = attributeDefinitionId;
        Value = value;
    }

    #endregion

    #region Properties

    public ServiceAttributeDefinitionId AttributeDefinitionId { get; private set; }
    public LocalizedString Value { get; private set; }

    #endregion

    #region Methods

    public static ServiceAttributeValue Create(
        ServiceAttributeDefinitionId attributeDefinitionId,
        LocalizedString value
    )
    {
        Guard.Against.Null(attributeDefinitionId, nameof(attributeDefinitionId));
        Guard.Against.Null(value, nameof(value));

        return new ServiceAttributeValue(attributeDefinitionId, value);
    }

    public void UpdateValue(LocalizedString value)
    {
        Guard.Against.Null(value, nameof(value));
        Value = value;
    }

    #endregion
}
