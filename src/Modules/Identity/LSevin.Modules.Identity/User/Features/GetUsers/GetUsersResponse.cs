using BuildingBlocks.Core.Messaging.Queries.Paging;
using LSevin.Modules.Identity.User.Dtos;

namespace LSevin.Modules.Identity.User.Features.GetUsers;

internal sealed record GetUsersResponse(IPageList<IdentityUserDto> IdentityUsers);
