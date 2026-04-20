using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class AddonDetail
{
    public Guid Id { get; set; }

    public string AddonId { get; set; } = null!;

    public string Detail { get; set; } = null!;

    public int DisplayOrder { get; set; }

    public virtual Addon Addon { get; set; } = null!;
}
