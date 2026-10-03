using BuildingBlocks.Core.Domain.ValueObjects;
using Microsoft.Extensions.Options;

namespace LSevin.Modules.Identity.Identity.Services;

internal sealed class OtpBypassService(IOptions<OtpBypassOptions> options) : IOtpBypassService
{
    public bool TryGetFixedCode(PhoneNumber phoneNumber, out string? code)
    {
        code = null;
        var settings = options.Value;

        if (!settings.Enabled || string.IsNullOrEmpty(settings.Code))
            return false;

        var isBypassPhoneNumber = settings.PhoneNumbers.Any(p =>
            p.Value == phoneNumber.Value && string.Equals(p.CountryCode, phoneNumber.CountryCode, StringComparison.OrdinalIgnoreCase)
        );

        if (!isBypassPhoneNumber)
            return false;

        code = settings.Code;
        return true;
    }
}
