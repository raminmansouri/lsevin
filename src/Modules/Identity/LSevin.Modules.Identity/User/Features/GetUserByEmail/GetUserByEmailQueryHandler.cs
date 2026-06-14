using Ardalis.GuardClauses;
using AutoMapper;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Identity.Entities;
using LSevin.Modules.Identity.Infrastructure.Extensions;
using LSevin.Modules.Identity.User.Dtos;
using Microsoft.AspNetCore.Identity;

namespace LSevin.Modules.Identity.User.Features.GetUserByEmail;

internal sealed class GetUserByEmailQueryHandler(UserManager<ApplicationUser> userManager, IMapper mapper)
    : IQueryHandler<GetUserByEmailQuery, GetUserByEmailResponse>
{
    public async Task<Result<GetUserByEmailResponse>> Handle(
        GetUserByEmailQuery query,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(query, nameof(query));

        var identityUser = await userManager.FindUserWithRoleByEmailAsync(
            query.Email,
            cancellationToken: cancellationToken
        );

        if (identityUser is null)
            return AppError.NotFoundErrorMessage(SharedResource.User);

        var userDto = mapper.Map<IdentityUserDto>(identityUser);

        return new GetUserByEmailResponse(userDto);
    }
}
