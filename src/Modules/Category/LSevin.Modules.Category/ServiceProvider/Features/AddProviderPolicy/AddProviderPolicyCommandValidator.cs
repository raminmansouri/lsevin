using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderPolicy;

public sealed class AddProviderPolicyCommandValidator : AbstractValidator<AddProviderPolicyCommand>
{
    public AddProviderPolicyCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.Type).ValidateLocalizedContent(CategoryResource.Service_Provider_Policy_Type);

        RuleFor(x => x.Description).ValidateLocalizedContent(CategoryResource.Service_Provider_Policy_Description);
    }
}
