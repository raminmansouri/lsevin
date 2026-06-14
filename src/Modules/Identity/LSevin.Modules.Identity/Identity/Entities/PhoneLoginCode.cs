using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Domain.ValueObjects;
using LSevin.Modules.Identity.Constants;

namespace LSevin.Modules.Identity.Identity.Entities;

public class PhoneLoginCode
{
    public Guid Id { get; set; }

    public required Guid UserId { get; set; }

    public required PhoneNumber PhoneNumber { get; set; }

    public required string Code { get; set; }

    public DateTime SentAt { get; set; }

    public DateTime? UsedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public int AttemptCount { get; set; }

    public bool IsInvalidated { get; set; }

    public ApplicationUser User { get; set; } = null!;

    // Helper methods

    public bool IsExpired() => SystemClock.Now > ExpiresAt;

    public bool CanBeVerified() =>
        !IsExpired()
        && UsedAt == null
        && !IsInvalidated
        && AttemptCount < DomainConstValues.MaxPhoneLoginCodeVerifyAttempts;

    public void MarkAsUsed()
    {
        UsedAt = SystemClock.Now;
    }

    public void IncrementAttemptCount()
    {
        AttemptCount++;
    }

    public void Invalidate()
    {
        IsInvalidated = true;
    }
}
