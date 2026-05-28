namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetServicesByProviderAndSpecialist;

public sealed record GetBookingGetServicesByProviderAndSpecialistRequest(
    Guid? providerId,
    Guid? serviceId,
    Guid? specialistId, bool? IsActive);
