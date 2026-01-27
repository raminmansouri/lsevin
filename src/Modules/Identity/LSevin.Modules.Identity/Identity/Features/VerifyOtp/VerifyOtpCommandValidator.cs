using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Identity.Constants;

namespace LSevin.Modules.Identity.Identity.Features.VerifyOtp;

internal sealed class VerifyOtpCommandValidator : AbstractValidator<VerifyOtpCommand>
{
    public VerifyOtpCommandValidator()
    {
        RuleFor(x => x.Code)
            .ValidateText(SharedResource.Code, minLength: 6, maxLength: DomainConstValues.PhoneLoginCodeMaxLength);

        RuleFor(x => x.PhoneNumber)
            .ValidateText(SharedResource.Phone_Number, minLength: GlobalDomainConstValues.PhoneNumberMinLength);
    }
}
