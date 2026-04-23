using System;
using System.Collections.Generic;
using System.Linq;

namespace AuthService.Domain.Entities
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public bool IsLocked { get; set; } = false; 
        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LastLogin { get; set; }

        public bool EmailConfirmed { get; set; } = false;
        public string? VerificationToken { get; set; }
        public string? ResetToken { get; set; }
        public DateTime? ResetTokenExpires { get; set; }

        // --- RELACIONES ---
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

        public string MainRole => (UserRoles != null && UserRoles.Any()) 
            ? UserRoles.First().Role?.Name ?? "Cliente" 
            : "Cliente";
    }
}