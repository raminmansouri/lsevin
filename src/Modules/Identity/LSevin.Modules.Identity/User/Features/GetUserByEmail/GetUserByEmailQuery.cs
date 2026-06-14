using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Identity.User.Features.GetUserByEmail;

internal sealed record GetUserByEmailQuery(string Email) : Query<GetUserByEmailResponse>;
