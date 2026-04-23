using AuthService.Application.DTOs;

namespace AuthService.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> Login(LoginDto dto);
    Task<AuthResponseDto> Register(RegisterDto dto);
    Task<bool> VerifyEmail(string token); 
    Task ForgotPassword(string email);    
    Task ResetPassword(ResetPasswordDto dto); 
}