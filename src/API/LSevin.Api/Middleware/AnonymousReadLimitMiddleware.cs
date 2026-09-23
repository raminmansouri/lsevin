using System.Security.Cryptography;
using System.Text;
using StackExchange.Redis;

namespace LSevin.Api.Middleware;

/// <summary>Limits anonymous API reads across all API replicas using one Redis counter.</summary>
public sealed class AnonymousReadLimitMiddleware(RequestDelegate next, IConnectionMultiplexer redis, ILogger<AnonymousReadLimitMiddleware> logger)
{
    private const int RequestsPerMinute = 180;
    private const string CounterScript = "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], 60) end; return count";

    public async Task InvokeAsync(HttpContext context)
    {
        if (!HttpMethods.IsGet(context.Request.Method)
            || !context.Request.Path.StartsWithSegments("/api/v1")
            || context.User.Identity?.IsAuthenticated == true)
        {
            await next(context);
            return;
        }

        // Caddy replaces X-Forwarded-For with the actual peer address before proxying.
        var clientIp = context.Request.Headers["X-Forwarded-For"].ToString().Split(',')[0].Trim();
        if (clientIp.Length == 0)
        {
            clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        var identity = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(clientIp)));
        var key = (RedisKey)$"anonymous-read:{identity}";
        try
        {
            var count = (long)await redis.GetDatabase().ScriptEvaluateAsync(CounterScript, [key]);
            if (count > RequestsPerMinute)
            {
                logger.LogWarning("Anonymous API read limit exceeded for client {ClientHash}", identity[..12]);
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.Headers.RetryAfter = "60";
                return;
            }
        }
        catch (RedisException exception)
        {
            // Keep public pages usable during a cache outage; the local limiter still runs.
            logger.LogError(exception, "Shared anonymous read limiter unavailable");
        }

        await next(context);
    }
}
