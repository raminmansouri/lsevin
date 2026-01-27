using System;
using System.Text.Json.Serialization;

namespace LSevin.Modules.Identity.Infrastructure.HttpClients.MeliPayamak.Dtos;

public sealed record SendSmsResponseClientDto
{
    /// <summary>
    /// Gets the message ID (recId) as string.
    /// If successful, contains a long number (>15 digits).
    /// If failed, contains an error code (negative number or specific error codes).
    /// </summary>
    [JsonPropertyName("Value")]
    public string Value { get; init; } = string.Empty;

    /// <summary>
    /// Gets status code.
    /// 0 = Success,
    /// 1 = Success (Ok),
    /// -1 = Access denied,
    /// -2 = Number limit exceeded,
    /// -3 = Line not defined,
    /// -4 = Invalid bodyId,
    /// -5 = Text doesn't match template variables,
    /// 0 = Invalid username/password,
    /// 2 = Insufficient credit,
    /// 6 = System updating,
    /// 7 = Text contains filtered word,
    /// 35 = Number in blacklist (REST only).
    /// </summary>
    [JsonPropertyName("RetStatus")]
    public int StatusCode { get; init; }

    [JsonPropertyName("StrRetStatus")]
    public string StatusMessage { get; init; } = string.Empty;

    [JsonIgnore]
    public bool IsSuccess =>
        (StatusCode == 0 || StatusCode == 1 || StatusMessage.Equals("Ok", StringComparison.OrdinalIgnoreCase))
        && !string.IsNullOrEmpty(Value)
        && long.TryParse(Value, out _);

    [JsonIgnore]
    public long? MessageId => IsSuccess && long.TryParse(Value, out var id) ? id : null;
}
