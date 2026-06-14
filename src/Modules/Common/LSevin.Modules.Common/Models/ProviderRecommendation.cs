using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ProviderRecommendation
{
    public Guid Id { get; set; }

    public Guid SourceProviderId { get; set; }

    public Guid TargetProviderId { get; set; }

    public string Type { get; set; } = null!;

    public DateTime? CreateDate { get; set; }
}
