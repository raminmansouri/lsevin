using BuildingBlocks.Core.ResultPattern;

namespace LSevin.Modules.Identity.Infrastructure.HttpClients.Whatsiplus;

public interface IWhatsplusApiClient
{
    Task<Result> SendWhatsAppMessageAsync(
        string phoneNumber,
        string message,
        CancellationToken cancellationToken = default
    );
}
