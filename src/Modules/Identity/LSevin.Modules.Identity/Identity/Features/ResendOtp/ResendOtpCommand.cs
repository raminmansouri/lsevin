using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Identity.Identity.Features.ResendOtp;

internal sealed record ResendOtpCommand(string PhoneNumber) : Command<ResendOtpResponse>;
