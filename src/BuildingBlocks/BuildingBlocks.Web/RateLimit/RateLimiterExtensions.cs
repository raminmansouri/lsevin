using System.Net;
using System.Threading.RateLimiting;
using BuildingBlocks.Core.Configuration;
using Humanizer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Web.RateLimit;

/// <summary>
/// Extension methods for configuring rate limiters.
/// </summary>
public static class RateLimiterExtensions
{
    private const string RateLimiterPolicy = "fixed-window";

    /// <summary>
    /// Adds the custom rate limiter to the web application builder.
    /// </summary>
    /// <param name="service">The service collection.</param>
    /// <param name="configuration">The configuration.</param>
    /// <returns>The web application builder with the custom rate limiter added.</returns>
    public static IServiceCollection AddCustomRateLimit(this IServiceCollection service, IConfiguration configuration)
    {
        var rateLimitingOptions = configuration.BindOptions<RateLimitOptions>(nameof(RateLimitOptions));

        service.AddRateLimiter(opt =>
        {
            opt.OnRejected = (context, _) =>
            {
                var problemDetailsService =
                    context.HttpContext.RequestServices.GetRequiredService<IProblemDetailsService>();
                var problemDetails = new ProblemDetails
                {
                    Status = (int)HttpStatusCode.TooManyRequests,
                    Title = HttpStatusCode.TooManyRequests.Humanize(),
                };

                context.HttpContext.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                return problemDetailsService.WriteAsync(
                    new ProblemDetailsContext { HttpContext = context.HttpContext, ProblemDetails = problemDetails }
                );
            };

            opt.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.GetClientIp() ?? "N/A",
                    factory: _ =>
                    {
                        var permitLimit = rateLimitingOptions.Limit;
                        var periodInMs = rateLimitingOptions.PeriodInMs;

                        return new FixedWindowRateLimiterOptions()
                        {
                            PermitLimit = permitLimit,
                            Window = TimeSpan.FromMilliseconds(periodInMs),
                            QueueLimit = rateLimitingOptions.Limit,
                        };
                    }
                )
            );

            opt.AddPolicy(
                RateLimiterPolicy,
                httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: httpContext.User.Identity?.Name ?? httpContext.Request.Headers.Host.ToString(),
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            AutoReplenishment = true,
                            PermitLimit = rateLimitingOptions.Limit,
                            Window = TimeSpan.FromMilliseconds(rateLimitingOptions.PeriodInMs),
                            QueueLimit = rateLimitingOptions.QueueLimit,
                        }
                    )
            );
        });

        return service;
    }

    /// <summary>
    /// Adds the custom rate limiter to the application pipeline.
    /// </summary>
    /// <param name="app">The web application.</param>
    /// <returns>The web application with the custom rate limiter added.</returns>
    public static WebApplication UseCustomRateLimit(this WebApplication app)
    {
        app.UseRateLimiter();
        return app;
    }

    /// <summary>
    /// Gets the client IP address.
    /// </summary>
    /// <param name="httpContext">The HTTP context.</param>
    /// <returns>The client IP address.</returns>
    private static string? GetClientIp(this HttpContext httpContext)
    {
        var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        return !string.IsNullOrEmpty(forwardedFor)
            ? forwardedFor.Split(',')[0]
            : httpContext.Connection.RemoteIpAddress?.ToString();
    }
}
