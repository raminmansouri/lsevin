using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class StaffLanguage
{
    public Guid StaffId { get; set; }

    public string Language { get; set; } = null!;

    public DateTime CreateDate { get; set; }

    public virtual Staff Staff { get; set; } = null!;
}
