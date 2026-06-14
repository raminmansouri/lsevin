using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class TrendingSearch
{
    public string? Term { get; set; }

    public string? Trend { get; set; }

    public DateTime? CalculatedAt { get; set; }
}
