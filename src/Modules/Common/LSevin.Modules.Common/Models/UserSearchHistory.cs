using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class UserSearchHistory
{
    public int Id { get; set; }

    public string UserId { get; set; } = null!;

    public string Term { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public int? CategoryId { get; set; }

    public string? NormalizedTerm { get; set; }
}
