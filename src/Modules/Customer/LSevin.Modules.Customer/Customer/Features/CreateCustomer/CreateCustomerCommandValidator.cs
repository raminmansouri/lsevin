using FluentValidation;
using LSevin.Modules.Customer.Customer.Dtos;

namespace LSevin.Modules.Customer.Customer.Features.CreateCustomer;

internal sealed class CreateCustomerCommandValidator : AbstractValidator<CreateCustomerCommand>
{
    public CreateCustomerCommandValidator()
    {
        Include(new CustomerUserIdentityBaseInfoValidator());
    }
}
