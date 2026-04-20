namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSpecialistByProviderAndService;

public sealed record GetBookingSpecialistByProviderAndServiceRequest(
    Guid? providerId,
    Guid? serviceId,
    Guid? specialistId, bool? IsActive);
