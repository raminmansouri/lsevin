namespace LSevin.Modules.Category.ServiceProviderComment.Features.GetCommentsByServiceProvider;

public sealed record GetCommentsByServiceProviderResponse(
    Guid Id,
    Guid ServiceProviderId,
    Guid CustomerId,
    string CustomerName,
    string CommentText,
    int? Rating,
    bool IsMine,
    DateTime CreateDate
);
