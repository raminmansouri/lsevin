using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Entities;

public sealed class ProviderStaff : Entity<ProviderStaffId>
{
    #region Constructors

    private ProviderStaff()
    {
        Notes = null!;
        IsActive = true;
        StaffId = null!;
    }

    private ProviderStaff(StaffId staffId, LocalizedString notes, bool isActive = true)
        : this()
    {
        Id = ProviderStaffId.Create(IdGenerator.NewId());
        StaffId = staffId;
        Notes = notes;
        IsActive = isActive;
    }

    #endregion

    #region Properties

    public StaffId StaffId { get; private set; }
    public LocalizedString Notes { get; private set; }
    public bool IsActive { get; private set; }

    #endregion

    #region Methods

    public static ProviderStaff Create(StaffId staffId, LocalizedString notes, bool isActive = true)
    {
        Guard.Against.Null(staffId, nameof(staffId));
        Guard.Against.Null(notes, nameof(notes));

        return new ProviderStaff(staffId, notes, isActive);
    }

    public void Update(bool isActive, LocalizedString notes, StaffId? staffId = null)
    {
        Guard.Against.Null(notes, nameof(notes));

        if (staffId != null)
        {
            StaffId = staffId;
        }

        IsActive = isActive;
        Notes = notes;
    }

    public void UpdateNotes(LocalizedString notes)
    {
        Guard.Against.Null(notes, nameof(notes));
        Notes = notes;
    }

    #endregion
}
