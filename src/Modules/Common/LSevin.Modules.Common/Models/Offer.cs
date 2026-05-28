using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class Offer
{
    public int Id { get; set; }

    public Guid ProviderServiceId { get; set; }

    public string Title { get; set; } = null!;

    public string? Subtitle { get; set; }

    public decimal DiscountPercent { get; set; }

    public DateTime ValidUntil { get; set; }

    public string? Code { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? IsFeatured { get; set; }

    public int? UsageLimit { get; set; }

    public int? UsedCount { get; set; }

    public virtual ProviderService ProviderService { get; set; } = null!;
}
