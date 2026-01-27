using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProviderComment.Features.AddServiceProviderComment;

internal sealed class AddServiceProviderCommentCommandValidator : AbstractValidator<AddServiceProviderCommentCommand>
{
    public AddServiceProviderCommentCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.CommentText)
            .ValidateText(CategoryResource.Comment, maxLength: DomainConstValues.ServiceProviderCommentTextMaxLength);

        RuleFor(x => x.Rating).InclusiveBetween(1, 5).When(x => x.Rating.HasValue);
    }
}
