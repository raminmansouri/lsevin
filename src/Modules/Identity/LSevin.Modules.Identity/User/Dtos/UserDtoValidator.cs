using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using PhoneNumbers;

namespace LSevin.Modules.Identity.User.Dtos;

internal sealed class UserDtoValidator : AbstractValidator<IUserDto>
{
    private static readonly PhoneNumberUtil _phoneNumberUtil = PhoneNumberUtil.GetInstance();

    public UserDtoValidator()
    {
        RuleFor(r => r.FirstName).ValidateFirstName();
        RuleFor(r => r.LastName).ValidateLastName();
        RuleFor(r => r.UserName).NotEmpty().ValidateText(SharedResource.Username);
        RuleFor(r => r.Email).ValidateEmail();

        RuleFor(user => user)
            .Must(user => _phoneNumberUtil.IsValidPhoneNumber(user.PhoneNumber, user.PhoneNumberCountryCode))
            .WithMessage(SharedResource.Validation_Error_Message.FormatWithStr(SharedResource.Phone_Number));
    }
}
