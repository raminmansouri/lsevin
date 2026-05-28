using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ServiceAttributeDefinition
{
    public Guid Id { get; set; }

    public string NameTranslations { get; set; } = null!;

    public string DescriptionTranslations { get; set; } = null!;

    public int AttributeTypeId { get; set; }

    public bool IsRequired { get; set; }

    public bool AffectsPricing { get; set; }

    public int DisplayOrder { get; set; }

    public Guid? ServiceDefinitionId { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual AttributeType AttributeType { get; set; } = null!;

    public virtual ICollection<ServiceAttributeDefinitionOption> ServiceAttributeDefinitionOptions { get; set; } = new List<ServiceAttributeDefinitionOption>();

    public virtual ServiceDefinition? ServiceDefinition { get; set; }
}
