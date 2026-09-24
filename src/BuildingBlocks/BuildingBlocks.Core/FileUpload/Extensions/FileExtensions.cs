using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using BuildingBlocks.Core.Configuration;
using BuildingBlocks.Core.FileUpload.Constants;
using BuildingBlocks.Core.FileUpload.Options;
using BuildingBlocks.Core.FileUpload.Services;
using BuildingBlocks.Core.Web.Extensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
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
                FileStorageBackend.SeaweedFS => ActivatorUtilities.CreateInstance<MinioFileObjectStore>(sp),
                _ => ActivatorUtilities.CreateInstance<LocalDiskFileObjectStore>(sp),
            }
        );

        // Registered unconditionally: the client is cheap to construct, holds no connection
        // until used, and registering it only for one backend would make the switch above
        // able to resolve into a missing dependency at request time rather than at startup.
        services.AddSingleton<IAmazonS3>(sp =>
            CreateS3Client(sp.GetRequiredService<IOptions<FileUploadOptions>>().Value.S3)
        );

        // Fails startup when Backend is Minio but the bucket cannot be reached, instead of
        // letting every upload fail one request at a time. No-ops for the filesystem backend.
        services.AddHostedService<MinioStartupCheck>();

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

        FileStorageBackendGuard.Validate(options, env.IsProduction());

        if (options.Backend is FileStorageBackend.Minio or FileStorageBackend.SeaweedFS)
        {
            // Module services are isolated from the host request provider. The upload
            // store receives its client through module DI; this middleware owns a client
            // configured from the same validated settings for public reads.
            var client = CreateS3Client(options.S3);

            app.Use(async (context, next) =>
            {
                if (!context.Request.Path.StartsWithSegments(FileConstants.FileRoute, out var remainder))
                {
                    await next();
                    return;
                }

                if (!HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method))
                {
                    context.Response.StatusCode = StatusCodes.Status405MethodNotAllowed;
                    context.Response.Headers.Allow = "GET, HEAD";
                    return;
                }

                var key = remainder.Value?.TrimStart('/') ?? string.Empty;
                var isPublic = key.StartsWith("Categories/", StringComparison.Ordinal)
                    || key.StartsWith("ServiceProviders/", StringComparison.Ordinal);

                if (!isPublic)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return;
                }

                try
                {
                    using var response = await client.GetObjectAsync(options.S3.Bucket, key, context.RequestAborted);
                    context.Response.StatusCode = StatusCodes.Status200OK;
                    context.Response.ContentType = response.Headers.ContentType ?? "application/octet-stream";
                    context.Response.ContentLength = response.ContentLength;
                    context.Response.Headers[HeaderNames.CacheControl] = "public,max-age=31536000,immutable";

                    if (!HttpMethods.IsHead(context.Request.Method))
                    {
                        await response.ResponseStream.CopyToAsync(context.Response.Body, context.RequestAborted);
                    }
                }
                catch (AmazonS3Exception exception) when (exception.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                }

                return;
            });

            return app;
        }

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

    private static IAmazonS3 CreateS3Client(S3StorageOptions s3)
    {
        var config = new AmazonS3Config
        {
            ForcePathStyle = s3.ForcePathStyle,
            AuthenticationRegion = s3.Region,
        };

        if (!string.IsNullOrWhiteSpace(s3.ServiceUrl))
        {
            config.ServiceURL = s3.ServiceUrl;
        }
        else
        {
            config.RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(s3.Region);
        }

        return new AmazonS3Client(new BasicAWSCredentials(s3.AccessKey, s3.SecretKey), config);
    }
}
