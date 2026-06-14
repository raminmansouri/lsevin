using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderPolicy;

internal sealed class UpdateProviderPolicyCommandValidator : AbstractValidator<UpdateProviderPolicyCommand>
{
    public UpdateProviderPolicyCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.PolicyId).ValidateGuid(CategoryResource.Service_Provider_Policy);

        RuleFor(x => x.Type).ValidateLocalizedContent(CategoryResource.Service_Provider_Policy_Type);

        RuleFor(x => x.Description).ValidateLocalizedContent(CategoryResource.Service_Provider_Policy_Description);
    }
}
