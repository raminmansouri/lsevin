using BuildingBlocks.Core.Messaging.Commands;

namespace LSevin.Modules.Identity.Identity.Features.SendOtp;

internal sealed record SendOtpCommand() : Command<SendOtpResponse>;
