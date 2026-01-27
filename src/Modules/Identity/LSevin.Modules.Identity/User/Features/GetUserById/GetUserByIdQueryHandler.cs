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

namespace LSevin.Modules.Identity.User.Features.GetUserById;

internal sealed class GetUserByIdQueryHandler(UserManager<ApplicationUser> userManager, IMapper mapper)
    : IQueryHandler<GetUserByIdQuery, GetUserByIdResponse>
{
    public async Task<Result<GetUserByIdResponse>> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        Guard.Against.Null(request, nameof(GetUserByIdQuery));

        var identityUser = await userManager.FindUserWithRoleByIdAsync(
            request.UserId,
            cancellationToken: cancellationToken
        );

        if (identityUser is null)
            return AppError.NotFoundErrorMessage(SharedResource.User);

        var identityUserDto = mapper.Map<IdentityUserDto>(identityUser);

        return new GetUserByIdResponse(identityUserDto);
    }
}
