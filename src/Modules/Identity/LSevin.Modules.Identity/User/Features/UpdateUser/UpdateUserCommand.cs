using BuildingBlocks.Core.Messaging.Commands;
using LSevin.Modules.Identity.User.Dtos;

namespace LSevin.Modules.Identity.User.Features.UpdateUser;

internal sealed record UpdateUserCommand(
    string FirstName,
    string LastName,
    string UserName,
    string Email,
    string PhoneNumberCountryCode,
    string PhoneNumber
) : Command<Guid>, IUserDto;
