using AuthService.Application.DTOs;

namespace AuthService.Application.Interfaces;

public interface IUserManagementService
{
    Task<bool> UpdateUserRoleAsync(Guid userId, string roleName);
    Task<bool> LockUserAsync(Guid userId);
    Task<bool> UnlockUserAsync(Guid userId);
    Task<bool> DeactivateUserAsync(Guid userId);
    Task<bool> ActivateUserAsync(Guid userId);
    Task<bool> ChangePasswordAsync(Guid userId, string oldPassword, string newPassword);
    Task<UserDetailsDto?> GetUserDetailsAsync(Guid userId);
    
    // --- DISABLE REQUEST METHODS ---
    Task<bool> RequestDisableAccountAsync(Guid userId, string reason);
    Task<bool> ApproveDisableAccountAsync(Guid userId, string reason);
    Task<bool> RejectDisableRequestAsync(Guid userId);
    Task<bool> ReenableAccountAsync(Guid userId);
    Task<bool> UpdateUserAsync(Guid userId, string? email, string? phoneNumber, string? dpi);
}
