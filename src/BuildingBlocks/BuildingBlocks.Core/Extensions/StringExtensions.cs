using System.ComponentModel;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace BuildingBlocks.Core.Extensions;

/// <summary>
/// Represents the string extensions.
/// </summary>
public static class StringExtensions
{
    /// <summary>
    /// Converts the input to the specified type.
    /// </summary>
    /// <typeparam name="T">The type to convert to.</typeparam>
    /// <param name="input">The input to convert.</param>
    /// <returns>The converted value.</returns>
    public static T? ConvertTo<T>(this object input)
    {
        return ConvertTo<T>(input.ToString() ?? string.Empty);
    }

    /// <summary>
    /// Converts the input to the specified type.
    /// </summary>
    /// <typeparam name="T">The type to convert to.</typeparam>
    /// <param name="input">The input to convert.</param>
    /// <returns>The converted value.</returns>
    public static T? ConvertTo<T>(this string input)
    {
        try
        {
            var converter = TypeDescriptor.GetConverter(typeof(T));
            return (T)converter.ConvertFromString(input)!;
        }
        catch (NotSupportedException)
        {
            return default;
        }
    }

    /// <summary>
    /// Indicates whether the input is a valid JSON.
    /// </summary>
    /// <param name="strInput">The input to check.</param>
    /// <returns>The result of the check.</returns>
    public static bool IsValidJson(this string strInput)
    {
        if (string.IsNullOrWhiteSpace(strInput))
        {
            return false;
        }

        strInput = strInput.Trim();
        if (
            (!strInput.StartsWith('{') || !strInput.EndsWith('}'))
            && (!strInput.StartsWith('[') || !strInput.EndsWith(']'))
        )
        {
            return false;
        }

        try
        {
            using (JsonDocument.Parse(strInput))
            {
                return true;
            }
        }
        catch (JsonException jex)
        {
            Console.WriteLine(jex.Message);
            return false;
        }
        catch (System.Exception ex)
        {
            Console.WriteLine(ex.ToString());
            return false;
        }
    }

    /// <summary>
    /// Formats the string with the specified arguments.
    /// </summary>
    /// <param name="format">The format string.</param>
    /// <param name="args">The arguments.</param>
    /// <returns>The formatted string.</returns>
    public static string FormatWithStr(this string format, params object[] args)
    {
        return string.Format(CultureInfo.InvariantCulture, format, args);
    }

    /// <summary>
    /// Replaces the old value with the new value.
    /// </summary>
    /// <param name="input">The input to replace.</param>
    /// <param name="oldValue">The old value to replace.</param>
    /// <param name="newValue">The new value to replace with.</param>
    /// <param name="comparison">The comparison type.</param>
    /// <returns>The replaced string.</returns>
    public static string ReplaceWithComparison(
        this string input,
        string oldValue,
        string newValue,
        StringComparison? comparison = null
    )
    {
        return input.Replace(oldValue, newValue, comparison ?? StringComparison.Ordinal);
    }

    /// <summary>
    /// Makes a hash of the input.
    /// </summary>
    /// <param name="input">The input to hash.</param>
    /// <returns>The hash of the input.</returns>
    public static string MakeHashSh256(this string input)
    {
        var inputBytes = Encoding.UTF8.GetBytes(input);
        var hashBytes = SHA256.HashData(inputBytes);

        var hex = new StringBuilder(hashBytes.Length * 2);
        foreach (var b in hashBytes)
        {
            hex.Append($"{b:x2}");
        }

        return hex.ToString();
    }

    /// <summary>
    /// Truncates the input string to the specified maximum length.
    /// </summary>
    /// <param name="input">The input string to truncate.</param>
    /// <param name="maxLength">The maximum length allowed.</param>
    /// <returns>The truncated string.</returns>
    public static string Truncate(this string? input, int maxLength)
    {
        if (string.IsNullOrEmpty(input) || input.Length <= maxLength)
        {
            return input ?? string.Empty;
        }

        return input[..maxLength];
    }
}
