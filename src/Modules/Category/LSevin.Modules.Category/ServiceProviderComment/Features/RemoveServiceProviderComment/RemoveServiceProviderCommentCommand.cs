using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProviderComment.Features.RemoveServiceProviderComment;

public sealed record RemoveServiceProviderCommentCommand(Guid ServiceProviderId, Guid CommentId) : Command<bool>;
