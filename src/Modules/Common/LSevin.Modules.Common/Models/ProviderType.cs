using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ProviderType
{
    public Guid Id { get; set; }

    public string NameTranslations { get; set; } = null!;

    public string DescriptionTranslations { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public string? IconUrl { get; set; }

    public virtual ICollection<ProviderAttributeDefinition> ProviderAttributeDefinitions { get; set; } = new List<ProviderAttributeDefinition>();

    public virtual ICollection<ServiceProvider> ServiceProviders { get; set; } = new List<ServiceProvider>();
}
