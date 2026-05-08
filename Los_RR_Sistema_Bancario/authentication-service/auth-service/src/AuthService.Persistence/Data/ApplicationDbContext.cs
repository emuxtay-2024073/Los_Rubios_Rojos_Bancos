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
        public DbSet<UserEmail> UserEmail { get; set; }
        public DbSet<UserPasswordReset> UserPasswordReset { get; set; }
        public DbSet<UserProfile> UserProfile { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.HasIndex(u => u.Username).IsUnique();
                entity.HasIndex(u => u.Dpi).IsUnique();
            });

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

            // Configurar relaciones para nuevas entidades
            modelBuilder.Entity<UserEmail>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.User)
                    .WithMany(u => u.UserEmails)
                    .HasForeignKey(e => e.UserId);
                entity.HasIndex(e => e.Email).IsUnique();
            });

            modelBuilder.Entity<UserPasswordReset>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.User)
                    .WithMany(u => u.PasswordResets)
                    .HasForeignKey(e => e.UserId);
                entity.HasIndex(e => e.Token).IsUnique();
            });

            modelBuilder.Entity<UserProfile>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.User)
                    .WithOne(u => u.Profile)
                    .HasForeignKey<UserProfile>(e => e.UserId);
            });

            // Seed de Roles con GUIDs
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = Guid.Parse("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"), Name = "ADMIN" },
                new Role { Id = Guid.Parse("b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e"), Name = "CLIENTE" },
                new Role { Id = Guid.Parse("c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f"), Name = "CAJERO" },
                new Role { Id = Guid.Parse("d4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a"), Name = "AUDITOR" },
                new Role { Id = Guid.Parse("e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b"), Name = "SUPERADMIN" }
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