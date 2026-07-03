using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;

namespace AuthService.Application.Services;

public class UserManagementService : IUserManagementService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHashService _passwordHashService;

    public UserManagementService(
        IUserRepository userRepository,
        IPasswordHashService passwordHashService)
    {
        _userRepository = userRepository;
        _passwordHashService = passwordHashService;
    }

    public async Task<bool> UpdateUserRoleAsync(Guid userId, string roleName)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        var roleId = roleName.Trim().ToLower() switch
        {
            "admin" => RoleConstants.RoleIds[RoleConstants.Admin],
            "cajero" => RoleConstants.RoleIds[RoleConstants.Cajero],
            "auditor" => RoleConstants.RoleIds[RoleConstants.Auditor],
            "cliente" => RoleConstants.RoleIds[RoleConstants.Client],
            "superadmin" => RoleConstants.RoleIds[RoleConstants.SuperAdmin],
            _ => RoleConstants.RoleIds[RoleConstants.Client]
        };

        user.Role = roleName.ToUpper();
        user.UpdatedAt = DateTime.UtcNow;

        // Actualizar relaciones de roles si existen
        if (user.UserRoles?.Any() == true)
        {
            user.UserRoles.Clear();
        }

        user.UserRoles = new List<UserRole> { new UserRole { RoleId = roleId, UserId = userId } };

        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> LockUserAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        user.IsLocked = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> UnlockUserAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        user.IsLocked = false;
        user.FailedLoginAttempts = 0;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> DeactivateUserAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> ActivateUserAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, string oldPassword, string newPassword)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        if (!_passwordHashService.VerifyPassword(oldPassword, user.PasswordHash))
            return false;

        user.PasswordHash = _passwordHashService.HashPassword(newPassword);
        user.LastPasswordChangeAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<UserDetailsDto?> GetUserDetailsAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return null;

        return new UserDetailsDto
        {
            Id = user.Id.ToString(),
            Email = user.Email,
            Role = user.MainRole,
            Username = user.Username,
            IsActive = user.IsActive,
            LastLogin = user.LastLogin
        };
    }

    public async Task<bool> RequestDisableAccountAsync(Guid userId, string reason)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        if (user.IsDisabled)
            return false; // Ya está deshabilitada

        user.HasDisableRequest = true;
        user.DisableRequestReason = reason;
        user.DisableRequestedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> ApproveDisableAccountAsync(Guid userId, string reason)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        user.IsDisabled = true;
        user.HasDisableRequest = false;
        user.DisabilityReason = reason;
        user.DisabledAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> RejectDisableRequestAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        user.HasDisableRequest = false;
        user.DisableRequestReason = null;
        user.DisableRequestedAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> ReenableAccountAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        user.IsDisabled = false;
        user.DisabilityReason = null;
        user.DisabledAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> UpdateUserAsync(Guid userId, string? email, string? phoneNumber, string? dpi)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return false;

        if (!string.IsNullOrWhiteSpace(email))
            user.Email = email;
        if (!string.IsNullOrWhiteSpace(phoneNumber))
            user.PhoneNumber = phoneNumber;
        if (!string.IsNullOrWhiteSpace(dpi))
            user.Dpi = dpi;

        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);
        return true;
    }
}
