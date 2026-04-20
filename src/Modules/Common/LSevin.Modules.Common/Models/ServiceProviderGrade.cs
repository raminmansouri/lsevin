using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class ServiceProviderGrade
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<ServiceProvider> ServiceProviders { get; set; } = new List<ServiceProvider>();
}
