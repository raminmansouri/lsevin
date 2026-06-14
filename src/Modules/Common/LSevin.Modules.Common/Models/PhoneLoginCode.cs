using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class PhoneLoginCode
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Code { get; set; } = null!;

    public DateTime SentAt { get; set; }

    public DateTime? UsedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public int AttemptCount { get; set; }

    public bool IsInvalidated { get; set; }

    public string PhoneNumberCountryCode { get; set; } = null!;

    public string PhoneNumber { get; set; } = null!;

    public virtual AspNetUser User { get; set; } = null!;
}
