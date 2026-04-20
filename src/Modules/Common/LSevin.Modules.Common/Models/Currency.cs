using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class Currency
{
    public long Id { get; set; }

    public decimal? Price { get; set; }

    public string? Symbol { get; set; }
}
