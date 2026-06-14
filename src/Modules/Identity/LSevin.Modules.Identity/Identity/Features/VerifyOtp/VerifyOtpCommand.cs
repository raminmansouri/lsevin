using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Identity.Identity.Features.VerifyOtp;

internal sealed record VerifyOtpCommand(string Code, string PhoneNumber) : Command<VerifyOtpResponse>;
