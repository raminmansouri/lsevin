using System.Net;
using BuildingBlocks.Core.Resiliency.Options;
using BuildingBlocks.Core.Web.Extensions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace BuildingBlocks.Core.Resiliency.Extensions;

/// <summary>
/// Extension methods for the <see cref="IServiceCollection"/> class.
/// </summary>
public static class HttpClientExtensions
{
    /// <summary>
    /// Adds the custom HTTP client.
    /// </summary>
    /// <typeparam name="TClient">The type of the client.</typeparam>
    /// <typeparam name="TImplementation">The type of the implementation.</typeparam>
    /// <typeparam name="TClientOptions">The type of the client options.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="optionsKey">The options key.</param>
    /// <param name="configureClient">The configure client.</param>
    /// <returns>The configured service collection.</returns>
    public static IServiceCollection AddCustomHttpClient<TClient, TImplementation, TClientOptions>(
        this IServiceCollection services,
        string? optionsKey = null,
        Action<IServiceProvider, HttpClient, TClientOptions>? configureClient = null
    )
        where TClient : class
        where TImplementation : class, TClient
        where TClientOptions : HttpClientOptions, new()
    {
        // https://github.com/App-vNext/Polly/wiki/Polly-and-HttpClientFactory
        // https://github.com/App-vNext/Polly/wiki/PolicyRegistry
        services.AddValidatedOptions<TClientOptions>(optionsKey);

        services
            .AddHttpClient<TClient, TImplementation>()
            .ConfigureHttpClient(
                (serviceProvider, httpClient) =>
                {
                    var httpClientOptions = serviceProvider.GetRequiredService<IOptions<TClientOptions>>().Value;

                    var policyOptions = serviceProvider.GetRequiredService<IOptions<PolicyOptions>>().Value;

                    httpClient.BaseAddress = new Uri(httpClientOptions.BaseAddress);

                    httpClient.Timeout = TimeSpan.FromSeconds(policyOptions.TimeoutPolicyOptions.TimeoutInSeconds);

                    configureClient?.Invoke(serviceProvider, httpClient, httpClientOptions);
                }
            )
            .ConfigurePrimaryHttpMessageHandler(_ => new HttpClientHandler()
            {
                AutomaticDecompression =
                    DecompressionMethods.Brotli | DecompressionMethods.Deflate | DecompressionMethods.GZip,
            });

        // .AddHttpMessageHandler(sp =>
        // {
        //     return new CorrelationIdDelegatingHandler(
        //         sp.GetService<ICorrelationContextAccessor>(),
        //         sp.GetService<IOptions<CorrelationIdOptions>>()
        //     );
        // };
        return services;
    }

    /// <summary>
    /// Adds the custom HTTP client.
    /// </summary>
    /// <typeparam name="TClient">The type of the client.</typeparam>
    /// <typeparam name="TImplementation">The type of the implementation.</typeparam>
    /// <typeparam name="TClientOptions">The type of the client options.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="configureClient">The configure client.</param>
    /// <returns>The configured service collection.</returns>
    public static IServiceCollection AddCustomHttpClient<TClient, TImplementation, TClientOptions>(
        this IServiceCollection services,
        Action<IServiceProvider, HttpClient>? configureClient = null
    )
        where TClient : class
        where TImplementation : class, TClient
        where TClientOptions : HttpClientOptions, new()
    {
        // https://github.com/App-vNext/Polly/wiki/Polly-and-HttpClientFactory
        // https://github.com/App-vNext/Polly/wiki/PolicyRegistry
        services.AddValidatedOptions<TClientOptions>();

        services
            .AddHttpClient<TClient, TImplementation>()
            .ConfigureHttpClient(
                (serviceProvider, httpClient) =>
                {
                    var httpClientOptions = serviceProvider.GetRequiredService<IOptions<TClientOptions>>().Value;

                    var policyOptions = serviceProvider.GetRequiredService<IOptions<PolicyOptions>>().Value;

                    httpClient.BaseAddress = new Uri(httpClientOptions.BaseAddress);

                    httpClient.Timeout = TimeSpan.FromSeconds(policyOptions.TimeoutPolicyOptions.TimeoutInSeconds);

                    configureClient?.Invoke(serviceProvider, httpClient);
                }
            )
            .ConfigurePrimaryHttpMessageHandler(_ => new HttpClientHandler()
            {
                AutomaticDecompression =
                    DecompressionMethods.Brotli | DecompressionMethods.Deflate | DecompressionMethods.GZip,
            });

        // .AddHttpMessageHandler(sp =>
        // {
        //     return new CorrelationIdDelegatingHandler(
        //         sp.GetService<ICorrelationContextAccessor>(),
        //         sp.GetService<IOptions<CorrelationIdOptions>>()
        //     );
        // };
        return services;
    }

    /// <summary>
    /// Adds the custom HTTP client.
    /// </summary>
    /// <typeparam name="TClient">The type of the client.</typeparam>
    /// <typeparam name="TClientOptions">The type of the client options.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="configureClient">The configure client.</param>
    /// <returns>The configured service collection.</returns>
    public static IServiceCollection AddCustomHttpClient<TClient, TClientOptions>(
        this IServiceCollection services,
        Action<IServiceProvider, HttpClient>? configureClient = null
    )
        where TClient : class
        where TClientOptions : HttpClientOptions, new()
    {
        return services.AddCustomHttpClient<TClient, TClient, TClientOptions>(configureClient);
    }

    /// <summary>
    /// Adds the custom HTTP client.
    /// </summary>
    /// <typeparam name="TClientOptions">The type of the client options.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="clientName">Name of the client.</param>
    /// <param name="configureClient">The configure client.</param>
    /// <returns>The configured service collection.</returns>
    public static IServiceCollection AddCustomHttpClient<TClientOptions>(
        this IServiceCollection services,
        string clientName,
        Action<IServiceProvider, HttpClient>? configureClient = null
    )
        where TClientOptions : HttpClientOptions, new()
    {
        // https://github.com/App-vNext/Polly/wiki/Polly-and-HttpClientFactory#step-2-configure-a-client-with-polly-policies-in-startup
        services.AddValidatedOptions<TClientOptions>();

        // https://learn.microsoft.com/en-us/aspnet/core/fundamentals/http-requests#named-clients
        // https://learn.microsoft.com/en-us/aspnet/core/fundamentals/http-requests?view=aspnetcore-7.0#createclient
        services
            .AddHttpClient(clientName)
            .ConfigureHttpClient(
                (sp, httpClient) =>
                {
                    var httpClientOptions = sp.GetRequiredService<IOptions<TClientOptions>>().Value;
                    var policyOptions = sp.GetRequiredService<IOptions<PolicyOptions>>().Value;
                    httpClient.BaseAddress = new Uri(httpClientOptions.BaseAddress);

                    httpClient.Timeout = TimeSpan.FromSeconds(policyOptions.TimeoutPolicyOptions.TimeoutInSeconds);

                    configureClient?.Invoke(sp, httpClient);
                }
            )
            .ConfigurePrimaryHttpMessageHandler(_ => new HttpClientHandler()
            {
                AutomaticDecompression =
                    DecompressionMethods.Brotli | DecompressionMethods.Deflate | DecompressionMethods.GZip,
            });

        return services;
    }
}
