using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ProviderType.Rule;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ProviderType.Entities;

public sealed class ProviderAttributeDefinition : Entity<ProviderAttributeDefinitionId>
{
    #region Constructors

    private ProviderAttributeDefinition()
    {
        Name = null!;
        Description = null!;
        _attributeTypeId = 0;
        IsRequired = false;
        ValidationRules = string.Empty;
        _options = [];
    }

    private ProviderAttributeDefinition(
        LocalizedString name,
        LocalizedString description,
        AttributeType attributeType,
        bool isRequired,
        string validationRules
    )
        : this()
    {
        Id = ProviderAttributeDefinitionId.Create(IdGenerator.NewId());
        Name = name;
        Description = description;
        _attributeTypeId = attributeType.Id;
        IsRequired = isRequired;
        ValidationRules = validationRules;
        _options = [];
    }

    #endregion

    #region Properties

    public LocalizedString Name { get; private set; }
    public LocalizedString Description { get; private set; }

    public AttributeType? AttributeType { get; private set; }
    private int _attributeTypeId;

    public bool IsRequired { get; private set; }
    public string ValidationRules { get; private set; }

    public IReadOnlyCollection<AttributeOption> Options => _options.AsReadOnly();
    private readonly List<AttributeOption> _options;

    #endregion

    public static ProviderAttributeDefinition Create(
        LocalizedString name,
        LocalizedString description,
        AttributeType attributeType,
        bool isRequired,
        string validationRules
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.Null(attributeType, nameof(attributeType));

        return new ProviderAttributeDefinition(name, description, attributeType, isRequired, validationRules);
    }

    public void Update(
        LocalizedString name,
        LocalizedString description,
        AttributeType attributeType,
        bool isRequired,
        string validationRules
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.Null(attributeType, nameof(attributeType));

        Name = name;
        Description = description;
        _attributeTypeId = attributeType.Id;
        IsRequired = isRequired;
        ValidationRules = validationRules;
    }

    public void AddOption(AttributeOption option)
    {
        Guard.Against.Null(option, nameof(option));

        CheckRule(new ProviderAttributeOptionMustNotExistRule(_options, option.Value.DefaultValue));

        _options.Add(option);
    }

    public void RemoveOption(string optionValue)
    {
        Guard.Against.NullOrEmpty(optionValue, nameof(optionValue));

        var optionToRemove = _options.FirstOrDefault(o =>
            string.Equals(o.Value.DefaultValue, optionValue, StringComparison.Ordinal)
        );

        if (optionToRemove is null)
        {
            return;
        }

        _options.Remove(optionToRemove);
    }

    public void ClearOptions()
    {
        _options.Clear();
    }

    public int GetAttributeTypeId() => _attributeTypeId;
}
