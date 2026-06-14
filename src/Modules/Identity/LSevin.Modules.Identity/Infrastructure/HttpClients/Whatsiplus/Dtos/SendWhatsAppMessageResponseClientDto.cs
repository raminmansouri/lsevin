using System.Text.Json.Serialization;

namespace LSevin.Modules.Identity.Infrastructure.HttpClients.Whatsiplus.Dtos;

public sealed record SendWhatsAppMessageResponseClientDto
{
    [JsonPropertyName("messageId")]
    public long MessageId { get; init; }

    [JsonPropertyName("message")]
    public string Message { get; init; } = string.Empty;

    [JsonPropertyName("success")]
    public string Success { get; init; } = string.Empty;

    [JsonIgnore]
    public bool IsSuccess => Success.Equals("true", StringComparison.OrdinalIgnoreCase);
}
