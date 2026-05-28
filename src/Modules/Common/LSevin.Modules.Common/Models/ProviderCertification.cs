using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class ProviderCertification
{
    public Guid Id { get; set; }

    public Guid ServiceProviderId { get; set; }

    public string Name { get; set; } = null!;

    public bool? IsVerified { get; set; }
}
