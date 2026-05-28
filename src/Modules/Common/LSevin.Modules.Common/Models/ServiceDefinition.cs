using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ServiceDefinition
{
    public Guid Id { get; set; }

    public string NameTranslations { get; set; } = null!;

    public string DescriptionTranslations { get; set; } = null!;

    public Guid CategoryId { get; set; }

    public int DurationMinutes { get; set; }

    public string PricingModel { get; set; } = null!;

    public bool IsActive { get; set; }

    public string Currency { get; set; } = null!;

    public decimal Value { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual Category Category { get; set; } = null!;

    public virtual ICollection<ProviderService> ProviderServices { get; set; } = new List<ProviderService>();

    public virtual ICollection<ServiceAttributeDefinition> ServiceAttributeDefinitions { get; set; } = new List<ServiceAttributeDefinition>();

    public virtual ICollection<ServiceDefinitionDomainRequirement> ServiceDefinitionDomainRequirements { get; set; } = new List<ServiceDefinitionDomainRequirement>();

    public virtual ICollection<ServiceUploadFileRequirement> ServiceUploadFileRequirements { get; set; } = new List<ServiceUploadFileRequirement>();

    public virtual ICollection<StaffService> StaffServices { get; set; } = new List<StaffService>();
}
