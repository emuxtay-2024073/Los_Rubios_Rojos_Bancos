using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;
using AuthService.Domain.Entities;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;

namespace AuthService.Application.Services;

public class JwtService : IJwtService
{
    private readonly ITokenGeneratorService _tokenGeneratorService;

    public JwtService(ITokenGeneratorService tokenGeneratorService)
    {
        _tokenGeneratorService = tokenGeneratorService;
    }

    public string GenerateToken(User user)
    {
        return _tokenGeneratorService.GenerateAccessToken(user);
    }

    public string GenerateRefreshToken()
    {
        return _tokenGeneratorService.GenerateRefreshToken();
    }
}