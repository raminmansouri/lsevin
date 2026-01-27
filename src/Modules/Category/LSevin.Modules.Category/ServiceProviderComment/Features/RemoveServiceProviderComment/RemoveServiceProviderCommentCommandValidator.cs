using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProviderComment.Features.RemoveServiceProviderComment;

internal sealed class RemoveServiceProviderCommentCommandValidator
    : AbstractValidator<RemoveServiceProviderCommentCommand>
{
    public RemoveServiceProviderCommentCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.CommentId).ValidateGuid(CategoryResource.Comment);
    }
}
