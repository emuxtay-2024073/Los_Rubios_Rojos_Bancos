using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;

namespace AuthService.Application.Services;

public class RefreshTokenService : IRefreshTokenService
{
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IUserRepository _userRepository;

    public RefreshTokenService(
        IRefreshTokenRepository refreshTokenRepository,
        IUserRepository userRepository)
    {
        _refreshTokenRepository = refreshTokenRepository;
        _userRepository = userRepository;
    }

    public async Task<(bool IsValid, User? User)> ValidateRefreshTokenAsync(string token)
    {
        var refreshToken = await _refreshTokenRepository.GetByTokenAsync(token);
        
        if (refreshToken == null || refreshToken.Expires < DateTime.UtcNow || refreshToken.IsRevoked)
            return (false, null);

        var user = await _userRepository.GetByIdAsync(refreshToken.UserId);
        
        if (user == null || !user.IsActive)
            return (false, null);

        return (true, user);
    }

    public async Task<string> CreateRefreshTokenAsync(Guid userId)
    {
        // Revocar tokens existentes del usuario
        await RevokeRefreshTokenAsync(userId);

        var tokenValue = Guid.NewGuid().ToString();
        var refreshToken = new RefreshToken
        {
            UserId = userId,
            Token = tokenValue,
            Expires = DateTime.UtcNow.AddDays(SecurityConstants.RefreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        };

        await _refreshTokenRepository.AddAsync(refreshToken);

        return tokenValue;
    }

    public async Task RevokeRefreshTokenAsync(Guid userId)
    {
        var userTokens = await _refreshTokenRepository.GetByUserIdAsync(userId);
        
        foreach (var token in userTokens)
        {
            token.IsRevoked = true;
            await _refreshTokenRepository.UpdateAsync(token);
        }
    }
}
