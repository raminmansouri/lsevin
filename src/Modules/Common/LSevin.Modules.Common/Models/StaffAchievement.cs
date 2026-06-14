using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class StaffAchievement
{
    public Guid Id { get; set; }

    public Guid StaffId { get; set; }

    public string? Icon { get; set; }

    public string Title { get; set; } = null!;

    public string? Organization { get; set; }

    public int DisplayOrder { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual Staff Staff { get; set; } = null!;
}
