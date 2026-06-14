using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class Currency1
{
    public string Symbol { get; set; } = null!;

    public string Name { get; set; } = null!;

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public Guid Id { get; set; }

    public decimal Price { get; set; }
}
