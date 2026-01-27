using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProviderComment.Data.Repository;
using LSevin.Modules.Category.ServiceProviderComment.Specifications;

namespace LSevin.Modules.Category.ServiceProviderComment.Features.RemoveServiceProviderComment;

internal sealed class RemoveServiceProviderCommentCommandHandler(
    IServiceProviderCommentRepository repository,
    IUserAccessor userAccessor
) : CommandHandler<RemoveServiceProviderCommentCommand, bool>
{
    public override async Task<Result<bool>> Handle(
        RemoveServiceProviderCommentCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new CommentByCustomerIdAndServiceProviderIdSpec(
            userAccessor.GetUserIdentity,
            command.ServiceProviderId
        );
        var comment = await repository.FirstOrDefaultAsync(spec, cancellationToken);
        if (comment is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Comment);

        repository.Delete(comment);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return true;
    }
}
