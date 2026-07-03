namespace AuthService.Application.DTOs;

public class UpdateUserRoleDto
{
    public Guid UserId { get; set; }
    public string RoleName { get; set; } = string.Empty;
}

public class UpdateUserRoleResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}
