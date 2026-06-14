using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class Location
{
    public Guid Id { get; set; }

    public string Code { get; set; } = null!;

    public string ValueTranslations { get; set; } = null!;

    public int LocationTypeId { get; set; }

    public Guid? ParentId { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public int? DisplayOrder { get; set; }

    public virtual ICollection<Location> InverseParent { get; set; } = new List<Location>();

    public virtual LocationType LocationType { get; set; } = null!;

    public virtual Location? Parent { get; set; }
}
