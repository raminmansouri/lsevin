using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.Staff.Entities;

public sealed class StaffService : Entity<StaffServiceId>
{
    #region Constructors

    private StaffService()
    {
        ServiceDefinitionId = default!;
        IsActive = false;
        Notes = default!;
    }

    private StaffService(ServiceDefinitionId serviceDefinitionId, bool isActive, LocalizedString notes)
        : this()
    {
        Id = StaffServiceId.Create(IdGenerator.NewId());
        ServiceDefinitionId = serviceDefinitionId;
        IsActive = isActive;
        Notes = notes;
    }

    #endregion

    #region Properties

    public ServiceDefinitionId ServiceDefinitionId { get; private set; }
    public bool IsActive { get; private set; }
    public LocalizedString Notes { get; private set; }

    #endregion

    #region Methods

    public static StaffService Create(
        ServiceDefinitionId serviceDefinitionId,
        bool isActive = true,
        LocalizedString? notes = null
    )
    {
        Guard.Against.Null(serviceDefinitionId, nameof(serviceDefinitionId));

        var serviceNotes = notes ?? LocalizedString.Create("en-US", "");
        return new StaffService(serviceDefinitionId, isActive, serviceNotes);
    }

    public void Update(bool isActive, LocalizedString notes, ServiceDefinitionId? serviceDefinitionId = null)
    {
        Guard.Against.Null(notes, nameof(notes));

        if (serviceDefinitionId != null)
        {
            ServiceDefinitionId = serviceDefinitionId;
        }

        IsActive = isActive;
        Notes = notes;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    #endregion
}
