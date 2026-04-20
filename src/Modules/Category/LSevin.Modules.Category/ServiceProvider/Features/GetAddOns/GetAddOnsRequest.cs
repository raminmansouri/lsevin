namespace LSevin.Modules.Category.ServiceProvider.Features.GetAddOns;

public sealed record GetAddOnsRequest(
    
    string? providerId,
    string? serviceId,
    string? specialistId,
    bool? IsActive);
