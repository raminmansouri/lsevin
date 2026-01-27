using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Customer.Resources;
using PhoneNumbers;

namespace LSevin.Modules.Customer.Customer.Dtos;

internal sealed class CustomerUserIdentityBaseInfoValidator : AbstractValidator<ICustomerUserIdentityBaseInfo>
{
    private static readonly PhoneNumberUtil _phoneNumberUtil = PhoneNumberUtil.GetInstance();

    public CustomerUserIdentityBaseInfoValidator()
    {
        RuleFor(r => r.UserId).ValidateGuid(CustomerResource.Customer);
        RuleFor(r => r.FirstName).ValidateFirstName();
        RuleFor(r => r.LastName).ValidateLastName();
        RuleFor(r => r.Email).ValidateEmail();

        RuleFor(user => user)
            .Must(user => _phoneNumberUtil.IsValidPhoneNumber(user.PhoneNumber, user.PhoneNumberCountryCode))
            .WithMessage(SharedResource.Validation_Error_Message.FormatWithStr(SharedResource.Phone_Number));
    }
}
