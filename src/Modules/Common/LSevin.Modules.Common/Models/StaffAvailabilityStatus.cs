using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class StaffAvailabilityStatus
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<StaffAvailability> StaffAvailabilities { get; set; } = new List<StaffAvailability>();
}
