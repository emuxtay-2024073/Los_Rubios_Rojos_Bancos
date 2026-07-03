using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;

namespace AuthService.Application.Services;

public class PasswordHashService : IPasswordHashService
{
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, SecurityConstants.BcryptWorkFactor);
    }

    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
