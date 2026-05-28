using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ProviderPolicy
{
    public Guid Id { get; set; }

    public string TypeTranslations { get; set; } = null!;

    public string DescriptionTranslations { get; set; } = null!;

    public Guid ServiceProviderId { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual ServiceProvider ServiceProvider { get; set; } = null!;
}
