using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class StaffAvailability
{
    public Guid Id { get; set; }

    public int DayOfWeek { get; set; }

    public bool IsRecurring { get; set; }

    public int AvailabilityStatusId { get; set; }

    public DateTime? SpecificDate { get; set; }

    public Guid StaffId { get; set; }

    public Period EndTime { get; set; } = null!;

    public Period StartTime { get; set; } = null!;

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual StaffAvailabilityStatus AvailabilityStatus { get; set; } = null!;

    public virtual Staff Staff { get; set; } = null!;
}
