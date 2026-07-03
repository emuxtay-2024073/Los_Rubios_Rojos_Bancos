namespace AuthService.Application.DTOs;

public class UserListDto
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Dpi { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsDisabled { get; set; }
    public bool HasDisableRequest { get; set; }
    public string? DisableRequestReason { get; set; }
    public DateTime? DisableRequestedAt { get; set; }
    public string? DisabilityReason { get; set; }
    public DateTime? DisabledAt { get; set; }
    public bool EmailConfirmed { get; set; }
    public DateTime? LastLogin { get; set; }
    public DateTime CreatedAt { get; set; }
}
