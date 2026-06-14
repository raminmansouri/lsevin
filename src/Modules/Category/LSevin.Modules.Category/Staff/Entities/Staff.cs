using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using LSevin.Modules.Category.Staff.Enumerations;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.Staff.Entities;

public sealed class Staff : AggregateRoot<StaffId>
{
    #region Constructors

    private Staff()
    {
        Name = default!;
        Biography = default!;
        Title = default!;
        ProfileImageUrl = null;
        IsActive = true;
        _services = new List<StaffService>();
        _availabilities = new List<StaffAvailability>();
    }

    private Staff(
        LocalizedString name,
        LocalizedString biography,
        LocalizedString title,
        string? profileImageUrl,
        bool isActive
    )
    {
        Id = StaffId.Create(IdGenerator.NewId());
        Name = name;
        Biography = biography;
        Title = title;
        ProfileImageUrl = profileImageUrl;
        IsActive = isActive;
        _services = new List<StaffService>();
        _availabilities = new List<StaffAvailability>();
    }

    #endregion

    #region Properties

    public LocalizedString Name { get; private set; }
    public LocalizedString Biography { get; private set; }
    public LocalizedString Title { get; private set; }
    public string? ProfileImageUrl { get; private set; }
    public bool IsActive { get; private set; }

    public IReadOnlyCollection<StaffService> Services => _services.AsReadOnly();
    private readonly List<StaffService> _services;

    public IReadOnlyCollection<StaffAvailability> Availabilities => _availabilities.AsReadOnly();
    private readonly List<StaffAvailability> _availabilities;

    #endregion

    #region Methods

    public static Staff Create(
        LocalizedString name,
        LocalizedString biography,
        LocalizedString title,
        string? profileImageUrl = null,
        bool isActive = true
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(biography, nameof(biography));
        Guard.Against.Null(title, nameof(title));

        return new Staff(name, biography, title, profileImageUrl, isActive);
    }

    public void Update(
        LocalizedString name,
        LocalizedString biography,
        LocalizedString title,
        string? profileImageUrl,
        bool isActive
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(biography, nameof(biography));
        Guard.Against.Null(title, nameof(title));

        Name = name;
        Biography = biography;
        Title = title;
        ProfileImageUrl = profileImageUrl;
        IsActive = isActive;
    }

    public void ChangeActivation(bool isActive)
    {
        if (IsActive == isActive)
        {
            return;
        }

        IsActive = isActive;
    }

    public void AddService(ServiceDefinitionId serviceDefinitionId, LocalizedString notes)
    {
        Guard.Against.Null(serviceDefinitionId, nameof(serviceDefinitionId));
        Guard.Against.Null(notes, nameof(notes));

        var existingService = _services.FirstOrDefault(s => s.ServiceDefinitionId == serviceDefinitionId);
        if (existingService != null)
        {
            // If service already exists but inactive, reactivate it
            if (!existingService.IsActive)
            {
                existingService.Activate();
            }

            return;
        }

        var service = StaffService.Create(serviceDefinitionId, true, notes);
        _services.Add(service);
    }

    public void RemoveService(StaffServiceId serviceId)
    {
        Guard.Against.Null(serviceId, nameof(serviceId));

        var service = _services.FirstOrDefault(s => s.Id == serviceId);
        if (service == null)
        {
            return;
        }

        _services.Remove(service);
    }

    public void UpdateService(
        StaffServiceId serviceId,
        bool isActive,
        LocalizedString notes,
        ServiceDefinitionId? serviceDefinitionId = null
    )
    {
        Guard.Against.Null(serviceId, nameof(serviceId));
        Guard.Against.Null(notes, nameof(notes));

        var service = _services.FirstOrDefault(s => s.Id == serviceId);
        if (service == null)
        {
            return;
        }

        service.Update(isActive, notes, serviceDefinitionId);
    }

    public void AddAvailability(
        DayOfWeek dayOfWeek,
        TimeSpan startTime,
        TimeSpan endTime,
        StaffAvailabilityStatus status,
        bool isRecurring,
        DateTime? specificDate = null
    )
    {
        var availability = StaffAvailability.Create(dayOfWeek, startTime, endTime, isRecurring, status, specificDate);

        _availabilities.Add(availability);
    }

    public void RemoveAvailability(StaffAvailabilityId availabilityId)
    {
        Guard.Against.Null(availabilityId, nameof(availabilityId));

        var availability = _availabilities.FirstOrDefault(a => a.Id == availabilityId);
        if (availability == null)
        {
            return;
        }

        _availabilities.Remove(availability);
    }

    public void UpdateAvailability(
        StaffAvailabilityId availabilityId,
        DayOfWeek dayOfWeek,
        TimeSpan startTime,
        TimeSpan endTime,
        bool isRecurring,
        StaffAvailabilityStatus status,
        DateTime? specificDate = null
    )
    {
        Guard.Against.Null(availabilityId, nameof(availabilityId));

        var availability = _availabilities.FirstOrDefault(a => a.Id == availabilityId);
        if (availability == null)
        {
            return;
        }

        availability.Update(dayOfWeek, startTime, endTime, isRecurring, status, specificDate);
    }

    #endregion
}
