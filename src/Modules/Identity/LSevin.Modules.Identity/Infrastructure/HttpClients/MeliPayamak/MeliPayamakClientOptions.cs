using BuildingBlocks.Core.Resiliency.Options;

namespace LSevin.Modules.Identity.Infrastructure.HttpClients.MeliPayamak;

public sealed class MeliPayamakClientOptions : HttpClientOptions
{
    public string Username { get; init; } = null!;
    public string Password { get; init; } = null!;
    public long BodyId { get; init; }
}
