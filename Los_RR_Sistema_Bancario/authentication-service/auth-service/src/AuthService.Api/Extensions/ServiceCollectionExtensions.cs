using System;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using AuthService.Application.Interfaces;
using AuthService.Application.Services;
using AuthService.Application.Settings;
using AuthService.Domain.Interfaces;
using AuthService.Persistence.Data;
using AuthService.Persistence.Repositories;

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
    /// Agrega los servicios de Base de Datos (PostgreSQL)
    /// </summary>
    public static IServiceCollection AddDatabaseServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        return services;
    }

    /// <summary>
    /// Agrega y configura JWT Bearer Authentication y Políticas de Autorización
    /// </summary>
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration, bool isDevelopment)
    {
        var jwtSettings = configuration.GetSection("Jwt");
        if (!jwtSettings.Exists())
        {
            jwtSettings = configuration.GetSection("JwtSettings");
        }
        var securitySettings = configuration.GetSection("Security");

        var jwtKey = jwtSettings["Key"] ?? jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT Key no configurada");
        var jwtIssuer = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JWT Issuer no configurado");
        var jwtAudience = jwtSettings["Audience"] ?? throw new InvalidOperationException("JWT Audience no configurado");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = !isDevelopment;
                options.SaveToken = true;

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                    RoleClaimType = "role",
                    ClockSkew = TimeSpan.FromSeconds(
                        securitySettings?.GetValue<int>("ClockSkewSeconds") ?? 0
                    )
                };

                options.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                        {
                            context.Response.Headers.Append("Token-Expired", "true");
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("Admin", policy => policy.RequireRole("ADMIN"));
            options.AddPolicy("Cliente", policy => policy.RequireRole("CLIENTE"));
        });

        return services;
    }

    /// <summary>
    /// Agrega y configura políticas de CORS
    /// </summary>
    public static IServiceCollection AddCorsPolicies(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("CorsPolicy", policy =>
            {
                var allowedOrigins = configuration
                    .GetSection("Security:AllowedOrigins")
                    .Get<string[]>() ?? new[] { "http://localhost:4200", "http://localhost:3000" };

                policy.WithOrigins(allowedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });

            options.AddPolicy("AllowFrontend",
                policy =>
                {
                    policy
                        .WithOrigins(
                            "http://localhost:5173",
                            "http://localhost:5174",
                            "http://127.0.0.1:5173",
                            "http://127.0.0.1:5174"
                        )
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
        });

        return services;
    }

    /// <summary>
    /// Agrega y configura Swagger API
    /// </summary>
    public static IServiceCollection AddSwaggerSettings(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Sistema Bancario API",
                Version = "v1",
                Description = "API REST para sistema bancario seguro con autenticación JWT. " +
                              "Roles disponibles: CLIENTE (operaciones básicas), ADMIN (gestión completa)."
            });

            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Ingrese 'Bearer' [espacio] y luego su token. " +
                              "Para endpoints ADMIN, el usuario debe tener rol ADMIN."
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }

    /// <summary>
    /// Agrega los headers de seguridad a la aplicación
    /// </summary>

}
