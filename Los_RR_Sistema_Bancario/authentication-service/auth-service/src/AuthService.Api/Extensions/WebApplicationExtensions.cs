using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using AuthService.Persistence.Data;
using AuthService.Domain.Constants;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Application.Interfaces;

namespace AuthService.Api.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication SeedDatabase(this WebApplication app)
    {
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

        return app;
    }
}
