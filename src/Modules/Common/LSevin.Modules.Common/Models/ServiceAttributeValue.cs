using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ServiceAttributeValue
{
    public Guid Id { get; set; }

    public Guid AttributeDefinitionId { get; set; }

    public string ValueTranslations { get; set; } = null!;

    public Guid ProviderServiceId { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual ProviderService ProviderService { get; set; } = null!;
}
