using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ProviderAttribute
{
    public Guid Id { get; set; }

    public Guid AttributeDefinitionId { get; set; }

    public string ValueTranslations { get; set; } = null!;

    public Guid ServiceProviderId { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual ServiceProvider ServiceProvider { get; set; } = null!;
}
