using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.RemoveProviderService;

public sealed class RemoveProviderServiceCommandValidator : AbstractValidator<RemoveProviderServiceCommand>
{
    public RemoveProviderServiceCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.ServiceId).ValidateGuid(CategoryResource.Service_Provider_Services);
    }
}
