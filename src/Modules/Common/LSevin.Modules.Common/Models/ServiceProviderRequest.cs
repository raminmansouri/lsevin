using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ServiceProviderRequest
{
    public Guid Id { get; set; }

    public Guid ServiceProviderId { get; set; }

    public Guid CustomerId { get; set; }

    public string CustomerEmail { get; set; } = null!;

    public string CustomerFullName { get; set; } = null!;

    public string Message { get; set; } = null!;

    public int RequestStatusId { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual ServiceProviderRequestStatus RequestStatus { get; set; } = null!;

    public virtual ServiceProvider ServiceProvider { get; set; } = null!;
}
