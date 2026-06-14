using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class Addon
{
    public string Id { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Description { get; set; } = null!;

    public decimal Price { get; set; }

    public string Icon { get; set; } = null!;

    public bool? Popular { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual ICollection<AddonDetail> AddonDetails { get; set; } = new List<AddonDetail>();

    public virtual ICollection<ProviderService> ProviderServices { get; set; } = new List<ProviderService>();
}
