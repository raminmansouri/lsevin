using Amazon.Runtime;
using Amazon.S3;
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
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;

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

        // Image optimization (enforced server-side layer + disk backfill). Options bind
        // from the optional "ImageOptimizationOptions" section; defaults apply if absent.
        services.AddOptions<ImageOptimizationOptions>().BindConfiguration(nameof(ImageOptimizationOptions));
        services.AddSingleton<IImageOptimizer, ImageSharpImageOptimizer>();
        services.AddSingleton<ImageBackfillRunner>();
        services.AddHostedService<ImageBackfillHostedService>();

        // Where the bytes land is a configuration choice; how they are validated, optimized
        // and named is not. Both backends therefore share one IFileService and differ only
        // in the store behind it, so flipping FileUploadOptions:Backend — in either
        // direction — cannot change upload behaviour, only its destination.
        services.AddScoped<IFileObjectStore>(sp =>
            sp.GetRequiredService<IOptions<FileUploadOptions>>().Value.Backend switch
            {
                FileStorageBackend.Minio => ActivatorUtilities.CreateInstance<MinioFileObjectStore>(sp),
                _ => ActivatorUtilities.CreateInstance<LocalDiskFileObjectStore>(sp),
            }
        );

        // Registered unconditionally: the client is cheap to construct, holds no connection
        // until used, and registering it only for one backend would make the switch above
        // able to resolve into a missing dependency at request time rather than at startup.
        services.AddSingleton<IAmazonS3>(sp =>
        {
            var s3 = sp.GetRequiredService<IOptions<FileUploadOptions>>().Value.S3;

            var config = new AmazonS3Config
            {
                ForcePathStyle = s3.ForcePathStyle,
                AuthenticationRegion = s3.Region,
            };

            if (!string.IsNullOrWhiteSpace(s3.ServiceUrl))
            {
                config.ServiceURL = s3.ServiceUrl;
            }

            return new AmazonS3Client(new BasicAWSCredentials(s3.AccessKey, s3.SecretKey), config);
        });

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

                // Stored filenames are content-unique (IdGenerator), so optimized assets
                // can be cached aggressively and immutably by browsers/CDNs.
                OnPrepareResponse = context =>
                {
                    context.Context.Response.Headers[HeaderNames.CacheControl] =
                        "public,max-age=31536000,immutable";
                },
            }
        );

        return app;
    }
}
