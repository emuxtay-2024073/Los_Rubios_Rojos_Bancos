using System.IdentityModel.Tokens.Jwt;
using AuthService.Domain.Entities;

namespace AuthService.Application.Interfaces;

public interface ITokenGeneratorService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    string GenerateVerificationToken();
    string GeneratePasswordResetToken();
    JwtSecurityToken ReadToken(string token);
}
