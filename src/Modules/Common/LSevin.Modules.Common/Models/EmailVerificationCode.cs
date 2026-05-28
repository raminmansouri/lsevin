using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class EmailVerificationCode
{
    public Guid Id { get; set; }

    public string Email { get; set; } = null!;

    public string Code { get; set; } = null!;

    public DateTime SentAt { get; set; }

    public DateTime? UsedAt { get; set; }
}
