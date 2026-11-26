using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.FileUpload.Services;

/// <summary>
/// Short-lived signed links for private files (object keys under <c>Private/</c>).
/// </summary>
/// <remarks>
/// A link is <c>/files/Private/…?exp=&lt;unix seconds&gt;&amp;sig=&lt;base64url HMAC-SHA256&gt;</c>, where the
/// HMAC covers <c>"&lt;key&gt;\n&lt;exp&gt;"</c> with <see cref="Options.FileUploadOptions.PrivateLinkSecret"/>.
/// The web app and the provider portal sign with the same secret after their own permission
/// check; this side only verifies. Links may live at most <see cref="MaxLifetime"/>, so one
/// copied into a chat or a log stops working within minutes.
/// </remarks>
public static class PrivateFileLink
{
    public const string Prefix = "Private/";

    public static readonly TimeSpan MaxLifetime = TimeSpan.FromMinutes(15);

    public static bool IsPrivateKey(string key) => key.StartsWith(Prefix, StringComparison.Ordinal);

    public static bool IsValid(string key, IQueryCollection query, string secret, DateTimeOffset now)
    {
        if (string.IsNullOrEmpty(secret))
        {
            return false;
        }

        var expText = query["exp"].ToString();
        var sigText = query["sig"].ToString();
        if (expText.Length == 0 || sigText.Length == 0)
        {
            return false;
        }

        if (!long.TryParse(expText, NumberStyles.None, CultureInfo.InvariantCulture, out var exp))
        {
            return false;
        }

        var expiresAt = DateTimeOffset.FromUnixTimeSeconds(exp);
        if (expiresAt <= now || expiresAt > now + MaxLifetime)
        {
            return false;
        }

        byte[] given;
        try
        {
            given = Convert.FromBase64String(ToStandardBase64(sigText));
        }
        catch (FormatException)
        {
            return false;
        }

        var expected = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret),
            Encoding.UTF8.GetBytes($"{key}\n{expText}")
        );
        return CryptographicOperations.FixedTimeEquals(given, expected);
    }

    private static string ToStandardBase64(string value)
    {
        var s = value.Replace('-', '+').Replace('_', '/');
        return (s.Length % 4) switch
        {
            2 => s + "==",
            3 => s + "=",
            _ => s,
        };
    }
}
