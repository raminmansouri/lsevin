using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class ReviewImage
{
    public Guid Id { get; set; }

    public Guid ReviewId { get; set; }

    public string? ImageUrl { get; set; }

    public virtual ServiceProviderComment Review { get; set; } = null!;
}
