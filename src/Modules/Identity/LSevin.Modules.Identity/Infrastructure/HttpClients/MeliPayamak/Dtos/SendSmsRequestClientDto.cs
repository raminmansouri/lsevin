using System.Text.Json.Serialization;

namespace LSevin.Modules.Identity.Infrastructure.HttpClients.MeliPayamak.Dtos;

public sealed record SendSmsRequestClientDto
{
    [JsonPropertyName("username")]
    public required string Username { get; init; }

    [JsonPropertyName("password")]
    public required string Password { get; init; }

    [JsonPropertyName("text")]
    public required string Text { get; init; }

    [JsonPropertyName("to")]
    public required string To { get; init; }

    [JsonPropertyName("bodyId")]
    public required long BodyId { get; init; }
}
