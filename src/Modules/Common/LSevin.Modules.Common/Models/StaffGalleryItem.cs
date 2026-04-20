using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class StaffGalleryItem
{
    public Guid Id { get; set; }

    public string TitleTranslations { get; set; } = null!;

    public string DescriptionTranslations { get; set; } = null!;

    public string Url { get; set; } = null!;

    public string MediaType { get; set; } = null!;

    public int DisplayOrder { get; set; }

    public bool IsPrimary { get; set; }

    public Guid StaffId { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual Staff Staff { get; set; } = null!;
}
