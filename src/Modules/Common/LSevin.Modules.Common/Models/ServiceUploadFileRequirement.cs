using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ServiceUploadFileRequirement
{
    public Guid Id { get; set; }

    public Guid ServiceDefinitionId { get; set; }

    public string TitleTranslations { get; set; } = null!;

    public string DescriptionTranslations { get; set; } = null!;

    public bool IsRequired { get; set; }

    public long MaxFileSizeBytes { get; set; }

    public List<string> AllowedExtensions { get; set; } = null!;

    public List<string> AllowedMimeTypes { get; set; } = null!;

    public int MaxFiles { get; set; }

    public int DisplayOrder { get; set; }

    public string? ExampleFileUrl { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual ServiceDefinition ServiceDefinition { get; set; } = null!;
}
