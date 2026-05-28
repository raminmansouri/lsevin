using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class StaffCertification
{
    public Guid Id { get; set; }

    public Guid StaffId { get; set; }

    public string Name { get; set; } = null!;

    public string? Issuer { get; set; }

    public bool IsVerified { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual Staff Staff { get; set; } = null!;
}
