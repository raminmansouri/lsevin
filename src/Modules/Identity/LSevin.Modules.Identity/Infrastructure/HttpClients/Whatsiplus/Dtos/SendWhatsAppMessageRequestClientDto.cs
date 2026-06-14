namespace LSevin.Modules.Identity.Infrastructure.HttpClients.Whatsiplus.Dtos;

public sealed record SendWhatsAppMessageRequestClientDto
{
    public required string PhoneNumber { get; init; }
    public required string Message { get; init; }
}
