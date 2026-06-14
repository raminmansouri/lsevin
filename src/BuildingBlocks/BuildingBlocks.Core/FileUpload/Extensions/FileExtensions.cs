using BuildingBlocks.Core.Configuration;
using BuildingBlocks.Core.FileUpload.Constants;
using BuildingBlocks.Core.FileUpload.Options;
using BuildingBlocks.Core.FileUpload.Services;
using BuildingBlocks.Core.Web.Extensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

namespace BuildingBlocks.Core.FileUpload.Extensions;

/// <summary>
/// Represents the file extensions.
/// </summary>
public static class FileExtensions
{
    /// <summary>
    /// Adds the file upload service to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> instance to add the service to.</param>
    /// <returns>The same <see cref="IServiceCollection"/> instance.</returns>
    public static IServiceCollection AddFileUploadService(this IServiceCollection services)
    {
        services.AddValidatedOptions<FileUploadOptions>();
        services.AddScoped<IFileService, FileService>();

        return services;
    }

    /// <summary>
    /// Adds the file upload service to the specified <see cref="IApplicationBuilder"/>.
    /// </summary>
    /// <param name="app">The <see cref="IApplicationBuilder"/> instance to add the service to.</param>
    /// <param name="configuration">The <see cref="IConfiguration"/> instance.</param>
    /// <param name="env">The <see cref="IWebHostEnvironment"/> instance.</param>
    /// <returns>The same <see cref="IApplicationBuilder"/> instance.</returns>
    public static IApplicationBuilder UseFileUploadService(
        this IApplicationBuilder app,
        IConfiguration configuration,
        IWebHostEnvironment env
    )
    {
        var options = configuration.GetSettings<FileUploadOptions>(nameof(FileUploadOptions));

        // Create the full path
        var uploadPath = Path.Combine(env.ContentRootPath, options.UploadDirectory);

        // Ensure the directory exists before creating FileProvider
        if (!Directory.Exists(uploadPath))
        {
            Directory.CreateDirectory(uploadPath);
        }

        app.UseStaticFiles(
            new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(uploadPath),
                RequestPath = FileConstants.FileRoute,
            }
        );

        return app;
    }
}
