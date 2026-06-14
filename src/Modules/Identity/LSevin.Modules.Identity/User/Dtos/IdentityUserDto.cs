using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Identity.Enums;

namespace LSevin.Modules.Identity.User.Dtos;

internal sealed record IdentityUserDto(
    Guid Id,
    string UserName,
    string Email,
    string PhoneNumberCountryCode,
    string PhoneNumber,
    string FirstName,
    string LastName,
    DateTime? LastLoggedInAt,
    IEnumerable<string>? Roles,
    UserState UserState,
    DateTime CreatedAt
);

public sealed record JwtUserDto(
    Guid Id,
    string UserName,
    string Email,
    string FirstName,
    string LastName,
    bool EmailConfirmed,
    bool PhoneNumberConfirmed
);

public static class IdentityUserExtensions
{
    public static JwtUserDto ToJwtUserDto(this ApplicationUser user)
    {
        return new JwtUserDto(
            user.Id,
            user.UserName!,
            user.Email!,
            user.FirstName,
            user.LastName,
            user.EmailConfirmed,
            user.PhoneNumberConfirmed
        );
    }
}
