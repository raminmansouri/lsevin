using System;
using System.Collections.Generic;
using NodaTime;
using NpgsqlTypes;

namespace LSevinModels.Models;

public partial class ServiceProvider
{
    public Guid Id { get; set; }

    public string NameTranslations { get; set; } = null!;

    public string DescriptionTranslations { get; set; } = null!;

    public bool IsActive { get; set; }

    public Guid ProviderTypeId { get; set; }

    public string City { get; set; } = null!;

    public string Country { get; set; } = null!;

    public string? DetailTranslations { get; set; }

    public string? StreetTranslations { get; set; }

    public string? ZipCode { get; set; }

    public string Email { get; set; } = null!;

    public string PhoneNumberCountryCode { get; set; } = null!;

    public string PhoneNumber { get; set; } = null!;

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public int? GradeId { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public decimal? Rating { get; set; }

    public int? ReviewCount { get; set; }

    public bool? Accredited { get; set; }

    public string? ResponseTime { get; set; }

    public int? EstablishedYear { get; set; }

    public string? TotalPatients { get; set; }

    public string? SuccessRate { get; set; }

    public List<string>? Languages { get; set; }

    public bool? IsSponsored { get; set; }

    public string? SponsoredTag { get; set; }

    public List<string>? Specialties { get; set; }

    public decimal? FeaturedScore { get; set; }

    public NpgsqlTsVector? SearchVector { get; set; }

    public string? ImageUrl { get; set; }

    public string TimezoneId { get; set; } = null!;

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual ServiceProviderGrade? Grade { get; set; }

    public virtual ICollection<ProviderAttribute> ProviderAttributes { get; set; } = new List<ProviderAttribute>();

    public virtual ICollection<ProviderGalleryItem> ProviderGalleryItems { get; set; } = new List<ProviderGalleryItem>();

    public virtual ICollection<ProviderLanguage> ProviderLanguages { get; set; } = new List<ProviderLanguage>();

    public virtual ICollection<ProviderPolicy> ProviderPolicies { get; set; } = new List<ProviderPolicy>();

    public virtual ICollection<ProviderService> ProviderServices { get; set; } = new List<ProviderService>();

    public virtual ICollection<ProviderStaff> ProviderStaffs { get; set; } = new List<ProviderStaff>();

    public virtual ProviderType ProviderType { get; set; } = null!;

    public virtual ICollection<ServiceProviderComment> ServiceProviderComments { get; set; } = new List<ServiceProviderComment>();

    public virtual ICollection<ServiceProviderRequest> ServiceProviderRequests { get; set; } = new List<ServiceProviderRequest>();
}
