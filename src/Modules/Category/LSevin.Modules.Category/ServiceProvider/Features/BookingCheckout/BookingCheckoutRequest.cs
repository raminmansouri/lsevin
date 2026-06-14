using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.BookingCheckout;


public sealed record BookingCheckoutRequest(
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
    BookingCheckoutStep Step
);

