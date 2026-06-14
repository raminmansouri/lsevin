using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using LSevin.Modules.Category.ServiceRequest.Enumerations;
using LSevin.Modules.Category.ServiceRequest.ValueObjects;

namespace LSevin.Modules.Category.ServiceRequest.Entities;

public sealed class ServiceProviderRequest : AggregateRoot<ServiceProviderRequestId>
{
    private ServiceProviderRequest()
    {
        ServiceProviderId = null!;
        CustomerId = Guid.Empty;
        CustomerEmail = string.Empty;
        CustomerFullName = string.Empty;
        Message = string.Empty;
        _requestStatusId = 0;
    }

    private ServiceProviderRequest(
        ServiceProviderId serviceProviderId,
        Guid customerId,
        string customerEmail,
        string customerFullName,
        string message
    )
        : this()
    {
        Id = ServiceProviderRequestId.Create(IdGenerator.NewId());
        ServiceProviderId = serviceProviderId;
        CustomerId = customerId;
        CustomerEmail = customerEmail;
        CustomerFullName = customerFullName;
        Message = message;
        _requestStatusId = ServiceProviderRequestStatus.Pending.Id;
    }

    public ServiceProviderId ServiceProviderId { get; private set; }
    public Guid CustomerId { get; private set; }
    public string CustomerEmail { get; private set; }
    public string CustomerFullName { get; private set; }
    public string Message { get; private set; }
    public ServiceProviderRequestStatus? RequestStatus { get; private set; }
    private int _requestStatusId;

    public static ServiceProviderRequest Create(
        ServiceProviderId serviceProviderId,
        Guid customerId,
        string customerEmail,
        string customerFullName,
        string message
    )
    {
        Guard.Against.Null(serviceProviderId, nameof(serviceProviderId));
        Guard.Against.Default(customerId, nameof(customerId));
        Guard.Against.NullOrEmpty(customerEmail, nameof(customerEmail));
        Guard.Against.NullOrEmpty(customerFullName, nameof(customerFullName));
        Guard.Against.NullOrWhiteSpace(message, nameof(message));

        return new ServiceProviderRequest(serviceProviderId, customerId, customerEmail, customerFullName, message);
    }

    public void MarkAsApproved()
    {
        if (_requestStatusId == ServiceProviderRequestStatus.Approved.Id)
            return;
        _requestStatusId = ServiceProviderRequestStatus.Approved.Id;
    }

    public void MarkAsRejected()
    {
        if (_requestStatusId == ServiceProviderRequestStatus.Rejected.Id)
            return;
        _requestStatusId = ServiceProviderRequestStatus.Rejected.Id;
    }

    public int GetStatusId() => _requestStatusId;
}
