namespace LSevin.Modules.Identity.Identity.Entities;

public sealed class AccessToken
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiredAt { get; set; }
    public string CreatedByIp { get; set; } = null!;
    public ApplicationUser? ApplicationUser { get; set; }
}
