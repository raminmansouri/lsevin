namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetProvidersByServiceAndSpecialist;

public sealed record GetBookingGetProvidersByServiceAndSpecialistRequest(

    Guid? providerId,
    Guid? serviceId,
    Guid? specialistId, bool? IsActive);
