using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ProviderAttributeDefinition
{
    public Guid Id { get; set; }

    public string NameTranslations { get; set; } = null!;

    public string DescriptionTranslations { get; set; } = null!;

    public int AttributeTypeId { get; set; }

    public bool IsRequired { get; set; }

    public string ValidationRules { get; set; } = null!;

    public Guid ProviderTypeId { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual AttributeType AttributeType { get; set; } = null!;

    public virtual ICollection<ProviderAttributeDefinitionDomainOption> ProviderAttributeDefinitionDomainOptions { get; set; } = new List<ProviderAttributeDefinitionDomainOption>();

    public virtual ProviderType ProviderType { get; set; } = null!;
}
