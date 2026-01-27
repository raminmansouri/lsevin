using AutoMapper;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.User.Dtos;

namespace LSevin.Modules.Identity.User.Mappings;

internal sealed class UserMapping : Profile
{
    public UserMapping()
    {
        CreateMap<RefreshToken, string>().ConvertUsing(src => src.Token);

        CreateMap<ApplicationUser, IdentityUserDto>()
            .ConstructUsing(src => new IdentityUserDto(
                src.Id,
                src.UserName ?? string.Empty,
                src.Email ?? string.Empty,
                src.PhoneNumberCountryCode,
                src.PhoneNumber ?? string.Empty,
                src.FirstName,
                src.LastName,
                src.LastLoggedInAt,
                src.UserRoles.Where(m => m.Role != null).Select(q => q.Role!.Name!),
                src.UserState,
                src.CreatedAt
            ));
    }
}
