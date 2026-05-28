using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ProviderServiceGalleryItem
{
    public Guid Id { get; set; }

    public string TitleTranslations { get; set; } = null!;

    public string DescriptionTranslations { get; set; } = null!;

    public string Url { get; set; } = null!;

    public string MediaType { get; set; } = null!;

    public int DisplayOrder { get; set; }

    public bool IsPrimary { get; set; }

    public Guid ProviderServiceId { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual ProviderService ProviderService { get; set; } = null!;
}
