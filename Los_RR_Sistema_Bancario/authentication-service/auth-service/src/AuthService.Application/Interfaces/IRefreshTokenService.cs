using AuthService.Domain.Entities;

namespace AuthService.Application.Interfaces;

public interface IRefreshTokenService
{
    Task<(bool IsValid, User? User)> ValidateRefreshTokenAsync(string token);
    Task<string> CreateRefreshTokenAsync(Guid userId);
    Task RevokeRefreshTokenAsync(Guid userId);
}
