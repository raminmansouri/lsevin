using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Web.Modules;

/// <summary>
/// Represents a module configuration.
/// </summary>
public interface IModuleDefinition
{
    /// <summary>
    /// Adds services to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/>.</param>
    /// <param name="configuration">The configuration.</param>
    /// <param name="environment">The environment.</param>
    void AddModuleServices(IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment);

    /// <summary>
    /// Configures the module.
    /// </summary>
    /// <param name="app">The <see cref="IApplicationBuilder"/>.</param>
    /// <param name="configuration">The configuration.</param>
    /// <param name="logger">The logger.</param>
    /// <param name="environment">The environment.</param>
    Task ConfigureModule(
        IApplicationBuilder app,
        IConfiguration configuration,
        ILogger logger,
        IWebHostEnvironment environment
    );

    /// <summary>
    /// Maps the endpoints.
    /// </summary>
    /// <param name="endpoints">The <see cref="IEndpointRouteBuilder"/>.</param>
    void MapEndpoints(IEndpointRouteBuilder endpoints);
}
