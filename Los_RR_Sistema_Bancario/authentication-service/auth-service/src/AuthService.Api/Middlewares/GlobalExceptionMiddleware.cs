using System.Net;
using System.Security.Authentication;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using AuthService.Api.Models;
using AuthService.Application.Exceptions;

namespace AuthService.Api.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        ErrorResponse response;

        switch (exception)
        {
            case UserNotFoundException:
                response = CreateResponse(
                    HttpStatusCode.NotFound,
                    "Usuario no encontrado",
                    "El usuario solicitado no existe");
                break;

            case InvalidCredentialsException:
                _logger.LogWarning("Intento de login fallido. IP: {IP}",
                    context.Connection.RemoteIpAddress);

                response = CreateResponse(
                    HttpStatusCode.Unauthorized,
                    "Credenciales inválidas",
                    "Usuario o contraseña incorrectos");
                break;

            case AuthenticationException:
            case SecurityTokenException:
                _logger.LogWarning("Token inválido o expirado. IP: {IP}",
                    context.Connection.RemoteIpAddress);

                response = CreateResponse(
                    HttpStatusCode.Unauthorized,
                    "Token inválido",
                    "La autenticación no es válida o ha expirado");
                break;

            case UnauthorizedAccessException:
                _logger.LogWarning("Acceso sin permisos. Usuario: {User}",
                    context.User?.Identity?.Name ?? "Anónimo");

                response = CreateResponse(
                    HttpStatusCode.Forbidden,
                    "Acceso denegado",
                    "No tiene permisos para realizar esta operación");
                break;

            case InsufficientFundsException:
                response = CreateResponse(
                    HttpStatusCode.BadRequest,
                    "Fondos insuficientes",
                    "No cuenta con saldo suficiente para completar la operación");
                break;

            case ArgumentException:
                response = CreateResponse(
                    HttpStatusCode.BadRequest,
                    "Solicitud inválida",
                    "Los datos enviados no son válidos");
                break;

            default:
                _logger.LogError(exception,
                    "Error crítico no controlado. TraceId: {TraceId}",
                    context.TraceIdentifier);

                response = CreateResponse(
                    HttpStatusCode.InternalServerError,
                    "Error interno del servidor",
                    _env.IsDevelopment()
                        ? exception.Message
                        : "Ocurrió un error interno. Contacte al soporte.");
                break;
        }

        context.Response.StatusCode = response.StatusCode;

        var unified = new
        {
            success = false,
            message = response.Detail,
            errorCode = response.ErrorCode ?? response.StatusCode.ToString(),
            traceId = context.TraceIdentifier,
            timestamp = DateTime.UtcNow
        };

        var jsonResponse = JsonSerializer.Serialize(unified, JsonOptions);
        await context.Response.WriteAsync(jsonResponse);
    }

    private static ErrorResponse CreateResponse(HttpStatusCode statusCode, string title, string detail)
    {
        return new ErrorResponse
        {
            StatusCode = (int)statusCode,
            Title = title,
            Detail = detail,
            ErrorCode = ((int)statusCode).ToString()
        };
    }
}