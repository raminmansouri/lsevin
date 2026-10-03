using BuildingBlocks.Core.Domain.Services;
using BuildingBlocks.Core.Domain.ValueObjects;

namespace LSevin.Modules.Identity.Identity.Services;

public interface IOtpBypassService : IDomainService
{
    /// <summary>
    /// Returns the configured fixed OTP code when <paramref name="phoneNumber"/> is one of the
    /// configured review/test phone numbers and the bypass is enabled.
    /// </summary>
    bool TryGetFixedCode(PhoneNumber phoneNumber, out string? code);
}
