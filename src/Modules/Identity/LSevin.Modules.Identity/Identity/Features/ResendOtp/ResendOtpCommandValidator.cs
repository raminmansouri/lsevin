using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Identity.Identity.Features.ResendOtp;

internal sealed class ResendOtpCommandValidator : AbstractValidator<ResendOtpCommand>
{
    public ResendOtpCommandValidator()
    {
        RuleFor(x => x.PhoneNumber)
            .ValidateText(SharedResource.Phone_Number, minLength: GlobalDomainConstValues.PhoneNumberMinLength);
    }
}
