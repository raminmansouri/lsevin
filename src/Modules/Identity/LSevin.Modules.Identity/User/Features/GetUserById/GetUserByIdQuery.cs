using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Identity.User.Features.GetUserById;

internal sealed record GetUserByIdQuery(Guid UserId) : Query<GetUserByIdResponse>;
