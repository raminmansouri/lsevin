using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Resources;
using PhoneNumbers;

namespace BuildingBlocks.Core.Domain.ValueObjects.Rules;

/// <summary>
/// Represents a rule for validating a phone number format.
/// </summary>
internal sealed class PhoneNumberMustBeValidRule(string phoneNumber, string countryCode) : IBusinessRule
{
    /// <summary>
    /// The phone number util.
    /// </summary>
    private static readonly PhoneNumberUtil _phoneNumberUtil = PhoneNumberUtil.GetInstance();

    /// <inheritdoc />
    public bool IsBroken() => !_phoneNumberUtil.IsValidPhoneNumber(phoneNumber, countryCode);

    /// <inheritdoc />
    public string Message => SharedResource.Validation_Error_Message.FormatWithStr(SharedResource.Phone_Number);
}
