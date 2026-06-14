using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class ProviderAttributeDefinitionDomainOption
{
    public Guid ProviderAttributeDefinitionId { get; set; }

    public int Id { get; set; }

    public string DisplayNameTranslations { get; set; } = null!;

    public string ValueTranslations { get; set; } = null!;

    public virtual ProviderAttributeDefinition ProviderAttributeDefinition { get; set; } = null!;
}
