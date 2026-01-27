using System.Net;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Resiliency.Options;
using BuildingBlocks.Core.Web.Extensions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.Extensions.Options;
using Polly;
using Polly.CircuitBreaker;
using Polly.Retry;
using Polly.Timeout;
using Polly.Wrap;

namespace BuildingBlocks.Core.Resiliency.Extensions;

/// <summary>
/// Represents the resiliency settings.
/// </summary>
public static class ResiliencyPolicyExtensions
{
    /// <summary>
    /// Adds the custom resiliency.
    /// </summary>
    /// <param name="services">The services.</param>
    /// <param name="globalHttpClientResiliency">if set to <c>true</c> [global HTTP client resiliency].</param>
    /// <returns>The configured web services.</returns>
    public static IServiceCollection AddCustomResiliency(
        this IServiceCollection services,
        bool globalHttpClientResiliency = true
    )
    {
        services.AddValidatedOptions<PolicyOptions>(nameof(PolicyOptions));

        // `AsyncPolicyWrap<HttpResponseMessage>` can be injected in clients and can be reused.
        services.AddSingleton<AsyncPolicyWrap<HttpResponseMessage>>(sp =>
        {
            var policyOptions = sp.GetRequiredService<IOptions<PolicyOptions>>().Value;
            Guard.Against.Null(policyOptions, nameof(PolicyOptions));

            var retryPolicy = Policy
                .Handle<HttpRequestException>()
                .OrResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
                .RetryAsync(policyOptions.RetryPolicyOptions.Count);

            // HttpClient itself will still enforce its own timeout, which is 100 seconds by default. To fix this issue, you need to set the HttpClient.Timeout property to match or exceed the timeout configured in Polly's policy.
            var timeoutPolicy = Policy.TimeoutAsync(
                policyOptions.TimeoutPolicyOptions.TimeoutInSeconds,
                TimeoutStrategy.Pessimistic
            );

            // at any given time there will 3 parallel requests execution for specific service call and another 6 requests for other services can be in the queue. So that if the response from customer service is delayed or blocked then we don’t use too many resources
            var bulkheadPolicy = Policy.BulkheadAsync<HttpResponseMessage>(3, 6);

            // https://github.com/App-vNext/Polly#handing-return-values-and-policytresult
            var circuitBreakerPolicy = Policy
                .Handle<HttpRequestException>()
                .OrResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
                .CircuitBreakerAsync(
                    policyOptions.RetryPolicyOptions.Count + 1,
                    TimeSpan.FromSeconds(policyOptions.CircuitBreakerPolicyOptions.DurationOfBreak)
                );

            var combinedPolicy = Policy.WrapAsync(retryPolicy, circuitBreakerPolicy, bulkheadPolicy);

            var finalPolicy = combinedPolicy.WrapAsync(timeoutPolicy);

            return finalPolicy;
        });

        services.AddSingleton<AsyncPolicyWrap>(sp =>
        {
            var policyOptions = sp.GetRequiredService<IOptions<PolicyOptions>>().Value;
            Guard.Against.Null(policyOptions, nameof(PolicyOptions));

            // Retry policy
            var retryPolicy = Policy.Handle<HttpRequestException>().RetryAsync(policyOptions.RetryPolicyOptions.Count);

            // Timeout policy
            var timeoutPolicy = Policy.TimeoutAsync(
                policyOptions.TimeoutPolicyOptions.TimeoutInSeconds,
                TimeoutStrategy.Pessimistic
            );

            // Bulkhead policy
            var bulkheadPolicy = Policy.BulkheadAsync(3, 6);

            // Circuit breaker policy
            var circuitBreakerPolicy = Policy
                .Handle<HttpRequestException>()
                .CircuitBreakerAsync(
                    policyOptions.CircuitBreakerPolicyOptions.ExceptionsAllowedBeforeBreaking,
                    TimeSpan.FromSeconds(policyOptions.CircuitBreakerPolicyOptions.DurationOfBreak)
                );

            // Combine policies
            var combinedPolicy = Policy.WrapAsync(retryPolicy, circuitBreakerPolicy, bulkheadPolicy);

            var finalPolicy = combinedPolicy.WrapAsync(timeoutPolicy);

            return finalPolicy;
        });

        if (globalHttpClientResiliency)
        {
            // https://learn.microsoft.com/en-us/dotnet/core/resilience/http-resilience
            // set resiliency globally on clients
            services.ConfigureHttpClientDefaults(httpClientBuilder =>
            {
                // add a default ResilienceHandler with `AddResilienceHandler` "standard" as name of handler
                httpClientBuilder
                    .AddStandardResilienceHandler()
                    .Configure(
                        (cfg, sp) =>
                        {
                            // resiliency using `Microsoft.Extensions.Http.Resilience`
                            // https://learn.microsoft.com/en-us/dotnet/core/resilience/
                            // https://learn.microsoft.com/en-us/dotnet/core/resilience/http-resilience
                            var policyOptions = sp.GetRequiredService<IOptions<PolicyOptions>>().Value;
                            Guard.Against.Null(policyOptions, nameof(PolicyOptions));

                            cfg.AttemptTimeout = new HttpTimeoutStrategyOptions
                            {
                                Timeout = TimeSpan.FromSeconds(policyOptions.TimeoutPolicyOptions.TimeoutInSeconds),
                            };

                            cfg.TotalRequestTimeout = new HttpTimeoutStrategyOptions
                            {
                                Timeout = TimeSpan.FromSeconds(policyOptions.TimeoutPolicyOptions.TimeoutInSeconds),
                            };

                            cfg.Retry = new HttpRetryStrategyOptions
                            {
                                BackoffType = DelayBackoffType.Exponential,
                                MaxRetryAttempts = policyOptions.RetryPolicyOptions.Count,
                                UseJitter = true,
                            };

                            cfg.CircuitBreaker = new HttpCircuitBreakerStrategyOptions
                            {
                                SamplingDuration = TimeSpan.FromSeconds(
                                    policyOptions.CircuitBreakerPolicyOptions.SamplingDuration
                                ), // Ensure this is >= 2 * TimeoutInSeconds
                                BreakDuration = TimeSpan.FromSeconds(
                                    policyOptions.CircuitBreakerPolicyOptions.DurationOfBreak
                                ),
                                MinimumThroughput = policyOptions
                                    .CircuitBreakerPolicyOptions
                                    .ExceptionsAllowedBeforeBreaking,
                                ShouldHandle = static args =>
                                    ValueTask.FromResult(
                                        args
                                            is {
                                                Outcome.Result.StatusCode: HttpStatusCode.RequestTimeout
                                                    or HttpStatusCode.TooManyRequests
                                            }
                                    ),
                            };
                        }
                    );
            });
        }

        // https://learn.microsoft.com/en-us/dotnet/core/resilience/?tabs=dotnet-cli#build-a-resilience-pipeline
        services.AddResiliencePipeline(
            nameof(ResiliencyType.Shared),
            static (pipelineBuilder, ctx) =>
            {
                var policyOptions = ctx.ServiceProvider.GetRequiredService<IOptions<PolicyOptions>>().Value;
                Guard.Against.Null(policyOptions, nameof(PolicyOptions));

                // See: https://www.pollydocs.org/strategies/retry.html
                pipelineBuilder.AddRetry(
                    new RetryStrategyOptions
                    {
                        BackoffType = DelayBackoffType.Exponential,
                        MaxRetryAttempts = policyOptions.RetryPolicyOptions.Count,
                        UseJitter = true,
                    }
                );

                // See: https://www.pollydocs.org/strategies/circuit-breaker.html
                pipelineBuilder.AddCircuitBreaker(
                    new CircuitBreakerStrategyOptions
                    {
                        BreakDuration = TimeSpan.FromSeconds(policyOptions.CircuitBreakerPolicyOptions.DurationOfBreak),
                        SamplingDuration = TimeSpan.FromSeconds(
                            policyOptions.CircuitBreakerPolicyOptions.SamplingDuration
                        ),
                        FailureRatio = 0.2,
                        MinimumThroughput = policyOptions.CircuitBreakerPolicyOptions.ExceptionsAllowedBeforeBreaking,
                    }
                );

                // See: https://www.pollydocs.org/strategies/timeout.html
                pipelineBuilder.AddTimeout(TimeSpan.FromSeconds(policyOptions.TimeoutPolicyOptions.TimeoutInSeconds));
            }
        );

        return services;
    }

    /// <summary>
    /// Configures the standard resilience handler.
    /// </summary>
    /// <param name="httpClientBuilder">The HTTP client builder.</param>
    /// <returns>The configured HTTP client builder.</returns>
    public static IHttpClientBuilder ConfigureStandardResilienceHandler(this IHttpClientBuilder httpClientBuilder)
    {
        httpClientBuilder
            .AddStandardResilienceHandler()
            .Configure(
                (cfg, sp) =>
                {
                    // resiliency using `Microsoft.Extensions.Http.Resilience`
                    // https://learn.microsoft.com/en-us/dotnet/core/resilience/
                    // https://learn.microsoft.com/en-us/dotnet/core/resilience/http-resilience
                    var policyOptions = sp.GetRequiredService<IOptions<PolicyOptions>>().Value;
                    Guard.Against.Null(policyOptions, nameof(PolicyOptions));

                    cfg.AttemptTimeout = new HttpTimeoutStrategyOptions
                    {
                        Timeout = TimeSpan.FromSeconds(policyOptions.TimeoutPolicyOptions.TimeoutInSeconds),
                    };

                    cfg.TotalRequestTimeout = new HttpTimeoutStrategyOptions
                    {
                        Timeout = TimeSpan.FromSeconds(policyOptions.TimeoutPolicyOptions.TimeoutInSeconds),
                    };

                    cfg.Retry = new HttpRetryStrategyOptions
                    {
                        BackoffType = DelayBackoffType.Exponential,
                        MaxRetryAttempts = policyOptions.RetryPolicyOptions.Count,
                        UseJitter = true,
                    };

                    cfg.CircuitBreaker = new HttpCircuitBreakerStrategyOptions
                    {
                        SamplingDuration = TimeSpan.FromSeconds(
                            policyOptions.CircuitBreakerPolicyOptions.SamplingDuration
                        ), // Ensure this is >= 2 * TimeoutInSeconds
                        BreakDuration = TimeSpan.FromSeconds(policyOptions.CircuitBreakerPolicyOptions.DurationOfBreak),
                        MinimumThroughput = policyOptions.CircuitBreakerPolicyOptions.ExceptionsAllowedBeforeBreaking,
                        ShouldHandle = static args =>
                            ValueTask.FromResult(
                                args
                                    is {
                                        Outcome.Result.StatusCode: HttpStatusCode.RequestTimeout
                                            or HttpStatusCode.TooManyRequests
                                    }
                            ),
                    };
                }
            );

        return httpClientBuilder;
    }

    /// <summary>
    /// Configures the default resilience handler.
    /// </summary>
    /// <param name="httpClientBuilder">The HTTP client builder.</param>
    /// <returns>The configured HTTP client builder.</returns>
    public static IHttpClientBuilder ConfigureDefaultResilienceHandler(this IHttpClientBuilder httpClientBuilder)
    {
        // https://learn.microsoft.com/en-us/dotnet/core/resilience/http-resilience?tabs=dotnet-cli#add-custom-resilience-handlers
        httpClientBuilder.AddResilienceHandler(
            nameof(ResiliencyType.Custom),
            (pipelineBuilder, ctx) =>
            {
                var policyOptions = ctx.ServiceProvider.GetRequiredService<IOptions<PolicyOptions>>().Value;
                Guard.Against.Null(policyOptions, nameof(PolicyOptions));

                // See: https://www.pollydocs.org/strategies/retry.html
                pipelineBuilder.AddRetry(
                    new HttpRetryStrategyOptions
                    {
                        BackoffType = DelayBackoffType.Exponential,
                        MaxRetryAttempts = policyOptions.RetryPolicyOptions.Count,
                        UseJitter = true,
                    }
                );

                // See: https://www.pollydocs.org/strategies/circuit-breaker.html
                pipelineBuilder.AddCircuitBreaker(
                    new HttpCircuitBreakerStrategyOptions
                    {
                        BreakDuration = TimeSpan.FromSeconds(policyOptions.CircuitBreakerPolicyOptions.DurationOfBreak),
                        SamplingDuration = TimeSpan.FromSeconds(
                            policyOptions.CircuitBreakerPolicyOptions.SamplingDuration
                        ),
                        FailureRatio = 0.2,
                        MinimumThroughput = policyOptions.CircuitBreakerPolicyOptions.ExceptionsAllowedBeforeBreaking,
                        ShouldHandle = static args =>
                            ValueTask.FromResult(
                                args
                                    is {
                                        Outcome.Result.StatusCode: HttpStatusCode.RequestTimeout
                                            or HttpStatusCode.TooManyRequests
                                    }
                            ),
                    }
                );

                // See: https://www.pollydocs.org/strategies/timeout.html
                pipelineBuilder.AddTimeout(TimeSpan.FromSeconds(policyOptions.TimeoutPolicyOptions.TimeoutInSeconds));
            }
        );

        return httpClientBuilder;
    }
}
