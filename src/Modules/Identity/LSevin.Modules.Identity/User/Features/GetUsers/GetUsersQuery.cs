using BuildingBlocks.Core.Messaging.Queries.Paging;

namespace LSevin.Modules.Identity.User.Features.GetUsers;

internal sealed record GetUsersQuery : PageQuery<GetUsersResponse>;
