using Microsoft.EntityFrameworkCore;
using AuthService.Domain.Entities;


namespace AuthService.Persistence.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext()
        {
        }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> User { get; set; }
        public DbSet<Role> Role { get; set; }
        public DbSet<UserRole> UserRole { get; set; }
        public DbSet<RefreshToken> RefreshToken { get; set; }
        public DbSet<AuditLog> AuditLog { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.HasKey(ur => new { ur.UserId, ur.RoleId });

                entity.HasOne(ur => ur.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(ur => ur.UserId);

                entity.HasOne(ur => ur.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(ur => ur.RoleId);
            });

            // Seed de Roles con GUIDs
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = Guid.Parse("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"), Name = "Admin" },
                new Role { Id = Guid.Parse("b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e"), Name = "Cliente" },
                new Role { Id = Guid.Parse("c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f"), Name = "Cajero" },
                new Role { Id = Guid.Parse("d4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a"), Name = "Auditor" }
            );
        }
        

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseNpgsql("Host=127.0.0.1;Port=5436;Database=bancos_db;Username=RUBIOSR;Password=Bancos123!");
            }
        }
    }
}