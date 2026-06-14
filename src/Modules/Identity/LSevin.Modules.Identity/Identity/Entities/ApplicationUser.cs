using LSevin.Modules.Identity.Identity.Enums;
using Microsoft.AspNetCore.Identity;

namespace LSevin.Modules.Identity.Identity.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string PhoneNumberCountryCode { get; set; } = null!;
    public DateTime? LastLoggedInAt { get; set; }

    // .Net identity navigations -> https://docs.microsoft.com/en-us/aspnet/core/security/authentication/customize-identity-model#add-navigation-properties
    // Only Used by DbContext
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = null!;
    public virtual ICollection<AccessToken> AccessTokens { get; set; } = null!;
    public virtual ICollection<ApplicationUserRole> UserRoles { get; set; } = null!;
    public UserState UserState { get; set; } = UserState.Active;
    public DateTime CreatedAt { get; set; }
}
