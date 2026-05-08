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
        public string PhoneNumber { get; set; } = string.Empty;
        public string Dpi { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public bool IsLocked { get; set; } = false; 
        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LastLogin { get; set; }
        public DateTime? LastPasswordChangeAt { get; set; }

        public bool EmailConfirmed { get; set; } = false;
        public string? VerificationToken { get; set; }
        public string? ResetToken { get; set; }
        public DateTime? ResetTokenExpires { get; set; }

        // --- DISABLE REQUEST & DISABILITY ---
        public bool HasDisableRequest { get; set; } = false;
        public string? DisableRequestReason { get; set; }
        public DateTime? DisableRequestedAt { get; set; }
        public bool IsDisabled { get; set; } = false;
        public string? DisabilityReason { get; set; }
        public DateTime? DisabledAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // --- RELACIONES ---
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        public ICollection<UserEmail>? UserEmails { get; set; }
        public ICollection<UserPasswordReset>? PasswordResets { get; set; }
        public UserProfile? Profile { get; set; }

        public string Role { get; set; } = "CLIENTE";

        public string MainRole => Role;
    }
}