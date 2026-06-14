using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.Category.ValueObjects;
using LSevin.Modules.Category.ServiceDefinition.Rule;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ServiceDefinition.Entities;

public sealed class ServiceDefinition : AggregateRoot<ServiceDefinitionId>
{
    #region Constructors

    private ServiceDefinition()
    {
        Name = null!;
        Description = null!;
        CategoryId = null!;
        DurationMinutes = 0;
        BasePrice = null!;
        PricingModel = null!;
        IsActive = true;
        _attributeDefinitions = [];
        _requirements = [];
    }

    private ServiceDefinition(
        LocalizedString name,
        LocalizedString description,
        CategoryId categoryId,
        int durationMinutes,
        MoneyValue basePrice,
        string pricingModel,
        bool isActive
    )
        : this()
    {
        Id = ServiceDefinitionId.Create(IdGenerator.NewId());
        Name = name;
        Description = description;
        CategoryId = categoryId;
        DurationMinutes = durationMinutes;
        BasePrice = basePrice;
        PricingModel = pricingModel;
        IsActive = isActive;
        _attributeDefinitions = [];
        _requirements = [];
    }

    #endregion

    #region Properties

    public LocalizedString Name { get; private set; }
    public LocalizedString Description { get; private set; }
    public CategoryId CategoryId { get; private set; }
    public int DurationMinutes { get; private set; }
    public MoneyValue BasePrice { get; private set; }
    public string PricingModel { get; private set; }
    public bool IsActive { get; private set; }

    public IReadOnlyCollection<ServiceAttributeDefinition> AttributeDefinitions => _attributeDefinitions.AsReadOnly();

    private readonly List<ServiceAttributeDefinition> _attributeDefinitions;

    public IReadOnlyCollection<ServiceRequirement> Requirements => _requirements.AsReadOnly();
    private readonly List<ServiceRequirement> _requirements;

    #endregion

    #region Methods

    public static ServiceDefinition Create(
        LocalizedString name,
        LocalizedString description,
        CategoryId categoryId,
        int durationMinutes,
        MoneyValue basePrice,
        string pricingModel,
        bool isActive = true
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.Null(categoryId, nameof(categoryId));
        Guard.Against.Negative(durationMinutes, nameof(durationMinutes));
        Guard.Against.Null(basePrice, nameof(basePrice));
        Guard.Against.NullOrEmpty(pricingModel, nameof(pricingModel));

        var serviceDefinition = new ServiceDefinition(
            name,
            description,
            categoryId,
            durationMinutes,
            basePrice,
            pricingModel,
            isActive
        );

        return serviceDefinition;
    }

    public void Update(
        LocalizedString name,
        LocalizedString description,
        CategoryId categoryId,
        int durationMinutes,
        MoneyValue basePrice,
        string pricingModel,
        bool isActive
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(categoryId, nameof(categoryId));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.Negative(durationMinutes, nameof(durationMinutes));
        Guard.Against.Null(basePrice, nameof(basePrice));
        Guard.Against.NullOrEmpty(pricingModel, nameof(pricingModel));

        Name = name;
        Description = description;
        CategoryId = categoryId;
        DurationMinutes = durationMinutes;
        BasePrice = basePrice;
        PricingModel = pricingModel;
        IsActive = isActive;
    }

    public void AddAttributeDefinition(ServiceAttributeDefinition attributeDefinition)
    {
        Guard.Against.Null(attributeDefinition, nameof(attributeDefinition));

        _attributeDefinitions.Add(attributeDefinition);
    }

    public void RemoveAttributeDefinition(ServiceAttributeDefinitionId attributeDefinitionId)
    {
        var attributeDefinition = _attributeDefinitions.FirstOrDefault(a => a.Id == attributeDefinitionId);

        if (attributeDefinition is null)
        {
            return;
        }

        _attributeDefinitions.Remove(attributeDefinition);
    }

    public void UpdateAttributeDefinition(
        ServiceAttributeDefinitionId attributeDefinitionId,
        LocalizedString name,
        LocalizedString description,
        AttributeType attributeType,
        bool isRequired,
        bool affectsPricing,
        int displayOrder
    )
    {
        Guard.Against.Null(attributeDefinitionId, nameof(attributeDefinitionId));
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.Null(attributeType, nameof(attributeType));
        Guard.Against.OutOfRange(displayOrder, nameof(displayOrder), 0, int.MaxValue);

        var attributeDefinition = _attributeDefinitions.FirstOrDefault(a => a.Id == attributeDefinitionId);

        if (attributeDefinition is null)
        {
            return;
        }

        attributeDefinition.Update(name, description, attributeType, isRequired, affectsPricing, displayOrder);
    }

    public void AddRequirement(ServiceRequirement requirement)
    {
        Guard.Against.Null(requirement, nameof(requirement));

        CheckRule(new ServiceRequirementMustBeUniqueRule(_requirements, requirement.Description));

        _requirements.Add(requirement);
    }

    public void RemoveRequirement(int requirementIndex)
    {
        Guard.Against.Negative(requirementIndex, nameof(requirementIndex));

        if (requirementIndex >= _requirements.Count)
        {
            return;
        }

        _requirements.RemoveAt(requirementIndex);
    }

    public void UpdateRequirement(int requirementIndex, LocalizedString description, bool isMandatory)
    {
        Guard.Against.Negative(requirementIndex, nameof(requirementIndex));
        Guard.Against.Null(description, nameof(description));

        if (requirementIndex >= _requirements.Count)
        {
            return;
        }

        CheckRule(new ServiceRequirementDescriptionMustNotBeEmptyRule(description.DefaultValue));

        // For ValueObjects, we replace the entire object
        var updatedRequirement = ServiceRequirement.Create(description, isMandatory);
        _requirements[requirementIndex] = updatedRequirement;
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
