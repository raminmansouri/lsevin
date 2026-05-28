using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class ServiceDefinitionDomainRequirement
{
    public Guid ServiceDefinitionId { get; set; }

    public int Id { get; set; }

    public string DescriptionTranslations { get; set; } = null!;

    public bool IsMandatory { get; set; }

    public virtual ServiceDefinition ServiceDefinition { get; set; } = null!;
}
