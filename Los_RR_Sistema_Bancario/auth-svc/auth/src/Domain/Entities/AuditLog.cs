using System;

namespace AuthService.Domain.Entities
{
    public class AuditLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string Action { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public string IpAddress { get; set; } = string.Empty;

        public Guid? UserId { get; set; }
        public User? User { get; set; }
    }
}
