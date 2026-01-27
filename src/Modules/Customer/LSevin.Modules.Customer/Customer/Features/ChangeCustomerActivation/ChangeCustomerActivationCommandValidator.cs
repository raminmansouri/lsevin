using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Customer.Resources;

namespace LSevin.Modules.Customer.Customer.Features.ChangeCustomerActivation;

internal sealed class ChangeCustomerActivationCommandValidator : AbstractValidator<ChangeCustomerActivationCommand>
{
    public ChangeCustomerActivationCommandValidator()
    {
        RuleFor(r => r.UserId).ValidateGuid(CustomerResource.Customer);
    }
}
