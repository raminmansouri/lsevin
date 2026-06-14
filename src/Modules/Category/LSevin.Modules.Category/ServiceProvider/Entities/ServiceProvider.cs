using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ProviderType.ValueObjects;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using LSevin.Modules.Category.ServiceProvider.Rules;
using LSevin.Modules.Category.ServiceProvider.Services;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Entities;

public sealed class ServiceProvider : AggregateRoot<ServiceProviderId>
{
    #region Constructors

    private ServiceProvider()
    {
        Name = null!;
        Description = null!;
        ContactEmail = null!;
        ContactPhone = null!;
        Address = null!;
        ProviderTypeId = null!;
        _gradeId = null;
        IsActive = true;
        _attributes = [];
        _services = [];
        _galleryItems = [];
        _policies = [];
        _staffMembers = [];
    }

    private ServiceProvider(
        LocalizedString name,
        LocalizedString description,
        Email contactEmail,
        PhoneNumber contactPhone,
        Address address,
        ProviderTypeId providerTypeId,
        ServiceProviderGrade? grade,
        bool isActive = true
    )
        : this()
    {
        Id = ServiceProviderId.Create(IdGenerator.NewId());
        Name = name;
        Description = description;
        ContactEmail = contactEmail;
        ContactPhone = contactPhone;
        Address = address;
        ProviderTypeId = providerTypeId;
        _gradeId = grade?.Id;
        IsActive = isActive;
    }

    #endregion

    #region Properties

    public LocalizedString Name { get; private set; }
    public LocalizedString Description { get; private set; }
    public Email ContactEmail { get; private set; }
    public PhoneNumber ContactPhone { get; private set; }
    public Address Address { get; private set; }
    public bool IsActive { get; private set; }
    public ProviderTypeId ProviderTypeId { get; private set; }
    public ServiceProviderGrade? Grade { get; private set; }
    private int? _gradeId;

    public IReadOnlyCollection<ProviderAttribute> Attributes => _attributes.AsReadOnly();
    private readonly List<ProviderAttribute> _attributes;

    public IReadOnlyCollection<ProviderService> Services => _services.AsReadOnly();
    private readonly List<ProviderService> _services;

    public IReadOnlyCollection<ProviderGalleryItem> GalleryItems => _galleryItems.AsReadOnly();
    private readonly List<ProviderGalleryItem> _galleryItems;

    public IReadOnlyCollection<ProviderPolicy> Policies => _policies.AsReadOnly();
    private readonly List<ProviderPolicy> _policies;

    public IReadOnlyCollection<ProviderStaff> StaffMembers => _staffMembers.AsReadOnly();
    private readonly List<ProviderStaff> _staffMembers;

    #endregion

    #region Methods

    public static ServiceProvider Create(
        IServiceProviderUniquenessCheckerService uniquenessChecker,
        LocalizedString name,
        LocalizedString description,
        Email contactEmail,
        PhoneNumber contactPhone,
        Address address,
        ProviderTypeId providerTypeId,
        bool isActive = true,
        ServiceProviderGrade? grade = null
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.Null(contactEmail, nameof(contactEmail));
        Guard.Against.Null(contactPhone, nameof(contactPhone));
        Guard.Against.Null(address, nameof(address));
        Guard.Against.Null(providerTypeId, nameof(providerTypeId));

        CheckRule(
            new ServiceProviderGradeMustBeUniqueRule(
                uniquenessChecker,
                providerTypeId,
                address.Country,
                address.City,
                grade
            )
        );

        return new ServiceProvider(
            name,
            description,
            contactEmail,
            contactPhone,
            address,
            providerTypeId,
            grade,
            isActive
        );
    }

    public void Update(
        IServiceProviderUniquenessCheckerService uniquenessChecker,
        LocalizedString name,
        LocalizedString description,
        Email contactEmail,
        PhoneNumber contactPhone,
        Address address,
        ProviderTypeId providerTypeId,
        bool isActive = true,
        ServiceProviderGrade? grade = null
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.Null(contactEmail, nameof(contactEmail));
        Guard.Against.Null(contactPhone, nameof(contactPhone));
        Guard.Against.Null(address, nameof(address));
        Guard.Against.Null(providerTypeId, nameof(providerTypeId));

        CheckRule(
            new ServiceProviderGradeMustBeUniqueRule(
                uniquenessChecker,
                providerTypeId,
                address.Country,
                address.City,
                grade,
                Id
            )
        );

        Name = name;
        Description = description;
        ContactEmail = contactEmail;
        ContactPhone = contactPhone;
        Address = address;
        ProviderTypeId = providerTypeId;
        _gradeId = grade?.Id;
        IsActive = isActive;
    }

    public void ChangeActivation(bool isActive)
    {
        IsActive = isActive;
    }

    public void AddAttribute(ProviderAttribute attribute)
    {
        Guard.Against.Null(attribute, nameof(attribute));

        _attributes.Add(attribute);
    }

    public void RemoveAttribute(ProviderAttributeId attributeId)
    {
        Guard.Against.Null(attributeId, nameof(attributeId));

        var attribute = _attributes.FirstOrDefault(a => a.Id == attributeId);
        if (attribute is not null)
        {
            _attributes.Remove(attribute);
        }
    }

    public void UpdateAttribute(ProviderAttributeId attributeId, LocalizedString value)
    {
        Guard.Against.Null(attributeId, nameof(attributeId));
        Guard.Against.Null(value, nameof(value));

        var attribute = _attributes.FirstOrDefault(a => a.Id == attributeId);
        attribute?.UpdateValue(value);
    }

    public void AddService(ProviderService service)
    {
        Guard.Against.Null(service, nameof(service));

        _services.Add(service);
    }

    public void RemoveService(ProviderServiceId serviceId)
    {
        Guard.Against.Null(serviceId, nameof(serviceId));

        var service = _services.FirstOrDefault(s => s.Id == serviceId);
        if (service is not null)
        {
            _services.Remove(service);
        }
    }

    public void UpdateService(
        ProviderServiceId serviceId,
        LocalizedString displayName,
        LocalizedString description,
        MoneyValue price,
        int durationMinutes,
        bool isActive
    )
    {
        Guard.Against.Null(serviceId, nameof(serviceId));
        Guard.Against.Null(displayName, nameof(displayName));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.Null(price, nameof(price));
        Guard.Against.Negative(durationMinutes, nameof(durationMinutes));

        var service = _services.FirstOrDefault(s => s.Id == serviceId);
        service?.Update(displayName, description, price, durationMinutes, isActive);
    }

    public void AddGalleryItem(ProviderGalleryItem galleryItem)
    {
        Guard.Against.Null(galleryItem, nameof(galleryItem));

        _galleryItems.Add(galleryItem);
    }

    public void RemoveGalleryItem(ProviderGalleryItemId galleryItemId)
    {
        Guard.Against.Null(galleryItemId, nameof(galleryItemId));

        var galleryItem = _galleryItems.FirstOrDefault(g => g.Id == galleryItemId);
        if (galleryItem is not null)
        {
            _galleryItems.Remove(galleryItem);
        }
    }

    public void UpdateGalleryItem(
        ProviderGalleryItemId galleryItemId,
        LocalizedString title,
        LocalizedString description,
        string imageUrl,
        int displayOrder
    )
    {
        Guard.Against.Null(galleryItemId, nameof(galleryItemId));
        Guard.Against.Null(title, nameof(title));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.NullOrWhiteSpace(imageUrl, nameof(imageUrl));
        Guard.Against.Negative(displayOrder, nameof(displayOrder));

        var galleryItem = _galleryItems.FirstOrDefault(g => g.Id == galleryItemId);
        galleryItem?.Update(title, description, imageUrl, "image", displayOrder);
    }

    public void AddPolicy(ProviderPolicy policy)
    {
        Guard.Against.Null(policy, nameof(policy));

        _policies.Add(policy);
    }

    public void RemovePolicy(ProviderPolicyId policyId)
    {
        Guard.Against.Null(policyId, nameof(policyId));

        var policy = _policies.FirstOrDefault(p => p.Id == policyId);
        if (policy is not null)
        {
            _policies.Remove(policy);
        }
    }

    public void UpdatePolicy(ProviderPolicyId policyId, LocalizedString type, LocalizedString description)
    {
        Guard.Against.Null(policyId, nameof(policyId));
        Guard.Against.Null(type, nameof(type));
        Guard.Against.Null(description, nameof(description));

        var policy = _policies.FirstOrDefault(p => p.Id == policyId);
        policy?.Update(type, description);
    }

    public void AddStaffMember(ProviderStaff staffMember)
    {
        Guard.Against.Null(staffMember, nameof(staffMember));

        _staffMembers.Add(staffMember);
    }

    public void RemoveStaffMember(ProviderStaffId staffMemberId)
    {
        Guard.Against.Null(staffMemberId, nameof(staffMemberId));

        var staffMember = _staffMembers.FirstOrDefault(s => s.Id == staffMemberId);
        if (staffMember is not null)
        {
            _staffMembers.Remove(staffMember);
        }
    }

    public void UpdateStaffMember(
        ProviderStaffId staffMemberId,
        string name,
        string position,
        string bio,
        string imageUrl,
        bool isActive,
        LocalizedString? notes = null
    )
    {
        Guard.Against.Null(staffMemberId, nameof(staffMemberId));
        Guard.Against.NullOrWhiteSpace(name, nameof(name));
        Guard.Against.NullOrWhiteSpace(position, nameof(position));

        var staffMember = _staffMembers.FirstOrDefault(s => s.Id == staffMemberId);
        if (staffMember is not null)
        {
            staffMember.Update(isActive, notes ?? LocalizedString.Create("en-US", ""));

            // Note: name, position, bio, and imageUrl would need to be updated on the Staff entity,
            // not on the ProviderStaff entity which only associates a Staff with a Provider
        }
    }

    public int? GetGradeId() => _gradeId;

    #endregion
}
