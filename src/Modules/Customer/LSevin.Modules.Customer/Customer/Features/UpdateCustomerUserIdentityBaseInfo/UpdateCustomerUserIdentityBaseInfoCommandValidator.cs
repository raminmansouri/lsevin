using FluentValidation;
using LSevin.Modules.Customer.Customer.Dtos;

namespace LSevin.Modules.Customer.Customer.Features.UpdateCustomerUserIdentityBaseInfo;

internal sealed class UpdateCustomerUserIdentityBaseInfoCommandValidator
    : AbstractValidator<UpdateCustomerUserIdentityBaseInfoCommand>
{
    public UpdateCustomerUserIdentityBaseInfoCommandValidator()
    {
        Include(new CustomerUserIdentityBaseInfoValidator());
    }
}
