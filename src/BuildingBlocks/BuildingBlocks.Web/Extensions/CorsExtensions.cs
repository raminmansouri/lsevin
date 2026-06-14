using BuildingBlocks.Core.Web.Extensions;
using BuildingBlocks.Web.Cors;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Web.Extensions;

/// <summary>
/// Provides extension methods for configuring and using CORS in an ASP.NET Core application.
/// </summary>
public static class CorsExtensions
{
    /// <summary>
    /// Adds CORS services to the web application builder.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection AddCustomCors(this IServiceCollection services)
    {
        services.AddValidatedOptions<CorsOptions>();

        services.AddCors();

        return services;
    }

    /// <summary>
    /// Uses the custom CORS middleware in the web application.
    /// </summary>
    /// <param name="app">The web application.</param>
    /// <returns>The updated web application.</returns>
    public static WebApplication UseCustomCors(this WebApplication app)
    {
        var options = app.Services.GetService<CorsOptions>();
        app.UseCors(p =>
        {
            if (options?.AllowedUrls is { } && options.AllowedUrls.Any())
            {
                p.WithOrigins(options.AllowedUrls.ToArray());
            }
            else
            {
                p.AllowAnyOrigin();
            }

            p.AllowAnyMethod();
            p.AllowAnyHeader();
        });
        return app;
    }
}
