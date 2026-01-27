using LSevin.Modules.Identity.User.Dtos;

namespace LSevin.Modules.Identity.User.Features.RegisterUser;

internal sealed record RegisterUserResponse(IdentityUserDto? UserIdentity);
