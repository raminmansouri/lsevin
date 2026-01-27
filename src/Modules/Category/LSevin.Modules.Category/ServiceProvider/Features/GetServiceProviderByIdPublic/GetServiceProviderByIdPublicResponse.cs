using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

public sealed class GetServiceProviderByIdPublicResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = null!;
    public string Description { get; init; } = null!;
    public string ContactEmail { get; init; } = null!;
    public string? PhoneNumberCountryCode { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Address { get; init; }
    public CoordinatesDto? Coordinates { get; init; }
    public string ProviderTypeName { get; init; } = null!;
    public IReadOnlyCollection<ServiceProviderAttributeDto> Attributes { get; set; } =
        new List<ServiceProviderAttributeDto>();
    public IReadOnlyCollection<ServiceProviderPolicyDto> Policies { get; set; } = new List<ServiceProviderPolicyDto>();
    public IReadOnlyCollection<ServiceProviderGalleryItemDto> Gallery { get; set; } =
        new List<ServiceProviderGalleryItemDto>();
    public IReadOnlyCollection<ServiceProviderServiceDto> Services { get; set; } =
        new List<ServiceProviderServiceDto>();
    public IReadOnlyCollection<ServiceProviderStaffDto> Staff { get; set; } = new List<ServiceProviderStaffDto>();
}

public sealed class ServiceProviderAttributeDto
{
    public Guid Id { get; init; }
    public Guid AttributeTypeId { get; init; }
    public string AttributeName { get; init; } = null!;
    public string Value { get; init; } = null!;
}

public sealed class ServiceProviderPolicyDto
{
    public Guid Id { get; init; }
    public string PolicyTypeName { get; init; } = null!;
    public string Description { get; init; } = null!;
}

public sealed class ServiceProviderGalleryItemDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = null!;
    public string Url { get; init; } = null!;
    public string MediaType { get; init; } = null!;
    public int DisplayOrder { get; init; }
}

public sealed class ServiceProviderServiceDto
{
    public Guid Id { get; init; }
    public Guid ServiceDefinitionId { get; init; }
    public string DisplayName { get; init; } = null!;
    public string? Description { get; init; }
    public bool IsActive { get; init; }
    public string Currency { get; init; } = null!;
    public decimal Value { get; init; }
}

public sealed class ServiceProviderStaffDto
{
    public Guid Id { get; init; }
    public Guid StaffId { get; init; }
    public string StaffName { get; init; } = null!;
    public string? StaffTitle { get; init; }
    public string? StaffBiography { get; init; }
    public string? ProfileImageUrl { get; init; }
    public string? Notes { get; init; }
    public bool IsActive { get; init; }
}
