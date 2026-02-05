using BuildingBlocks.Core.Web.Extensions;
using BuildingBlocks.Web.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Scalar.AspNetCore;

namespace BuildingBlocks.Web.OpenApi;

/// <summary>
/// Extension methods for OpenAPI.
/// </summary>
public static class OpenApiExtensions
{
    /// <summary>
    /// Adds OpenAPI services to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The configured service collection.</returns>
    public static IServiceCollection AddAspnetOpenApi(this IServiceCollection services)
    {
        services.AddConfigurationOptions<OpenApiOptions>(nameof(OpenApiOptions));
        string[] versions = [WebConstants.OpenApi.DefaultVersion];
        foreach (var description in versions)
        {
            services.AddOpenApi(
                description,
                options =>
                {
                    options.AddDocumentTransformer<OpenApiVersioningDocumentTransformer>();
                    options.AddDocumentTransformer<SecuritySchemeDocumentTransformer>();

                    options.AddOperationTransformer<OpenApiDefaultValuesOperationTransformer>();
                    options.AddSchemaTransformer<EnumSchemaTransformer>();
                    options.AddDocumentTransformer(
                        (document, _, _) =>
                        {
                            document.Servers = []; // ASPIRE proxy does not support servers
                            return Task.CompletedTask;
                        }
                    );
                }
            );
        }

        return services;
    }

    /// <summary>
    /// Adds OpenAPI services to the service collection.
    /// </summary>
    /// <param name="app">The WebApplication instance to configure.</param>
    /// <returns>The configured WebApplication instance.</returns>
    public static IApplicationBuilder UseAspnetOpenApi(this WebApplication app)
    {
        app.MapOpenApi();
        app.MapScalarApiReference(redocOptions => redocOptions.WithOpenApiRoutePattern("/openapi/{documentName}.json"));

        return app;
    }
}
