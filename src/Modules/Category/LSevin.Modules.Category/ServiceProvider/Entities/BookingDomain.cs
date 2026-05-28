using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.ServiceProvider.Features.BookingCheckout;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Entities;

public sealed class BookingDomain : AggregateRoot<BookingId>
{
    private BookingDomain() { }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }

    public Guid? ProviderId { get; private set; }
    public Guid? ServiceId { get; private set; }
    public Guid? SpecialistId { get; private set; }

    public DateOnly? SelectedDate { get; private set; }
    public TimeOnly? SelectedDateFrom { get; private set; }
    public TimeOnly? SelectedDateTo { get; private set; }

    public TimeOnly? SelectedTime { get; private set; }
    public TimeOnly? SelectedTimeFrom { get; private set; }
    public TimeOnly? SelectedTimeTo { get; private set; }

    public string? PaymentMethod { get; private set; }

    public List<BookingAddOnItem> AddOns { get; private set; } = [];
    public List<BookingUploadFileItem> UploadFiles { get; private set; } = [];
    public List<BookingAdditionalServiceItem> AdditionalServices { get; private set; } = [];

    public short CheckoutStep { get; private set; }
    public string? PaymentStatus { get; private set; }
    public string? ConfirmationCode { get; private set; }

    public string BookingStatus { get; private set; } = BookingStatuses.Pending;
    public DateTimeOffset CreateDate { get; private set; }
    public DateTimeOffset LastModifiedDate { get; private set; }

    public static BookingDomain CreateDraft(Guid userId)
    {
        return new BookingDomain
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BookingStatus = BookingStatuses.Pending,
            CheckoutStep = (short)BookingCheckoutStep.DoctorAndDate,
            CreateDate = DateTimeOffset.UtcNow,
            LastModifiedDate = DateTimeOffset.UtcNow
        };
    }

    public void SaveCheckout(
        Guid? providerId,
        Guid? serviceId,
        Guid? specialistId,
        DateOnly? selectedDate,
        TimeOnly? selectedDateFrom,
        TimeOnly? selectedDateTo,
        TimeOnly? selectedTime,
        TimeOnly? selectedTimeFrom,
        TimeOnly? selectedTimeTo,
        string? paymentMethod,
        IReadOnlyCollection<BookingAddOnItem>? addOns,
        IReadOnlyCollection<BookingUploadFileItem>? uploadFiles,
        IReadOnlyCollection<BookingAdditionalServiceItem>? additionalServices,
        BookingCheckoutStep? step
    )
    {
        EnsureEditable();

        if (providerId.HasValue)
            ProviderId = providerId.Value;

        if (serviceId.HasValue)
            ServiceId = serviceId.Value;

        if (specialistId.HasValue)
            SpecialistId = specialistId.Value;

        if (selectedDate.HasValue)
            SelectedDate = selectedDate.Value;

        if (selectedDateFrom.HasValue)
            SelectedDateFrom = selectedDateFrom.Value;

        if (selectedDateTo.HasValue)
            SelectedDateTo = selectedDateTo.Value;

        if (selectedTime.HasValue)
            SelectedTime = selectedTime.Value;

        if (selectedTimeFrom.HasValue)
            SelectedTimeFrom = selectedTimeFrom.Value;

        if (selectedTimeTo.HasValue)
            SelectedTimeTo = selectedTimeTo.Value;

        if (!string.IsNullOrWhiteSpace(paymentMethod))
            PaymentMethod = paymentMethod;

        if (addOns is not null)
            AddOns = addOns.ToList();

        if (uploadFiles is not null)
            UploadFiles = uploadFiles.ToList();

        if (additionalServices is not null)
            AdditionalServices = additionalServices.ToList();

        CheckoutStep = (short)step;
        LastModifiedDate = DateTimeOffset.UtcNow;
    }

    public void FinalizeCheckout(string? paymentStatus, string? confirmationCode)
    {
        EnsureEditable();

        if (
            !ProviderId.HasValue ||
            !ServiceId.HasValue ||
            !SpecialistId.HasValue ||
            !SelectedDate.HasValue ||
            !SelectedDateFrom.HasValue ||
            !SelectedDateTo.HasValue ||
            !SelectedTime.HasValue ||
            !SelectedTimeFrom.HasValue ||
            !SelectedTimeTo.HasValue ||
            string.IsNullOrWhiteSpace(PaymentMethod)
        )
        {
            throw new InvalidOperationException("Booking checkout is incomplete and cannot be finalized.");
        }

        if (SelectedTimeFrom.Value >= SelectedTimeTo.Value)
        {
            throw new InvalidOperationException("selected_time_from must be less than selected_time_to.");
        }

        PaymentStatus = paymentStatus;
        ConfirmationCode = confirmationCode;
        BookingStatus = BookingStatuses.Confirmed;
        CheckoutStep = (short)BookingCheckoutStep.ReviewAndPay;
        LastModifiedDate = DateTimeOffset.UtcNow;
    }

    private void EnsureEditable()
    {
        if (!string.Equals(BookingStatus, BookingStatuses.Pending, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Final booking cannot be edited.");
    }
}