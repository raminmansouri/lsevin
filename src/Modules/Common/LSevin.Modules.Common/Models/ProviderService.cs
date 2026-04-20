using System;
using System.Collections.Generic;
using NodaTime;
using NpgsqlTypes;

namespace LSevinModels.Models;

public partial class ProviderService
{
    public Guid Id { get; set; }

    public Guid ServiceDefinitionId { get; set; }

    public string DisplayNameTranslations { get; set; } = null!;

    public string DescriptionTranslations { get; set; } = null!;

    public bool IsActive { get; set; }

    public Guid ServiceProviderId { get; set; }

    public string Currency { get; set; } = null!;

    public decimal Value { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public int DurationMinutes { get; set; }

    public decimal? Rating { get; set; }

    public int? ReviewCount { get; set; }

    public string? Recovery { get; set; }

    public string? ImageUrl { get; set; }

    public bool? IsPopular { get; set; }

    public string? Anesthesia { get; set; }

    public string? StayRequired { get; set; }

    public string? SuccessRate { get; set; }

    public string? Satisfaction { get; set; }

    public decimal? TrendingScore { get; set; }

    public string? Growth { get; set; }

    public NpgsqlTsVector? SearchVector { get; set; }

    public List<string>? Tags { get; set; }

    public int SlotIntervalMinutes { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual ICollection<Offer> Offers { get; set; } = new List<Offer>();

    public virtual ProviderServiceGalleryItem? ProviderServiceGalleryItem { get; set; }

    public virtual ICollection<ServiceAttributeValue> ServiceAttributeValues { get; set; } = new List<ServiceAttributeValue>();

    public virtual ServiceDefinition ServiceDefinition { get; set; } = null!;

    public virtual ServiceProvider ServiceProvider { get; set; } = null!;

    public virtual ICollection<Addon> Addons { get; set; } = new List<Addon>();
}
