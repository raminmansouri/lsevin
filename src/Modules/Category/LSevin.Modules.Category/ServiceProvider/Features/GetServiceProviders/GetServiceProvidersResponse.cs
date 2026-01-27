namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviders;

public sealed record GetServiceProvidersResponse(
    Guid Id,
    string Name,
    string Description,
    string ContactEmail,
    string? PhoneNumberCountryCode,
    string? PhoneNumber,
    string Address,
    bool IsActive,
    Guid ProviderTypeId,
    string ProviderTypeName,
    int ServiceCount,
    int GalleryItemCount,
    int PolicyCount,
    int StaffCount,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
