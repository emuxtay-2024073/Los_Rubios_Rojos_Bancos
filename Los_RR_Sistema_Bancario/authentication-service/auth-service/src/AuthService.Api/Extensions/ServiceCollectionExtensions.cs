using AuthService.Application.Interfaces;
using AuthService.Application.Services;
using AuthService.Domain.Interfaces;
using AuthService.Persistence.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Api.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Agrega todos los servicios de autenticación al contenedor de DI
    /// </summary>
    public static IServiceCollection AddAuthenticationServices(this IServiceCollection services)
    {
        // Repositorios
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

        // Servicios de contraseña y tokens
        services.AddScoped<IPasswordHashService, PasswordHashService>();
        services.AddScoped<ITokenGeneratorService, TokenGeneratorService>();
        services.AddScoped<IJwtService, JwtService>();

        // Servicios de autenticación y refresh tokens
        services.AddScoped<IAuthService, Application.Services.AuthService>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();

        // Servicios de gestión de usuarios
        services.AddScoped<IUserManagementService, UserManagementService>();

        // Servicios de email
        services.AddScoped<IEmailService, EmailService>();

        return services;
    }

    /// <summary>
    /// Agrega los headers de seguridad a la aplicación
    /// </summary>
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
    {
        app.UseHsts();
        app.UseHttpsRedirection();

        return app;
    }
}
