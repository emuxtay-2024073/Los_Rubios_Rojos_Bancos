using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using AuthService.Api.Extensions;
using AuthService.Api.Middlewares;
using AuthService.Application.Settings;
using AuthService.Domain.Interfaces;
using AuthService.Persistence.Repositories;

// Deshabilitar el remapeo automático de claims de JWT al formato largo de Microsoft.
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

// Configuración de Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Warning);
builder.Logging.AddFilter("Program", LogLevel.Information);
builder.Logging.AddFilter("Microsoft.Hosting.Lifetime", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);

// Cargar y mapear variables de entorno (.env)
configuration.AddEnvConfiguration(builder.Environment.ContentRootPath);
configuration.MapEnvVariables();

// Registro de servicios en el contenedor DI
builder.Services.AddDatabaseServices(configuration);
builder.Services.Configure<SmtpSettings>(configuration.GetSection("SmtpSettings"));
builder.Services.AddJwtAuthentication(configuration, builder.Environment.IsDevelopment());
builder.Services.AddCorsPolicies(configuration);

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddAuthenticationServices();

builder.Services.AddControllers();
builder.Services.AddSwaggerSettings();

var app = builder.Build();

// Configuración del Pipeline HTTP (Middlewares)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sistema Bancario API v1");
    });
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Endpoint raíz
app.MapGet("/", () => new
{
    service = "Sistema Bancario API",
    version = "1.0.0",
    status = "running",
    timestamp = DateTime.UtcNow
}).AllowAnonymous().ExcludeFromDescription();

// Registro del log al iniciar la aplicación
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

// Inicialización de la base de datos (migraciones y seeding)
app.SeedDatabase();

// Iniciar servidor
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Sistema Bancario API iniciando...");
logger.LogInformation("Entorno: {Environment}", app.Environment.EnvironmentName);

app.Run();