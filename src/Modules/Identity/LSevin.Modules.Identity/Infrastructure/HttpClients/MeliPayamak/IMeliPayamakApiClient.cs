using BuildingBlocks.Core.ResultPattern;

namespace LSevin.Modules.Identity.Infrastructure.HttpClients.MeliPayamak;

public interface IMeliPayamakApiClient
{
    Task<Result<long>> SendSmsAsync(
        string toPhoneNumber,
        string message,
        CancellationToken cancellationToken = default
    );
}
