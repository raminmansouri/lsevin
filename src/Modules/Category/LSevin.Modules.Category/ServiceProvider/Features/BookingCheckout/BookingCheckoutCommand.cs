using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.BookingCheckout;

internal sealed record BookingCheckoutCommand(
    Guid? ProviderId,
    Guid? ServiceId,
    Guid? SpecialistId,
    DateOnly? SelectedDate,
    TimeOnly? SelectedDateFrom,
    TimeOnly? SelectedDateTo,
    TimeOnly? SelectedTime,
    TimeOnly? SelectedTimeFrom,
    TimeOnly? SelectedTimeTo,
    string? PaymentMethod,
    IReadOnlyCollection<BookingAddOnItem>? AddOns,
    IReadOnlyCollection<BookingUploadFileItem>? UploadFiles,
    IReadOnlyCollection<BookingAdditionalServiceItem>? AdditionalServices,
    BookingCheckoutStep? Step,
    bool IsFinalSubmit = false,
    string? PaymentStatus = null,
    string? ConfirmationCode = null
) : Command<Guid>;

public enum BookingCheckoutStep : short
{
    DoctorAndDate = 1,
    AddOns = 2,
    UploadFiles = 3,
    ReviewAndPay = 4
}

public static class BookingStatuses
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string Cancelled = "Cancelled";
}

public sealed record BookingAddOnItem(
    Guid Id,
    string Title,
    decimal Price,
    int Quantity
);

public sealed record BookingUploadFileItem(
    Guid? FileDefinitionId,
    string Title,
    string? Description,
    string FileName,
    string FileUrl,
    string? ContentType,
    long FileSize,
    bool IsRequired
);

public sealed record BookingAdditionalServiceItem(
    Guid Id,
    string Title,
    decimal Price,
    int Quantity
);
