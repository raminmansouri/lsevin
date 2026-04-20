using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class StaffBeforeAfter
{
    public Guid Id { get; set; }

    public Guid StaffId { get; set; }

    public string BeforeImage { get; set; } = null!;

    public string AfterImage { get; set; } = null!;

    public string? Procedure { get; set; }

    public int? Months { get; set; }

    public int DisplayOrder { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual Staff Staff { get; set; } = null!;
}
