using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class AttributeType
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<ProviderAttributeDefinition> ProviderAttributeDefinitions { get; set; } = new List<ProviderAttributeDefinition>();

    public virtual ICollection<ServiceAttributeDefinition> ServiceAttributeDefinitions { get; set; } = new List<ServiceAttributeDefinition>();
}
