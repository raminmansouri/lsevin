using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ProviderType.Features.DeleteProviderType;

internal sealed class DeleteProviderTypeCommandValidator : AbstractValidator<DeleteProviderTypeCommand>
{
    public DeleteProviderTypeCommandValidator()
    {
        RuleFor(x => x.ProviderTypeId).NotEmpty().WithMessage(CategoryResource.Provider_Type);
    }
}
