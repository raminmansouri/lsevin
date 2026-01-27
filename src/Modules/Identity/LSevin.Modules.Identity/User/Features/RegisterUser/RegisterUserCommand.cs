using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Messaging.Commands;
using LSevin.Modules.Identity.Constants;
using LSevin.Modules.Identity.User.Dtos;

namespace LSevin.Modules.Identity.User.Features.RegisterUser;

internal sealed record RegisterUserCommand(
    string FirstName,
    string LastName,
    string UserName,
    string Email,
    string PhoneNumberCountryCode,
    string PhoneNumber,
    string Password,
    string ConfirmPassword
) : Command<RegisterUserResponse>, IUserDto
{
    public DateTime CreatedAt { get; init; } = SystemClock.Now;
    public IEnumerable<string>? Roles { get; init; } = [IdentityConstants.Role.User];
}
