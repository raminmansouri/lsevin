using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Common;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using PhoneNumbers;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateServiceProvider;

internal sealed class UpdateServiceProviderCommandValidator : AbstractValidator<UpdateServiceProviderCommand>
{
    private static readonly PhoneNumberUtil _phoneNumberUtil = PhoneNumberUtil.GetInstance();

    public UpdateServiceProviderCommandValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        RuleFor(x => x.Name).ValidateLocalizedContent(CategoryResource.Service_Provider_Name);

        RuleFor(x => x.Description).ValidateLocalizedContent(CategoryResource.Service_Description);

        RuleFor(x => x.ContactEmail).ValidateEmail();

        RuleFor(user => user)
            .Must(user => _phoneNumberUtil.IsValidPhoneNumber(user.ContactPhone, user.CountryCode))
            .WithMessage(SharedResource.Validation_Error_Message.FormatWithStr(SharedResource.Phone_Number));

        RuleFor(x => x.Address).SetValidator(new AddressDtoValidator());

        RuleFor(x => x.ProviderTypeId).ValidateGuid(CategoryResource.Provider_Type);

        When(
            x => x.GradeId is not null,
            () =>
            {
                RuleFor(x => x.GradeId!.Value)
                    .MustBeValidEnumeration<UpdateServiceProviderCommand, ServiceProviderGrade>(
                        CategoryResource.Service_Provider_Grade
                    );
            }
        );
    }
}
