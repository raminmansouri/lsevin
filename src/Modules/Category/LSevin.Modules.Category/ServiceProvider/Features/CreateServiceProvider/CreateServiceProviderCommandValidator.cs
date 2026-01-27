using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation;
using BuildingBlocks.Validation.Common;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Constants;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using PhoneNumbers;

namespace LSevin.Modules.Category.ServiceProvider.Features.CreateServiceProvider;

internal sealed class CreateServiceProviderCommandValidator : AbstractValidator<CreateServiceProviderCommand>
{
    private static readonly PhoneNumberUtil _phoneNumberUtil = PhoneNumberUtil.GetInstance();

    public CreateServiceProviderCommandValidator()
    {
        RuleFor(x => x.Name).ValidateLocalizedContent(CategoryResource.Service_Name);

        RuleFor(x => x.Description).ValidateLocalizedContent(CategoryResource.Service_Description);

        RuleFor(x => x.ContactEmail).ValidateEmail();

        RuleFor(x => x.Address).SetValidator(new AddressDtoValidator());

        RuleFor(x => x.ProviderTypeId).ValidateGuid(CategoryResource.Provider_Type);

        When(
            x => x.GradeId is not null,
            () =>
            {
                RuleFor(x => x.GradeId!.Value)
                    .MustBeValidEnumeration<CreateServiceProviderCommand, ServiceProviderGrade>(
                        CategoryResource.Service_Provider_Grade
                    );
            }
        );

        RuleFor(user => user)
            .Must(user => _phoneNumberUtil.IsValidPhoneNumber(user.ContactPhone, user.CountryCode))
            .WithMessage(SharedResource.Validation_Error_Message.FormatWithStr(SharedResource.Phone_Number));
    }
}
