using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class Customer
{
    public Guid Id { get; set; }

    public string PhoneNumber { get; set; } = null!;

    public string PhoneNumberCountryCode { get; set; } = null!;

    public string Email { get; set; } = null!;

    public DateTime? BirthDate { get; set; }

    public string? StreetTranslations { get; set; }

    public string? City { get; set; }

    public string? Country { get; set; }

    public string? DetailTranslations { get; set; }

    public string? ZipCode { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public string? Gender { get; set; }

    public bool IsActive { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public virtual ICollection<Consulting> Consultings { get; set; } = new List<Consulting>();

    public virtual ICollection<CustomerDocument> CustomerDocuments { get; set; } = new List<CustomerDocument>();

    public virtual ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
}
