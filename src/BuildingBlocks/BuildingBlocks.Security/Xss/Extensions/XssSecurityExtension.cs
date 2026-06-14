using Ganss.Xss;

namespace BuildingBlocks.Security.Xss.Extensions;

/// <summary>
/// Provides a method for sanitizing HTML to prevent cross-site scripting (XSS) attacks.
/// </summary>
public static class XssSecurity
{
    /// <summary>
    /// Sanitizes the input text to remove any potentially harmful HTML content.
    /// </summary>
    /// <param name="text">The HTML text to sanitize.</param>
    /// <returns>The sanitized HTML text.</returns>
    public static string SanitizeText(this string text)
    {
        var htmlSanitizer = new HtmlSanitizer { AllowDataAttributes = true };
        return htmlSanitizer.Sanitize(text);
    }
}
