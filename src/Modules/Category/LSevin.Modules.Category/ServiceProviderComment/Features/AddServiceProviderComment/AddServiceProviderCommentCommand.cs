using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Category.ServiceProviderComment.Features.AddServiceProviderComment;

public sealed record AddServiceProviderCommentCommand(Guid ServiceProviderId, string CommentText, int? Rating)
    : Command<Guid>;
