using System.Text.Json;
using BuildingBlocks.Core.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BuildingBlocks.Core.Persistence.Converters;

/// <summary>
/// Value converter for converting non-nullable LocalizedString to/from JSON for Entity Framework Core.
/// </summary>
public sealed class LocalizedStringNonNullableJsonConverter : ValueConverter<LocalizedString, string>
{
    private static readonly JsonSerializerOptions _jsonSerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    /// <summary>
    /// Initializes a new instance of the <see cref="LocalizedStringNonNullableJsonConverter"/> class.
    /// </summary>
    public LocalizedStringNonNullableJsonConverter()
        : base(localizedString => ConvertToJson(localizedString), json => ConvertFromJson(json)) { }

    private static string ConvertToJson(LocalizedString localizedString)
    {
        return JsonSerializer.Serialize(localizedString.Translations, _jsonSerializerOptions);
    }

    private static LocalizedString ConvertFromJson(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            // Return a default LocalizedString with empty English translation
            return LocalizedString.Create("en-US", string.Empty);
        }

        try
        {
            var translations = JsonSerializer.Deserialize<Dictionary<string, string>>(json, _jsonSerializerOptions);
            if (translations is null || translations.Count == 0)
            {
                // Return a default LocalizedString with empty English translation
                return LocalizedString.Create("en-US", string.Empty);
            }

            return LocalizedString.Create(translations);
        }
        catch (JsonException)
        {
            // Return a default LocalizedString with empty English translation if JSON is invalid
            return LocalizedString.Create("en-US", string.Empty);
        }
    }
}
