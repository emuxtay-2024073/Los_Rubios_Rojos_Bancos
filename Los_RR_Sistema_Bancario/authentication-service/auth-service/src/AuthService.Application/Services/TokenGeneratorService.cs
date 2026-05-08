using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;
using AuthService.Domain.Entities;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;

namespace AuthService.Application.Services;

public class TokenGeneratorService : ITokenGeneratorService
{
    private readonly IConfiguration _config;

    public TokenGeneratorService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateAccessToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("role", user.MainRole)
        };

        // Agregar roles adicionales si existen
        if (user.UserRoles?.Any() == true)
        {
            foreach (var userRole in user.UserRoles)
            {
                claims.Add(new Claim("roles", userRole.RoleId.ToString()));
            }
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            _config["Jwt:Issuer"],
            _config["Jwt:Audience"],
            claims,
            expires: DateTime.UtcNow.AddHours(SecurityConstants.AccessTokenExpirationHours),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray());
    }

    public string GenerateVerificationToken()
    {
        return Guid.NewGuid().ToString("N");
    }

    public string GeneratePasswordResetToken()
    {
        return Guid.NewGuid().ToString("N");
    }

    public JwtSecurityToken ReadToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        return handler.ReadJwtToken(token);
    }
}
