using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class ServiceAttributeDefinitionOption
{
    public Guid ServiceAttributeDefinitionId { get; set; }

    public int Id { get; set; }

    public string DisplayNameTranslations { get; set; } = null!;

    public string ValueTranslations { get; set; } = null!;

    public decimal? AdditionalPrice { get; set; }

    public virtual ServiceAttributeDefinition ServiceAttributeDefinition { get; set; } = null!;
}
