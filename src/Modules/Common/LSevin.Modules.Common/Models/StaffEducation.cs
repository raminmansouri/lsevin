using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class StaffEducation
{
    public Guid Id { get; set; }

    public Guid StaffId { get; set; }

    public string Degree { get; set; } = null!;

    public string Institution { get; set; } = null!;

    public int? Year { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual Staff Staff { get; set; } = null!;
}
