using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class ServiceIncluded
{
    public Guid Id { get; set; }

    public Guid ServiceId { get; set; }

    public string Item { get; set; } = null!;
}
