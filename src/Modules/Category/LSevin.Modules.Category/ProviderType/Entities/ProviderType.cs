using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ProviderType.Rule;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ProviderType.Entities;

public sealed class ProviderType : AggregateRoot<ProviderTypeId>
{
    #region Constructors

    private ProviderType()
    {
        Name = null!;
        Description = null!;
        IsActive = true;
        _attributeDefinitions = [];
    }

    private ProviderType(LocalizedString name, LocalizedString description, bool isActive, string? iconUrl)
        : this()
    {
        Id = ProviderTypeId.Create(IdGenerator.NewId());
        Name = name;
        Description = description;
        IsActive = isActive;
        IconUrl = iconUrl;
        _attributeDefinitions = [];
    }

    #endregion

    #region Properties

    public LocalizedString Name { get; private set; }
    public LocalizedString Description { get; private set; }
    public bool IsActive { get; private set; }
    public string? IconUrl { get; private set; }

    public IReadOnlyCollection<ProviderAttributeDefinition> AttributeDefinitions => _attributeDefinitions.AsReadOnly();
    private readonly List<ProviderAttributeDefinition> _attributeDefinitions;

    #endregion

    #region Methods

    public static ProviderType Create(
        LocalizedString name,
        LocalizedString description,
        bool isActive = true,
        string? iconUrl = null
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));

        var providerType = new ProviderType(name, description, isActive, iconUrl);

        return providerType;
    }

    public void Update(LocalizedString name, LocalizedString description, bool isActive, string? iconUrl = null)
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));

        Name = name;
        Description = description;
        IsActive = isActive;
        IconUrl = iconUrl;
    }

    public void AddAttributeDefinition(ProviderAttributeDefinition attributeDefinition)
    {
        Guard.Against.Null(attributeDefinition, nameof(attributeDefinition));

        CheckRule(
            new ProviderAttributeDefinitionMustNotExistRule(
                _attributeDefinitions,
                attributeDefinition.Name.DefaultValue
            )
        );

        _attributeDefinitions.Add(attributeDefinition);
    }

    public void RemoveAttributeDefinition(ProviderAttributeDefinitionId attributeDefinitionId)
    {
        var attributeDefinition = _attributeDefinitions.FirstOrDefault(a => a.Id == attributeDefinitionId);

        if (attributeDefinition is null)
        {
            return;
        }

        _attributeDefinitions.Remove(attributeDefinition);
    }

    public void UpdateAttributeDefinition(
        ProviderAttributeDefinitionId attributeDefinitionId,
        LocalizedString name,
        LocalizedString description,
        AttributeType attributeType,
        bool isRequired,
        string validationRules
    )
    {
        Guard.Against.Null(attributeDefinitionId, nameof(attributeDefinitionId));
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));

        var attributeDefinition = _attributeDefinitions.FirstOrDefault(a => a.Id == attributeDefinitionId);

        if (attributeDefinition is null)
        {
            return;
        }

        attributeDefinition.Update(name, description, attributeType, isRequired, validationRules);
    }

    public void ChangeActivation(bool isActive)
    {
        if (IsActive == isActive)
        {
            return;
        }

        IsActive = isActive;
    }

    #endregion
}
