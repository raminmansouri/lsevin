using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class Staff
{
    public Guid Id { get; set; }

    public string NameTranslations { get; set; } = null!;

    public string BiographyTranslations { get; set; } = null!;

    public string TitleTranslations { get; set; } = null!;

    public string? ProfileImageUrl { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public string? Experience { get; set; }

    public string? Patients { get; set; }

    public decimal? Rating { get; set; }

    public string? Specialty { get; set; }

    public decimal? ConsultationFee { get; set; }

    public string? NextAvailableLabel { get; set; }

    public int? ReviewCount { get; set; }

    public string? SpecialtyTranslations { get; set; }

    public int? ExperienceYears { get; set; }

    public string? SuccessRate { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual ICollection<ProviderStaff> ProviderStaffs { get; set; } = new List<ProviderStaff>();

    public virtual ICollection<StaffAchievement> StaffAchievements { get; set; } = new List<StaffAchievement>();

    public virtual ICollection<StaffAvailability> StaffAvailabilities { get; set; } = new List<StaffAvailability>();

    public virtual ICollection<StaffBeforeAfter> StaffBeforeAfters { get; set; } = new List<StaffBeforeAfter>();

    public virtual ICollection<StaffCertification> StaffCertifications { get; set; } = new List<StaffCertification>();

    public virtual ICollection<StaffCredential> StaffCredentials { get; set; } = new List<StaffCredential>();

    public virtual ICollection<StaffEducation> StaffEducations { get; set; } = new List<StaffEducation>();

    public virtual StaffGalleryItem? StaffGalleryItem { get; set; }

    public virtual ICollection<StaffLanguage> StaffLanguages { get; set; } = new List<StaffLanguage>();

    public virtual ICollection<StaffService> StaffServices { get; set; } = new List<StaffService>();

    public virtual ICollection<StaffSpecialization> StaffSpecializations { get; set; } = new List<StaffSpecialization>();
}
