using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class Favorite
{
    public long Id { get; set; }

    public Guid CustomerId { get; set; }

    public Guid EntityId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Customer Customer { get; set; } = null!;
}
