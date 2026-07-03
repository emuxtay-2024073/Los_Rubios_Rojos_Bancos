namespace AuthService.Domain.Entities;

public class UserEmail
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool IsVerified { get; set; } = false;
    public string? VerificationToken { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Relación
    public virtual User? User { get; set; }
}
