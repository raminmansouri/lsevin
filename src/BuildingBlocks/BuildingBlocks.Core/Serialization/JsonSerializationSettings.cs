using System.Text.Json;
using BuildingBlocks.Core.Serialization.ContractResolvers;

namespace BuildingBlocks.Core.Serialization;

/// <summary>
/// Represents the JSON serialization settings.
/// </summary>
public static class JsonSerializationSettings
{
    /// <summary>
    /// Gets the JSON serialization settings with camel case formatting.
    /// </summary>
    /// <returns>The JSON serialization settings.</returns>
    public static readonly JsonSerializerOptions? WithIndentedFormatting = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new AllPropertiesJsonConverter<object>() },
    };

    /// <summary>
    /// Gets the JSON serialization settings with camel case formatting and type information.
    /// </summary>
    /// <returns>The JSON serialization settings.</returns>
    public static readonly JsonSerializerOptions CaseInsensitiveWithTypeInformation = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new AllPropertiesJsonConverter<object>() },
    };

    /// <summary>
    /// Gets the default JSON serialization settings.
    /// </summary>
    /// <returns>The JSON serialization settings.</returns>
    public static readonly JsonSerializerOptions DefaultJsonSerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new AllPropertiesJsonConverter<object>() },
    };
}
