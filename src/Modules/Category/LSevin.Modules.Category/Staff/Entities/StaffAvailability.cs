using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.Staff.Enumerations;
using LSevin.Modules.Category.Staff.Rule;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.Staff.Entities;

public sealed class StaffAvailability : Entity<StaffAvailabilityId>
{
    #region Constructors

    private StaffAvailability()
    {
        DayOfWeek = DayOfWeek.Monday;
        TimeRange = null!;
        IsRecurring = false;
        _statusId = StaffAvailabilityStatus.Available.Id;
        SpecificDate = null;
    }

    private StaffAvailability(
        DayOfWeek dayOfWeek,
        TimeRange timeRange,
        bool isRecurring,
        StaffAvailabilityStatus status,
        DateTime? specificDate = null
    )
        : this()
    {
        Id = StaffAvailabilityId.Create(IdGenerator.NewId());
        DayOfWeek = dayOfWeek;
        TimeRange = timeRange;
        IsRecurring = isRecurring;
        _statusId = status.Id;
        SpecificDate = specificDate;
    }

    #endregion

    #region Properties

    public DayOfWeek DayOfWeek { get; private set; }
    public TimeRange TimeRange { get; private set; }
    public bool IsRecurring { get; private set; }

    private int _statusId;
    public StaffAvailabilityStatus? Status { get; private set; }
    public DateTime? SpecificDate { get; private set; }

    #endregion

    #region Methods

    public static StaffAvailability Create(
        DayOfWeek dayOfWeek,
        TimeSpan startTime,
        TimeSpan endTime,
        bool isRecurring,
        StaffAvailabilityStatus status,
        DateTime? specificDate = null
    )
    {
        Guard.Against.Null(status, nameof(status));

        CheckRule(new NonRecurringAvailabilityRequiresSpecificDateRule(isRecurring, specificDate));

        var timeRange = TimeRange.Of(startTime, endTime);

        return new StaffAvailability(dayOfWeek, timeRange, isRecurring, status, specificDate);
    }

    public void Update(
        DayOfWeek dayOfWeek,
        TimeSpan startTime,
        TimeSpan endTime,
        bool isRecurring,
        StaffAvailabilityStatus status,
        DateTime? specificDate = null
    )
    {
        Guard.Against.Null(status, nameof(status));

        CheckRule(new NonRecurringAvailabilityRequiresSpecificDateRule(isRecurring, specificDate));

        TimeRange = TimeRange.Of(startTime, endTime);
        DayOfWeek = dayOfWeek;
        IsRecurring = isRecurring;
        _statusId = status.Id;
        SpecificDate = specificDate;
    }

    public void ChangeStatus(StaffAvailabilityStatus status)
    {
        Guard.Against.Null(status, nameof(status));
        _statusId = status.Id;
    }

    public int GetStatusId() => _statusId;

    #endregion
}
