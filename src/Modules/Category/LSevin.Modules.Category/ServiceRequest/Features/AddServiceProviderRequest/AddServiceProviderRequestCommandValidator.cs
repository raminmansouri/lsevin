using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceRequest.Features.AddServiceProviderRequest;

public sealed class AddServiceProviderRequestCommandValidator : AbstractValidator<AddServiceProviderRequestCommand>
{
    public AddServiceProviderRequestCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.Message)
            .ValidateText(
                SharedResource.Description,
                maxLength: DomainConstValues.ServiceProviderRequestMessageMaxLength
            );
    }
}
