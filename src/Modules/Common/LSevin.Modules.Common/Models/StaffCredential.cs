using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class StaffCredential
{
    public Guid Id { get; set; }

    public Guid StaffId { get; set; }

    public string Credential { get; set; } = null!;

    public bool IsVerified { get; set; }

    public virtual Staff Staff { get; set; } = null!;
}
