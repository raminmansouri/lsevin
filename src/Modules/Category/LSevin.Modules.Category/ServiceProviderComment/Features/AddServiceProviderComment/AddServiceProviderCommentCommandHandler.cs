using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using LSevin.Modules.Category.ServiceProviderComment.Data.Repository;
using CommentEntity = LSevin.Modules.Category.ServiceProviderComment.Entities.ServiceProviderComment;

namespace LSevin.Modules.Category.ServiceProviderComment.Features.AddServiceProviderComment;

internal sealed class AddServiceProviderCommentCommandHandler(
    IServiceProviderCommentRepository repository,
    IUserAccessor userAccessor
) : CommandHandler<AddServiceProviderCommentCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        AddServiceProviderCommentCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var comment = CommentEntity.Create(
            ServiceProviderId.Create(command.ServiceProviderId),
            userAccessor.GetUserIdentity,
            userAccessor.GetUserFullName ?? "Anonymous",
            command.CommentText,
            command.Rating
        );

        await repository.CreateAsync(comment, cancellationToken);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return comment.Id.Value;
    }
}
