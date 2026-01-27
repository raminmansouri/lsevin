namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderStaff;

public sealed record GetServiceProviderStaffResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string DisplayName,
    string? ProfileImageUrl,
    string? Description,
    string Gender,
    string JobTitle,
    string Email,
    string PhoneNumber,
    bool IsActive,
    DateTime CreateDate,
    DateTime? LastModifiedDate
);
