using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class InboxMessage1
{
    public Guid Id { get; set; }

    public string Type { get; set; } = null!;

    public string Content { get; set; } = null!;

    public DateTime OccurredOnUtc { get; set; }

    public DateTime? ProcessedOnUtc { get; set; }

    public string? Error { get; set; }
}
