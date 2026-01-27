using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Entities;

public sealed class ProviderService : Entity<ProviderServiceId>
{
    #region Constructors

    private ProviderService()
    {
        DisplayName = null!;
        Description = null!;
        ServiceDefinitionId = null!;
        Price = null!;
        DurationMinutes = 0;
        IsActive = true;
        _attributeValues = [];
    }

    private ProviderService(
        ServiceDefinitionId serviceDefinitionId,
        LocalizedString displayName,
        LocalizedString description,
        MoneyValue price,
        int durationMinutes,
        bool isActive = true
    )
        : this()
    {
        Id = ProviderServiceId.Create(IdGenerator.NewId());
        ServiceDefinitionId = serviceDefinitionId;
        DisplayName = displayName;
        Description = description;
        Price = price;
        DurationMinutes = durationMinutes;
        IsActive = isActive;
    }

    #endregion

    #region Properties

    public ServiceDefinitionId ServiceDefinitionId { get; private set; }
    public LocalizedString DisplayName { get; private set; }
    public LocalizedString Description { get; private set; }
    public MoneyValue Price { get; private set; }
    public int DurationMinutes { get; private set; }
    public bool IsActive { get; private set; }

    public IReadOnlyCollection<ServiceAttributeValue> AttributeValues => _attributeValues.AsReadOnly();
    private readonly List<ServiceAttributeValue> _attributeValues;

    #endregion

    #region Methods

    public static ProviderService Create(
        ServiceDefinitionId serviceDefinitionId,
        LocalizedString displayName,
        LocalizedString description,
        MoneyValue price,
        int durationMinutes,
        bool isActive = true
    )
    {
        Guard.Against.Null(serviceDefinitionId, nameof(serviceDefinitionId));
        Guard.Against.Null(displayName, nameof(displayName));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.Null(price, nameof(price));
        Guard.Against.Negative(durationMinutes, nameof(durationMinutes));

        return new ProviderService(serviceDefinitionId, displayName, description, price, durationMinutes, isActive);
    }

    public void Update(
        LocalizedString displayName,
        LocalizedString description,
        MoneyValue price,
        int durationMinutes,
        bool isActive
    )
    {
        Guard.Against.Null(displayName, nameof(displayName));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.Null(price, nameof(price));
        Guard.Against.Negative(durationMinutes, nameof(durationMinutes));

        DisplayName = displayName;
        Description = description;
        Price = price;
        DurationMinutes = durationMinutes;
        IsActive = isActive;
    }

    public void AddAttributeValue(ServiceAttributeValue attributeValue)
    {
        Guard.Against.Null(attributeValue, nameof(attributeValue));

        var existingAttributeValue = _attributeValues.FirstOrDefault(av =>
            av.AttributeDefinitionId == attributeValue.AttributeDefinitionId
        );

        if (existingAttributeValue is not null)
        {
            _attributeValues.Remove(existingAttributeValue);
        }

        _attributeValues.Add(attributeValue);
    }

    public void RemoveAttributeValue(ServiceAttributeValueId attributeValueId)
    {
        Guard.Against.Null(attributeValueId, nameof(attributeValueId));

        var attributeValue = _attributeValues.FirstOrDefault(av => av.Id == attributeValueId);
        if (attributeValue is not null)
        {
            _attributeValues.Remove(attributeValue);
        }
    }

    #endregion
}
