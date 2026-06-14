using LSevin.Modules.Identity.User.Dtos;

namespace LSevin.Modules.Identity.User.Features.GetUserByEmail;

internal sealed record GetUserByEmailResponse(IdentityUserDto? UserIdentity);
