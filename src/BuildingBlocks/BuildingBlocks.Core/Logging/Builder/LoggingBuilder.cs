using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Core.Logging.Builder;

/// <summary>
/// Represents the logging builder.
/// </summary>
public class LoggingBuilder(IServiceCollection services) : ILoggingBuilder
{
    /// <summary>
    /// Gets the service collection.
    /// </summary>
    public IServiceCollection Services { get; } = services;
}
