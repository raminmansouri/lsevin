namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviders;

public sealed record GetTrustedProvidersResponse(
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
)
{
    public bool? Verified { get; set; }
    public int? Rating { get; set; }
    public int? Bookings { get; set; }
    public int? Growth { get; set; }
    public string? Image { get; set; }

}
