using BuildingBlocks.Core.Domain.Services;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ResultPattern;

namespace LSevin.Modules.Identity.Identity.Services;

public interface IOtpSenderService : IDomainService
{
    Task<Result> SendOtpCodeAsync(
        PhoneNumber phoneNumber,
        string otpCode,
        CancellationToken cancellationToken = default
    );
}
