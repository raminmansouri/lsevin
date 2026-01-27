using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceRequest.Enumerations;

public sealed class ServiceProviderRequestStatus : Enumeration
{
    public static readonly ServiceProviderRequestStatus Pending = new(1, nameof(Pending));
    public static readonly ServiceProviderRequestStatus Approved = new(2, nameof(Approved));
    public static readonly ServiceProviderRequestStatus Rejected = new(3, nameof(Rejected));

    private ServiceProviderRequestStatus(int id, string name)
        : base(id, name) { }
}
