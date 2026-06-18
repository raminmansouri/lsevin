using BuildingBlocks.Core.FileUpload.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BuildingBlocks.Core.FileUpload.Services;

/// <summary>
/// Runs <see cref="ImageBackfillRunner"/> once on startup as a background job when
/// <see cref="ImageOptimizationOptions.RunBackfillOnStartup"/> is enabled. Because the
/// backfill is idempotent (already-optimized files are skipped), leaving the flag on is
/// harmless; turning it on, deploying, and turning it back off is the intended one-shot
/// usage. This is the "hosted background job" option — it never runs inside a request.
/// </summary>
internal sealed class ImageBackfillHostedService(
    ImageBackfillRunner runner,
    IOptions<ImageOptimizationOptions> options,
    ILogger<ImageBackfillHostedService> logger
) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.RunBackfillOnStartup)
        {
            return;
        }

        try
        {
            // Let the application finish starting before doing heavy I/O.
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            await runner.RunAsync(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // Shutting down — stop quietly.
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Image backfill hosted service failed.");
        }
    }
}
