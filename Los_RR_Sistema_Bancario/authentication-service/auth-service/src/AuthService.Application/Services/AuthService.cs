using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;

namespace AuthService.Application.Services;

public class AuthService : IAuthService
{
    private const string AdminSecretKey = "CLAVE_ADMIN0101";

    private readonly IUserRepository _users;
    private readonly IJwtService _jwt;
    private readonly IEmailService _emailService;
    private readonly IPasswordHashService _passwordHashService;
    private readonly IRefreshTokenService _refreshTokenService;

    public AuthService(
        IUserRepository users,
        IJwtService jwt,
        IEmailService emailService,
        IPasswordHashService passwordHashService,
        IRefreshTokenService refreshTokenService)
    {
        _users = users;
        _jwt = jwt;
        _emailService = emailService;
        _passwordHashService = passwordHashService;
        _refreshTokenService = refreshTokenService;
    }

    public async Task<AuthResponseDto> Login(LoginDto dto)
    {
        var user = await _users.GetByEmailAsync(dto.Email);

        if (user == null)
            return new AuthResponseDto { Success = false, Message = "Credenciales inválidas" };

        if (user.IsLocked)
            return new AuthResponseDto { Success = false, Message = "Cuenta bloqueada temporalmente." };

        if (user.IsDisabled)
            return new AuthResponseDto { Success = false, Message = "Cuenta deshabilitada. Contacte al banco para más información." };

        if (!_passwordHashService.VerifyPassword(dto.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= SecurityConstants.MaxLoginAttempts)
                user.IsLocked = true;

            await _users.UpdateAsync(user);
            return new AuthResponseDto { Success = false, Message = "Credenciales inválidas" };
        }

        user.FailedLoginAttempts = 0;
        user.LastLogin = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _users.UpdateAsync(user);

        var refreshToken = await _refreshTokenService.CreateRefreshTokenAsync(user.Id);

        return new AuthResponseDto
        {
            Success = true,
            Token = _jwt.GenerateToken(user),
            RefreshToken = refreshToken,
            User = new UserDetailsDto
            {
                Id = user.Id.ToString(),
                Email = user.Email,
                Username = user.Username,
                Role = user.MainRole,
                IsActive = user.IsActive,
                LastLogin = user.LastLogin
            }
        };
    }

    public async Task<AuthResponseDto> Register(RegisterDto dto)
    {
        if (!IsPasswordStrong(dto.Password))
            return new AuthResponseDto
            {
                Success = false,
                Message = "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un carácter especial. Ejemplo: MiPass123!"
            };

        if (string.IsNullOrWhiteSpace(dto.Dpi))
            return new AuthResponseDto { Success = false, Message = "DPI es requerido" };

        if (await _users.ExistsAsync(dto.Email))
            return new AuthResponseDto { Success = false, Message = "El email ya está registrado" };

        if (await _users.ExistsByUsernameAsync(dto.Username))
            return new AuthResponseDto { Success = false, Message = "El username ya está registrado" };

        if (await _users.ExistsByDpiAsync(dto.Dpi))
            return new AuthResponseDto { Success = false, Message = "El DPI ya está registrado" };

        if (dto.Role?.Trim().ToLower() == "admin")
        {
            if (dto.SecretKey != AdminSecretKey)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Clave secreta de administrador inválida"
                };
            }
        }

        var roleId = dto.Role?.Trim().ToLower() switch
        {
            "admin" => RoleConstants.RoleIds[RoleConstants.Admin],
            "cajero" => RoleConstants.RoleIds[RoleConstants.Cajero],
            "auditor" => RoleConstants.RoleIds[RoleConstants.Auditor],
            _ => RoleConstants.RoleIds[RoleConstants.Client]
        };

        var verificationToken = Guid.NewGuid().ToString("N");

        var newUser = new User
        {
            Email = dto.Email,
            Username = string.IsNullOrWhiteSpace(dto.Username) ? dto.Email.Split('@')[0] : dto.Username,
            PhoneNumber = dto.PhoneNumber,
            Dpi = dto.Dpi,
            PasswordHash = _passwordHashService.HashPassword(dto.Password),
            EmailConfirmed = false,
            VerificationToken = verificationToken,
            Role = dto.Role?.ToUpper() ?? RoleConstants.Client,
            CreatedAt = DateTime.UtcNow,
            UserRoles = new List<UserRole>
            {
                new UserRole { RoleId = roleId }
            }
        };

        try
        {
            await _users.AddAsync(newUser);
        }
        catch (Exception ex)
        {
            return new AuthResponseDto { Success = false, Message = "Error interno del servidor al guardar el usuario" };
        }

        var emailSent = true;

        try
        {
            await _emailService.SendEmailAsync(
                newUser.Email,
                "Bienvenido",
                $"Verifique su cuenta bancaria. Token: {verificationToken}");
        }
        catch (Exception ex)
        {
            emailSent = false;
            Console.WriteLine($"[EMAIL BANCARIO] No fue posible enviar el email de verificación: {ex.Message}");
        }

        return new AuthResponseDto
        {
            Success = true,
            Message = emailSent
                ? "Registro exitoso. Verifique su email."
                : "Registro exitoso. No se pudo enviar el email de verificación. Contacte al soporte."
        };
    }

    public async Task<bool> VerifyEmail(string token)
    {
        var user = await _users.GetByVerificationTokenAsync(token);

        if (user == null) return false;

        user.EmailConfirmed = true;
        user.VerificationToken = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _users.UpdateAsync(user);

        if (!await TrySendEmailAsync(user.Email, "Cuenta Activada", "Su correo ha sido verificado."))
        {
            Console.WriteLine("[EMAIL BANCARIO] No fue posible enviar el email de cuenta activada.");
        }

        return true;
    }

    public async Task ForgotPassword(string email)
    {
        var user = await _users.GetByEmailAsync(email);
        if (user != null)
        {
            var resetToken = Guid.NewGuid().ToString("N");
            user.ResetToken = resetToken;
            user.ResetTokenExpires = DateTime.UtcNow.AddHours(SecurityConstants.PasswordResetTokenExpirationHours);
            user.UpdatedAt = DateTime.UtcNow;
            await _users.UpdateAsync(user);
            if (!await TrySendEmailAsync(
                email,
                "Recuperación de Contraseña",
                $"Token: {resetToken}"))
            {
                Console.WriteLine("[EMAIL BANCARIO] No fue posible enviar el email de recuperación de contraseña.");
            }
        }
    }

    public async Task ResetPassword(ResetPasswordDto dto)
    {
        var user = await _users.GetByResetTokenAsync(dto.Token);

        if (user == null || user.ResetTokenExpires < DateTime.UtcNow)
            throw new Exception("El token es inválido o ha expirado.");

        if (!IsPasswordStrong(dto.NewPassword))
            throw new Exception("La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un carácter especial. Ejemplo: MiPass123!");

        user.PasswordHash = _passwordHashService.HashPassword(dto.NewPassword);
        user.ResetToken = null;
        user.ResetTokenExpires = null;
        user.LastPasswordChangeAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _users.UpdateAsync(user);
        if (!await TrySendEmailAsync(user.Email, "Seguridad", "Su contraseña ha sido restablecida."))
        {
            Console.WriteLine("[EMAIL BANCARIO] No fue posible enviar el email de restablecimiento de contraseña.");
        }
    }

    private bool IsPasswordStrong(string pw) =>
        pw.Length >= SecurityConstants.MinPasswordLength &&
        pw.Any(char.IsUpper) &&
        pw.Any(char.IsDigit) &&
        pw.Any(c => !char.IsLetterOrDigit(c));

    private async Task<bool> TrySendEmailAsync(string to, string subject, string body)
    {
        try
        {
            await _emailService.SendEmailAsync(to, subject, body);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EMAIL BANCARIO] Error al enviar email a {to}: {ex.Message}");
            return false;
        }
    }

    public IJwtService GetJwtService()
    {
        return _jwt;
    }
}