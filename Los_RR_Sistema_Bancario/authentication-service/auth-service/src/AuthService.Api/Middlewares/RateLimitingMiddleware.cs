using System.Collections.Concurrent;
using System.Net;
using System.Text.Json;

namespace AuthService.Api.Middlewares;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;

    private static readonly ConcurrentDictionary<string, RateLimitEntry> Requests = new();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public RateLimitingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLower() ?? string.Empty;

        var (limit, windowSeconds, key) = ResolvePolicy(context, path);

        if (limit == 0)
        {
            await _next(context);
            return;
        }

        var now = DateTime.UtcNow;

        var entry = Requests.GetOrAdd(key, _ => new RateLimitEntry
        {
            Count = 0,
            WindowStart = now
        });

        lock (entry)
        {
            if ((now - entry.WindowStart).TotalSeconds > windowSeconds)
            {
                entry.Count = 0;
                entry.WindowStart = now;
            }

            entry.Count++;

            if (entry.Count > limit)
            {
                var retryAfter = windowSeconds - (int)(now - entry.WindowStart).TotalSeconds;

                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.ContentType = "application/json";
                context.Response.Headers["Retry-After"] = retryAfter.ToString();

                var response = new
                {
                    success = false,
                    message = "Demasiadas solicitudes. Intente nuevamente más tarde.",
                    errorCode = "429",
                    traceId = context.TraceIdentifier,
                    timestamp = DateTime.UtcNow
                };

                var json = JsonSerializer.Serialize(response, JsonOptions);

                context.Response.WriteAsync(json).GetAwaiter().GetResult();
                return;
            }
        }

        await _next(context);
    }

    private static (int limit, int windowSeconds, string key) ResolvePolicy(HttpContext context, string path)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var user = context.User?.Identity?.Name ?? "anonymous";

        if (path.StartsWith("/auth/login"))
            return (3, 60, $"login:{ip}");

        if (path.StartsWith("/auth/register"))
            return (1, 60, $"register:{ip}");

        if (path.StartsWith("/transactions"))
            return (10, 60, $"transactions:{user}");

        if (path.StartsWith("/accounts"))
            return (20, 60, $"accounts:{user}");

        return (0, 0, string.Empty);
    }

    private class RateLimitEntry
    {
        public int Count { get; set; }
        public DateTime WindowStart { get; set; }
    }
}