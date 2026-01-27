using System.Text.Json;
using BuildingBlocks.Core.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BuildingBlocks.Core.Persistence.Converters;

/// <summary>
/// Value converter for converting LocalizedString to/from JSON for Entity Framework Core.
/// </summary>
public sealed class LocalizedStringJsonConverter : ValueConverter<LocalizedString?, string?>
{
    private static readonly JsonSerializerOptions _jsonSerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    /// <summary>
    /// Initializes a new instance of the <see cref="LocalizedStringJsonConverter"/> class.
    /// </summary>
    public LocalizedStringJsonConverter()
        : base(localizedString => ConvertToJson(localizedString), json => ConvertFromJson(json)) { }

    private static string? ConvertToJson(LocalizedString? localizedString)
    {
        if (localizedString is null)
        {
            return null;
        }

        return JsonSerializer.Serialize(localizedString.Translations, _jsonSerializerOptions);
    }

    private static LocalizedString? ConvertFromJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            var translations = JsonSerializer.Deserialize<Dictionary<string, string>>(json, _jsonSerializerOptions);
            if (translations is null || translations.Count == 0)
            {
                return null;
            }

            return LocalizedString.Create(translations);
        }
        catch (JsonException)
        {
            // Return null if JSON is invalid
            return null;
        }
    }
}
