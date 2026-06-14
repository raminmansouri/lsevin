using System.Globalization;
using Microsoft.AspNetCore.Identity;
using IdentityConstants = LSevin.Modules.Identity.Constants.IdentityConstants;

namespace LSevin.Modules.Identity.Identity.Entities;

public class ApplicationRole : IdentityRole<Guid>
{
    public virtual ICollection<ApplicationUserRole> UserRoles { get; set; } = null!;
    public static ApplicationRole User =>
        new()
        {
            Name = IdentityConstants.Role.User,
            NormalizedName = nameof(User).ToUpper(CultureInfo.InvariantCulture),
        };

    public static ApplicationRole Admin =>
        new()
        {
            Name = IdentityConstants.Role.Admin,
            NormalizedName = nameof(Admin).ToUpper(CultureInfo.InvariantCulture),
        };
}
