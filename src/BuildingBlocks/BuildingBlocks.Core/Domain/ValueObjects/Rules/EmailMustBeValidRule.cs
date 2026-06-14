using System.Text.RegularExpressions;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Resources;

namespace BuildingBlocks.Core.Domain.ValueObjects.Rules;

/// <summary>
/// Represents a rule for validating an email address format.
/// </summary>
internal sealed partial class EmailMustBeValidRule(string email) : IBusinessRule
{
    /// <summary>
    /// The email regex pattern.
    /// </summary>
    private const string EmailRegexPattern =
        """^(?!\.)("([^"\r\\]|\\["\r\\])*"|([-a-z0-9!#$%&'*+/=?^_`{|}~]|(?<!\.)\.)*)(?<!\.)@[a-z0-9][\w\.-]*[a-z0-9]\.[a-z][a-z\.]*[a-z]$""";

    /// <summary>
    /// The email format regex.
    /// </summary>
    private static readonly Lazy<Regex> _emailFormatRegex = new(EmailRegex);

    /// <inheritdoc />
    public bool IsBroken() => !_emailFormatRegex.Value.IsMatch(email);

    /// <inheritdoc />
    public string Message => SharedResource.Validation_Error_Message.FormatWithStr(SharedResource.Email);

    /// <summary>
    /// Gets the email regex.
    /// </summary>
    /// <returns>The <see cref="Regex"/>.</returns>
    [GeneratedRegex(
        pattern: EmailRegexPattern,
        options: RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.ExplicitCapture,
        matchTimeoutMilliseconds: 1000,
        cultureName: "en-US"
    )]
    private static partial Regex EmailRegex();
}
