using System.IO;
using System.Linq;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using AuthService.Api.Extensions;
using AuthService.Api.Middlewares;
using AuthService.Application.Interfaces;
using AuthService.Application.Settings;
using AuthService.Domain.Interfaces;
using AuthService.Persistence.Data;
using AuthService.Persistence.Repositories;
using AuthService.Domain.Constants;
using AuthService.Domain.Entities;
using Npgsql;

// Deshabilitar el remapeo automático de claims de JWT al formato largo de Microsoft.
// Sin esto, el claim "role" se convierte a "http://schemas.microsoft.com/.../role"
// y [Authorize(Roles = "ADMIN")] nunca coincide.
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultMapInboundClaims = false;
 
var builder = WebApplication.CreateBuilder(args);

var configuration = builder.Configuration;

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Warning);
builder.Logging.AddFilter("Program", LogLevel.Information);
builder.Logging.AddFilter("Microsoft.Hosting.Lifetime", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);

var dataProtectionKeysPath = Path.Combine(builder.Environment.ContentRootPath, "keys");
Directory.CreateDirectory(dataProtectionKeysPath);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath))
    .SetApplicationName("SistemaBancarioAuth");


// ============================================
// CONFIGURACIÓN DE BASE DE DATOS
// ============================================
// Configuración para PostgreSQL
// ============================================
// CONFIGURACIÓN DE JWT
// ============================================
var jwtSettings = configuration.GetSection("Jwt");
if (!jwtSettings.Exists())
{
    jwtSettings = configuration.GetSection("JwtSettings");
}
var securitySettings = configuration.GetSection("Security");

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port) && string.IsNullOrWhiteSpace(builder.Configuration["ASPNETCORE_URLS"]))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

static bool TryParseBoolEnv(string? value, out bool result)
{
    if (bool.TryParse(value, out result)) return true;
    if (string.IsNullOrWhiteSpace(value)) return false;
    return value.Trim().ToLowerInvariant() switch
    {
        "1" => result = true,
        "yes" => result = true,
        "y" => result = true,
        "on" => result = true,
        "true" => result = true,
        "0" => result = false,
        "no" => result = false,
        "n" => result = false,
        "off" => result = false,
        "false" => result = false,
        _ => false
    };
}

static string? FindDotEnvFile(string startPath)
{
    var dir = new DirectoryInfo(startPath);
    while (dir != null)
    {
        var file = Path.Combine(dir.FullName, ".env");
        if (File.Exists(file)) return file;
        dir = dir.Parent;
    }
    return null;
}

static void LoadDotEnvFile(string filePath)
{
    foreach (var rawLine in File.ReadAllLines(filePath))
    {
        var line = rawLine.Trim();
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) continue;
        var separatorIndex = line.IndexOf('=');
        if (separatorIndex <= 0) continue;
        var key = line[..separatorIndex].Trim();
        var value = line[(separatorIndex + 1)..].Trim();
        if (value.Length >= 2 &&
            ((value.StartsWith('"') && value.EndsWith('"')) ||
             (value.StartsWith('\'') && value.EndsWith('\''))))
        {
            value = value[1..^1];
        }
        if (string.IsNullOrWhiteSpace(key)) continue;
        Environment.SetEnvironmentVariable(key, value);
    }
}

static string NormalizePostgresConnectionString(string connectionString)
{
    var trimmed = connectionString.Trim();
    if (trimmed.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        trimmed.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        var uri = new Uri(trimmed);
        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(0) ?? string.Empty),
            Password = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(1) ?? string.Empty),
            SslMode = SslMode.Require
        };

        return builder.ConnectionString;
    }

    return trimmed;
}

var dotEnvFile = FindDotEnvFile(builder.Environment.ContentRootPath) ?? FindDotEnvFile(Directory.GetCurrentDirectory());
if (dotEnvFile != null)
{
    Console.WriteLine($"[EMAIL BANCARIO] Cargando variables de entorno desde {dotEnvFile}");
    LoadDotEnvFile(dotEnvFile);
}

string? GetEnv(string name) => Environment.GetEnvironmentVariable(name);
void MapEnv(string envKey, string configKey)
{
    var envValue = GetEnv(envKey);
    if (!string.IsNullOrWhiteSpace(envValue)) builder.Configuration[configKey] = envValue;
}

MapEnv("SMTP_HOST", "SmtpSettings:Host");
MapEnv("SMTP_PORT", "SmtpSettings:Port");
MapEnv("SMTP_USER", "SmtpSettings:Username");
MapEnv("SMTP_PASS", "SmtpSettings:Password");
MapEnv("SMTP_FROM", "SmtpSettings:FromEmail");
MapEnv("EMAIL_FROM", "SmtpSettings:FromEmail");
MapEnv("SMTP_FROM_NAME", "SmtpSettings:FromName");
MapEnv("EMAIL_FROM_NAME", "SmtpSettings:FromName");
MapEnv("SMTP_TIMEOUT", "SmtpSettings:Timeout");
MapEnv("SMTP_IGNORE_CERTIFICATE_ERRORS", "SmtpSettings:IgnoreCertificateErrors");
MapEnv("SMTP_USE_FALLBACK", "SmtpSettings:UseFallback");
MapEnv("FRONTEND_URL", "FrontendUrl");
MapEnv("DATABASE_URL", "ConnectionStrings:DefaultConnection");
MapEnv("SUPABASE_DB_CONNECTION", "ConnectionStrings:DefaultConnection");

var dbHost = GetEnv("DB_HOST");
if (!string.IsNullOrWhiteSpace(dbHost) &&
    string.IsNullOrWhiteSpace(GetEnv("DATABASE_URL")) &&
    string.IsNullOrWhiteSpace(GetEnv("SUPABASE_DB_CONNECTION")))
{
    var pgConnection = new NpgsqlConnectionStringBuilder
    {
        Host = dbHost,
        Database = GetEnv("DB_NAME") ?? "postgres",
        Username = GetEnv("DB_USER") ?? "postgres",
        Password = GetEnv("DB_PASSWORD") ?? string.Empty
    };

    if (int.TryParse(GetEnv("DB_PORT"), out var dbPort))
    {
        pgConnection.Port = dbPort;
    }

    if (Enum.TryParse<SslMode>(GetEnv("DB_SSL_MODE"), ignoreCase: true, out var sslMode))
    {
        pgConnection.SslMode = sslMode;
    }

    builder.Configuration["ConnectionStrings:DefaultConnection"] = pgConnection.ConnectionString;
}

var configuredConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrWhiteSpace(configuredConnectionString))
{
    builder.Configuration["ConnectionStrings:DefaultConnection"] =
        NormalizePostgresConnectionString(configuredConnectionString);
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var smtpEnabledValue = GetEnv("SMTP_ENABLED");
if (!string.IsNullOrWhiteSpace(smtpEnabledValue) && TryParseBoolEnv(smtpEnabledValue, out var smtpEnabled))
{
    builder.Configuration["SmtpSettings:Enabled"] = smtpEnabled.ToString();
}

var smtpSecureValue = GetEnv("SMTP_SECURE");
if (!string.IsNullOrWhiteSpace(smtpSecureValue) && TryParseBoolEnv(smtpSecureValue, out var smtpSecure))
{
    builder.Configuration["SmtpSettings:UseImplicitSsl"] = smtpSecure.ToString();
    builder.Configuration["SmtpSettings:EnableSsl"] = (!smtpSecure).ToString();
}

builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("SmtpSettings"));

var jwtKey = jwtSettings["Key"] ?? jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT Key no configurada");
var jwtIssuer = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JWT Issuer no configurado");
var jwtAudience = jwtSettings["Audience"] ?? throw new InvalidOperationException("JWT Audience no configurado");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
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
            // CAMBIO: Usa .Append en lugar de .Add para evitar ArgumentException
            context.Response.Headers.Append("Token-Expired", "true");
            
            // O TAMBIÉN PUEDES USAR EL INDEXADOR:
            // context.Response.Headers["Token-Expired"] = "true";
        }
        return Task.CompletedTask;
    }
};
    });


// ============================================
// POLÍTICAS DE AUTORIZACIÓN
// ============================================
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireRole("ADMIN"));
    options.AddPolicy("Cliente", policy => policy.RequireRole("CLIENTE"));
});

// ============================================
// REGISTRO DE SERVICIOS Y REPOSITORIOS
// ============================================
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddAuthenticationServices();

// ============================================
// CONFIGURACIÓN DE CORS
// ============================================
builder.Services.AddCors(options =>
{
    var configuredOrigins = configuration
        .GetSection("Security:AllowedOrigins")
        .Get<string[]>()
        ?? configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()
        ?? Array.Empty<string>();

    var envOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")
        ?? Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")
        ?? Environment.GetEnvironmentVariable("CORS_ORIGINS")
        ?? Environment.GetEnvironmentVariable("FRONTEND_URL")
        ?? Environment.GetEnvironmentVariable("CLIENT_URL");

    if (!string.IsNullOrWhiteSpace(envOrigins))
    {
        configuredOrigins = envOrigins
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToArray();
    }

    if (configuredOrigins.Length == 0)
    {
        configuredOrigins = new[]
        {
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174"
        };
    }

    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins(configuredOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });

    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins(configuredOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});

// ============================================
// CONTROLADORES Y SWAGGER
// ============================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
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

var app = builder.Build();
app.UseCors("CorsPolicy");

// Swagger se activa en Development automáticamente. En producción solo se activa si
// ENABLE_SWAGGER=true está definido explícitamente (por ejemplo, mientras se hace la entrega/demo).
// Quita esa variable cuando el sistema pase a operación real, para no exponer el mapa de la API.
var enableSwaggerInProd = TryParseBoolEnv(GetEnv("ENABLE_SWAGGER"), out var swaggerFlag) && swaggerFlag;
if (app.Environment.IsDevelopment() || enableSwaggerInProd)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sistema Bancario API v1");
    });
}

// HTTPS
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Middlewares de seguridad (ORDEN IMPORTANTE)
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

// CORS
app.UseCors("CorsPolicy");

// Autenticación y Autorización
app.UseAuthentication();
app.UseAuthorization();

// Controllers
app.MapControllers();

// Endpoint raíz
app.MapGet("/", () => new
{
    service = "Sistema Bancario API",
    version = "1.0.0",
    status = "running",
    timestamp = DateTime.UtcNow
}).AllowAnonymous().ExcludeFromDescription();

app.Lifetime.ApplicationStarted.Register(() =>
{
    var swaggerUrls = app.Urls
        .Where(url => url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        .Select(url => $"{url.TrimEnd('/')}/swagger")
        .ToArray();

    if (swaggerUrls.Length == 0)
    {
        Console.WriteLine("Swagger disponible en: http://localhost:5109/swagger");
        return;
    }

    foreach (var swaggerUrl in swaggerUrls)
    {
        Console.WriteLine($"Swagger disponible en: {swaggerUrl}");
    }
});

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var dbLogger = services.GetRequiredService<ILogger<Program>>();

        try
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            
            dbLogger.LogInformation("Verificando migraciones pendientes...");
 
            context.Database.Migrate(); 
            
            dbLogger.LogInformation("Base de datos inicializada correctamente");

            // Seed de roles si aún no existen
            var rolesCount = context.Role.Count();
            dbLogger.LogInformation("Roles en BD: {Count}", rolesCount);
            if (rolesCount == 0)
            {
                var rolesToAdd = RoleConstants.RoleIds.Select(kv => new Role
                {
                    Id = kv.Value,
                    Name = kv.Key,
                    Description = kv.Key
                }).ToList();

                context.Role.AddRange(rolesToAdd);
                context.SaveChanges();
                dbLogger.LogInformation("Se sembraron {Count} roles.", rolesToAdd.Count);
            }

            // Seed inicial SUPERADMIN en PostgreSQL si no existe
            var superAdminEmail = Environment.GetEnvironmentVariable("SUPER_ADMIN_EMAIL") ?? "superadmin@banco.com";
            var superAdminPassword = Environment.GetEnvironmentVariable("SUPER_ADMIN_PASSWORD") ?? "SuperAdmin123!";

            var existingSuperAdmin = context.User
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefault(u => u.Email == superAdminEmail ||
                                     u.Role == RoleConstants.SuperAdmin ||
                                     u.UserRoles.Any(ur => ur.RoleId == RoleConstants.RoleIds[RoleConstants.SuperAdmin]));

            if (existingSuperAdmin == null)
            {
                var passwordHashService = services.GetRequiredService<IPasswordHashService>();
                var newSuperAdmin = new User
                {
                    Email = superAdminEmail,
                    Username = "superadmin",
                    PasswordHash = passwordHashService.HashPassword(superAdminPassword),
                    EmailConfirmed = true,
                    IsActive = true,
                    Role = RoleConstants.SuperAdmin,
                    AccountType = "corriente",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    UserRoles = new List<UserRole>
                    {
                        new UserRole { RoleId = RoleConstants.RoleIds[RoleConstants.SuperAdmin] }
                    }
                };

                context.User.Add(newSuperAdmin);
                context.SaveChanges();
                dbLogger.LogInformation("Se creó el SUPERADMIN en PostgreSQL: {Email}", superAdminEmail);
                dbLogger.LogInformation("Contraseña inicial: {Password}", superAdminPassword);
            }
    }
    catch (Exception ex)
    {
        dbLogger.LogError(ex, "Error al conectar o inicializar la base de datos.");
    }
}

// ============================================
// INICIAR SERVIDOR
// ============================================
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Sistema Bancario API iniciando...");
logger.LogInformation("Entorno: {Environment}", app.Environment.EnvironmentName);

app.Run();