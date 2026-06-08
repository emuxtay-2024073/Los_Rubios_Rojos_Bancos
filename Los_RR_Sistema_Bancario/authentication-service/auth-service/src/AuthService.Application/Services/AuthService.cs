using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net;

namespace AuthService.Application.Services;

public class AuthService : IAuthService
{
    private const string AdminSecretKey = "CLAVE_ADMIN0101";

    private readonly IUserRepository _users;
    private readonly IJwtService _jwt;
    private readonly IEmailService _emailService;
    private readonly IPasswordHashService _passwordHashService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IConfiguration _configuration;

    public AuthService(
        IUserRepository users,
        IJwtService jwt,
        IEmailService emailService,
        IPasswordHashService passwordHashService,
        IRefreshTokenService refreshTokenService,
        IConfiguration configuration)
    {
        _users = users;
        _jwt = jwt;
        _emailService = emailService;
        _passwordHashService = passwordHashService;
        _refreshTokenService = refreshTokenService;
        _configuration = configuration;
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

        if (!user.EmailConfirmed)
            return new AuthResponseDto { Success = false, Message = "Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada." };

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

        var validAccountTypes = new[] { "ahorro", "monetaria", "corriente" };
        var requestAccountType = dto.AccountType?.ToLower()?.Trim() ?? string.Empty;
        var finalAccountType = validAccountTypes.Contains(requestAccountType)
            ? requestAccountType
            : "ahorro";

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
            AccountType = finalAccountType,
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
        catch (Exception)
        {
            return new AuthResponseDto { Success = false, Message = "Error interno del servidor al guardar el usuario" };
        }

        var emailSent = true;

        try
        {
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
            var verificationLink = $"{frontendUrl}/verify-email?token={verificationToken}";

            var emailBody = BuildVerificationTextBody(newUser.Username, verificationLink);
            var emailHtml = BuildVerificationHtmlBody(newUser.Username, verificationLink);

            await _emailService.SendEmailAsync(
                newUser.Email,
                "Los Rubios Rojos Banco - verifica tu cuenta",
                emailBody,
                emailHtml,
                verificationLink);
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

        _ = Task.Run(() => TrySendEmailAsync(user.Email, "Cuenta Activada", "Su correo ha sido verificado."));

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

    private static string EscapeHtml(string value) => WebUtility.HtmlEncode(value ?? string.Empty);

    private static string BuildVerificationTextBody(string username, string verificationLink) =>
$@"Hola {username},

Bienvenido a Los Rubios Rojos Banco.

Confirma tu correo para activar tu cuenta bancaria:
{verificationLink}

Este enlace es valido por 24 horas.

Si no creaste esta cuenta, puedes ignorar este correo. Nadie podra operar con esta cuenta sin verificar el enlace.

Los Rubios Rojos Banco";

    private static string BuildVerificationHtmlBody(string username, string verificationLink)
    {
        var safeUsername = EscapeHtml(username);
        var safeVerificationLink = EscapeHtml(verificationLink);

        return $@"
    <div style=""margin:0;padding:0;background:#071A33;"">
      <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" style=""background:#071A33;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;"">
        <tr>
          <td align=""center"">
            <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" style=""max-width:700px;background:#F8FAFC;border-radius:18px;overflow:hidden;border:1px solid #D4AF37;box-shadow:0 22px 70px rgba(0,0,0,.28);"">
              <tr>
                <td style=""background:#002D62;padding:0;color:#ffffff;"">
                  <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"">
                    <tr>
                      <td style=""padding:30px 30px 26px;"">
                        <div style=""font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:800;color:#D4AF37;"">Los Rubios Rojos Banco</div>
                        <h1 style=""margin:12px 0 0;font-size:34px;line-height:1.08;font-weight:900;"">Activa tu acceso bancario</h1>
                        <p style=""margin:14px 0 0;font-size:16px;line-height:1.65;color:#DDEBFF;"">Confirma tu correo para proteger tu cuenta y habilitar operaciones dentro del sistema bancario.</p>
                      </td>
                      <td width=""132"" align=""center"" style=""padding:20px 24px 20px 0;"">
                        <div style=""width:104px;height:104px;border-radius:50%;background:#D4AF37;color:#002D62;border:7px solid #EEF4FF;text-align:center;font-weight:900;line-height:1;"">
                          <div style=""font-size:30px;padding-top:22px;"">RR</div>
                          <div style=""font-size:10px;letter-spacing:2px;margin-top:7px;"">BANCO</div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style=""padding:0 28px;"">
                  <div style=""height:18px;background:repeating-linear-gradient(90deg,#D4AF37 0,#D4AF37 16px,#F8FAFC 16px,#F8FAFC 30px,#0B5CAD 30px,#0B5CAD 36px);border-radius:0 0 16px 16px;""></div>
                </td>
              </tr>
              <tr>
                <td style=""padding:30px 28px 10px;color:#0F172A;"">
                  <p style=""margin:0 0 18px;font-size:18px;line-height:1.65;"">Hola <strong>{safeUsername}</strong>,</p>
                  <p style=""margin:0 0 22px;font-size:16px;line-height:1.7;color:#334155;"">
                    Tu cuenta fue creada correctamente. Para mantener seguro tu acceso, necesitamos validar este correo antes de permitir el inicio de sesion y las operaciones bancarias.
                  </p>

                  <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" style=""margin:24px 0;border-collapse:separate;border-spacing:0;"">
                    <tr>
                      <td style=""background:#FFFFFF;border:2px dashed #D4AF37;border-radius:16px;padding:20px;"">
                        <div style=""font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#002D62;font-weight:800;"">Verificacion segura</div>
                        <div style=""margin-top:8px;font-size:15px;color:#475569;"">Enlace valido por 24 horas</div>
                        <div style=""margin-top:14px;height:1px;background:repeating-linear-gradient(90deg,#D4AF37 0,#D4AF37 10px,transparent 10px,transparent 18px);""></div>
                        <div style=""margin-top:18px;text-align:center;"">
                          <a href=""{safeVerificationLink}"" style=""display:inline-block;background:#002D62;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;padding:15px 30px;border-radius:999px;border:3px solid #001B3D;"">
                            Verificar mi correo
                          </a>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <p style=""margin:22px 0 8px;font-size:14px;color:#64748B;"">Si el boton no abre, copia este enlace:</p>
                  <p style=""margin:0;word-break:break-all;font-size:13px;line-height:1.6;color:#0B5CAD;"">{safeVerificationLink}</p>
                </td>
              </tr>
              <tr>
                <td style=""padding:24px 28px 30px;"">
                  <div style=""background:#0B1F3A;color:#DDEBFF;border-radius:14px;padding:16px 18px;font-size:13px;line-height:1.55;border-left:5px solid #D4AF37;"">
                    Si no solicitaste esta cuenta, puedes ignorar este correo. Nadie podra operar con esta cuenta sin verificar el enlace.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>";
    }

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
