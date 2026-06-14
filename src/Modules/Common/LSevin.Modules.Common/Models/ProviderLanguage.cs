using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ProviderLanguage
{
    public Guid ServiceProviderId { get; set; }

    public string Language { get; set; } = null!;

    public DateTime CreateDate { get; set; }

    public virtual ServiceProvider ServiceProvider { get; set; } = null!;
}
