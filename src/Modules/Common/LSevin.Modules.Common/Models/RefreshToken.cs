using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class RefreshToken
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Token { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiredAt { get; set; }

    public string CreatedByIp { get; set; } = null!;

    public DateTime? RevokedAt { get; set; }

    public virtual AspNetUser User { get; set; } = null!;
}
