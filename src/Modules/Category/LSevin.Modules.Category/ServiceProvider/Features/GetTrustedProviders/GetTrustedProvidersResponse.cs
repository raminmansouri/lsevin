namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviders;

public sealed record GetTrustedProvidersResponse(

)
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string ContactEmail { get; set; }
    public string? PhoneNumberCountryCode { get; set; }
    public string? PhoneNumber { get; set; }
    public string Address { get; set; }
    public bool IsActive { get; set; }
    public Guid ProviderTypeId { get; set; }
    public string ProviderTypeName { get; set; }
    public int ServiceCount { get; set; }
    public int GalleryItemCount { get; set; }
    public int PolicyCount { get; set; }
    public int StaffCount { get; set; }
    public DateTime CreateDate { get; set; }
    public DateTime? LastModifiedDate { get; set; }
    public bool? Verified { get; set; }
    public int? Rating { get; set; }
    public int? Bookings { get; set; }
    public int? Growth { get; set; }
    public string? Image { get; set; }

}
