using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderPolicy;

public sealed class RemoveProviderPolicyCommandValidator : AbstractValidator<RemoveProviderPolicyCommand>
{
    public RemoveProviderPolicyCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.PolicyId).ValidateGuid(CategoryResource.Service_Provider_Policy);
    }
}
