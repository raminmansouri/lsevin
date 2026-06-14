namespace LSevin.Modules.Identity.Identity.Entities;

public class EmailVerificationCode
{
    public Guid Id { get; set; }

    public required string Email { get; set; }

    public required string Code { get; set; }

    public DateTime SentAt { get; set; }

    public DateTime? UsedAt { get; set; }
}
