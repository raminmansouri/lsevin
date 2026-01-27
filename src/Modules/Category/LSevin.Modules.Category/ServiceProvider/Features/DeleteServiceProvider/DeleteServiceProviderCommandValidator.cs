using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.DeleteServiceProvider;

internal sealed class DeleteServiceProviderCommandValidator : AbstractValidator<DeleteServiceProviderCommand>
{
    public DeleteServiceProviderCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
