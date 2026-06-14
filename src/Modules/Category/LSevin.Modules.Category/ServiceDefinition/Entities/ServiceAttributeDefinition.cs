using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ServiceDefinition.Rule;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ServiceDefinition.Entities;

public sealed class ServiceAttributeDefinition : Entity<ServiceAttributeDefinitionId>
{
    #region Constructors

    private ServiceAttributeDefinition()
    {
        Name = null!;
        Description = null!;
        _attributeTypeId = 0;
        IsRequired = false;
        AffectsPricing = false;
        DisplayOrder = 0;
        _options = [];
    }

    private ServiceAttributeDefinition(
        LocalizedString name,
        LocalizedString description,
        AttributeType attributeType,
        bool isRequired,
        bool affectsPricing,
        int displayOrder
    )
        : this()
    {
        Id = ServiceAttributeDefinitionId.Create(IdGenerator.NewId());
        Name = name;
        Description = description;
        _attributeTypeId = attributeType.Id;
        IsRequired = isRequired;
        AffectsPricing = affectsPricing;
        DisplayOrder = displayOrder;
        _options = [];
    }

    #endregion

    #region Properties

    public LocalizedString Name { get; private set; }
    public LocalizedString Description { get; private set; }

    public AttributeType? AttributeType { get; private set; }
    private int _attributeTypeId;

    public bool IsRequired { get; private set; }

    public IReadOnlyCollection<AttributeOption> Options => _options.AsReadOnly();
    private readonly List<AttributeOption> _options;

    public bool AffectsPricing { get; private set; }
    public int DisplayOrder { get; private set; }

    #endregion

    public static ServiceAttributeDefinition Create(
        LocalizedString name,
        LocalizedString description,
        AttributeType attributeType,
        bool isRequired,
        bool affectsPricing,
        int displayOrder
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.Null(attributeType, nameof(attributeType));
        Guard.Against.OutOfRange(displayOrder, nameof(displayOrder), 0, int.MaxValue);

        return new ServiceAttributeDefinition(
            name,
            description,
            attributeType,
            isRequired,
            affectsPricing,
            displayOrder
        );
    }

    public void Update(
        LocalizedString name,
        LocalizedString description,
        AttributeType attributeType,
        bool isRequired,
        bool affectsPricing,
        int displayOrder
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.Null(attributeType, nameof(attributeType));
        Guard.Against.OutOfRange(displayOrder, nameof(displayOrder), 0, int.MaxValue);

        Name = name;
        Description = description;
        _attributeTypeId = attributeType.Id;
        IsRequired = isRequired;
        AffectsPricing = affectsPricing;
        DisplayOrder = displayOrder;
    }

    public void AddOption(AttributeOption option)
    {
        Guard.Against.Null(option, nameof(option));

        CheckRule(new ServiceAttributeOptionMustNotExistRule(_options, option.Value));

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
