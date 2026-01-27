using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Entities;

public sealed class ProviderAttribute : Entity<ProviderAttributeId>
{
    #region Constructors

    private ProviderAttribute()
    {
        Value = null!;
        AttributeDefinitionId = null!;
    }

    private ProviderAttribute(ProviderAttributeDefinitionId attributeDefinitionId, LocalizedString value)
        : this()
    {
        Id = ProviderAttributeId.Create(IdGenerator.NewId());
        AttributeDefinitionId = attributeDefinitionId;
        Value = value;
    }

    #endregion

    #region Properties

    public ProviderAttributeDefinitionId AttributeDefinitionId { get; private set; }
    public LocalizedString Value { get; private set; }

    #endregion

    #region Methods

    public static ProviderAttribute Create(ProviderAttributeDefinitionId attributeDefinitionId, LocalizedString value)
    {
        Guard.Against.Null(attributeDefinitionId, nameof(attributeDefinitionId));
        Guard.Against.Null(value, nameof(value));

        return new ProviderAttribute(attributeDefinitionId, value);
    }

    public void UpdateValue(LocalizedString value)
    {
        Guard.Against.Null(value, nameof(value));
        Value = value;
    }

    #endregion
}
