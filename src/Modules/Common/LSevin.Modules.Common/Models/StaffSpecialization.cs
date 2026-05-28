using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class StaffSpecialization
{
    public Guid StaffId { get; set; }

    public string Specialty { get; set; } = null!;

    public DateTime CreateDate { get; set; }

    public virtual Staff Staff { get; set; } = null!;
}
