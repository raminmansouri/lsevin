using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class Booking
{
    public Guid ProviderId { get; set; }

    public Guid ServiceId { get; set; }

    public Guid SpecialistId { get; set; }

    public DateTime SelectedDate { get; set; }

    public LocalTime SelectedDateFrom { get; set; }

    public LocalTime SelectedDateTo { get; set; }

    public LocalTime SelectedTime { get; set; }

    public LocalTime SelectedTimeFrom { get; set; }

    public LocalTime SelectedTimeTo { get; set; }

    public string PaymentMethod { get; set; } = null!;

    public string AddOns { get; set; } = null!;

    public string UploadFiles { get; set; } = null!;

    public string? AdditionalServices { get; set; }

    public string? PaymentStatus { get; set; }

    public string? ConfirmationCode { get; set; }

    public Guid Id { get; set; }

    public string BookingStatus { get; set; } = null!;

    public DateTime CreateDate { get; set; }

    public DateTime LastModifiedDate { get; set; }

    public Guid? UserId { get; set; }

    public virtual ServiceProvider Provider { get; set; } = null!;

    public virtual ProviderService Service { get; set; } = null!;

    public virtual Staff Specialist { get; set; } = null!;
}
