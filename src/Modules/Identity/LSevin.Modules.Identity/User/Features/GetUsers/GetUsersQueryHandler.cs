using AutoMapper;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Infrastructure.Extensions;
using LSevin.Modules.Identity.User.Dtos;
using Microsoft.AspNetCore.Identity;
using Sieve.Services;

namespace LSevin.Modules.Identity.User.Features.GetUsers;

internal sealed class GetUsersQueryHandler(
    UserManager<ApplicationUser> userManager,
    IMapper mapper,
    ISieveProcessor sieveProcessor
) : IQueryHandler<GetUsersQuery, GetUsersResponse>
{
    public async Task<Result<GetUsersResponse>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await userManager.FindAllUsersByPageAsync<IdentityUserDto>(
            request,
            mapper,
            sieveProcessor,
            cancellationToken
        );

        return new GetUsersResponse(users);
    }
}
