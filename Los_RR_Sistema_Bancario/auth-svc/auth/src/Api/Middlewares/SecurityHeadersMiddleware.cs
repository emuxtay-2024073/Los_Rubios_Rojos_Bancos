using Microsoft.AspNetCore.Http;

namespace AuthService.Api.Middlewares;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            context.Response.Headers["X-Frame-Options"] = "DENY";
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
            context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000";
            context.Response.Headers["Content-Security-Policy"] = "default-src 'self'";
            context.Response.Headers["X-Permitted-Cross-Domain-Policies"] = "none";

            return Task.CompletedTask;
        });

        await _next(context);
    }
}