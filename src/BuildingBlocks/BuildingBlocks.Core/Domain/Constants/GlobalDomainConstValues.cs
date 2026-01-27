using BuildingBlocks.Core.Persistence;

namespace BuildingBlocks.Core.Domain.Constants;

/// <summary>
/// Static class containing global domain constants.
/// </summary>
public static class GlobalDomainConstValues
{
    /// <summary>
    /// The minimum value of a natural numbers.
    /// </summary>
    public const int NaturalNumberMinue = 1;

    /// <summary>
    /// The maximum length of a contact's first name.
    /// </summary>
    public const int FirstNameMaxLength = EfConstants.Lenght.Medium;

    /// <summary>
    /// The maximum length of a contact's last name.
    /// </summary>
    public const int LastNameMaxLength = EfConstants.Lenght.Normal;

    /// <summary>
    /// The minimum length of a contact's email address.
    /// </summary>
    public const int EmailMinLength = 5;

    /// <summary>
    /// The maximum length of a contact's email address.
    /// </summary>
    public const int EmailMaxLength = EfConstants.Lenght.Large;

    /// <summary>
    /// The maximum length of a contact's phone country code.
    /// </summary>
    public const int PhoneCountryCodeMaxLength = 3;

    /// <summary>
    /// The minimum length of a contact's phone number.
    /// </summary>
    public const int PhoneNumberMinLength = 7;

    /// <summary>
    /// The maximum length of a contact's phone number.
    /// </summary>
    public const int PhoneNumberMaxLength = 20;

    /// <summary>
    /// The maximum length of a contact's phone number.
    /// </summary>
    public const int PasswordMinLength = 6;

    /// <summary>
    /// The maximum age of a user.
    /// </summary>
    public const int MaxAge = 100;
}
