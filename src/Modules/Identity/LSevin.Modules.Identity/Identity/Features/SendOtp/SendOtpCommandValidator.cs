using FluentValidation;

namespace LSevin.Modules.Identity.Identity.Features.SendOtp;

internal sealed class SendOtpCommandValidator : AbstractValidator<SendOtpCommand>
{
    public SendOtpCommandValidator() { }
}
