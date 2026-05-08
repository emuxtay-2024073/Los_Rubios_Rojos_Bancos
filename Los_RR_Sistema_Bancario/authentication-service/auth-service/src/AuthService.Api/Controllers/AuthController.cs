using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Linq;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IUserManagementService _userManagementService;
    private readonly IUserRepository _userRepository;

    public AuthController(
        IAuthService auth,
        IRefreshTokenService refreshTokenService,
        IUserManagementService userManagementService,
        IUserRepository userRepository)
    {
        _auth = auth;
        _refreshTokenService = refreshTokenService;
        _userManagementService = userManagementService;
        _userRepository = userRepository;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _auth.Login(dto);

        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _auth.Register(dto);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
            return BadRequest(new { message = "RefreshToken es requerido" });

        var (isValid, user) = await _refreshTokenService.ValidateRefreshTokenAsync(dto.RefreshToken);

        if (!isValid || user == null)
            return Unauthorized(new { message = "RefreshToken inválido o expirado" });

        var newAccessToken = _auth.GetJwtService().GenerateToken(user);
        var newRefreshToken = await _refreshTokenService.CreateRefreshTokenAsync(user.Id);

        return Ok(new RefreshTokenResponseDto
        {
            Success = true,
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            User = new UserDetailsDto
            {
                Id = user.Id.ToString(),
                Email = user.Email,
                Username = user.Username,
                Role = user.MainRole,
                IsActive = user.IsActive,
                LastLogin = user.LastLogin
            }
        });
    }

    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userRepository.GetAllAsync();

        var result = users.Select(user => new UserListDto
        {
            Id = user.Id.ToString(),
            Username = user.Username,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Dpi = user.Dpi,
            Role = user.MainRole,
            IsActive = user.IsActive,
            IsDisabled = user.IsDisabled,
            HasDisableRequest = user.HasDisableRequest,
            DisableRequestReason = user.DisableRequestReason,
            DisableRequestedAt = user.DisableRequestedAt,
            DisabilityReason = user.DisabilityReason,
            DisabledAt = user.DisabledAt,
            EmailConfirmed = user.EmailConfirmed,
            LastLogin = user.LastLogin,
            CreatedAt = user.CreatedAt
        });

        return Ok(result);
    }

    [HttpPost("verify-email")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { message = "Token de verificación es requerido" });

        var result = await _auth.VerifyEmail(token);

        return result
            ? Ok(new { message = "Email verificado exitosamente" })
            : BadRequest(new { message = "Token inválido o expirado" });
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { message = "Email es requerido" });

        await _auth.ForgotPassword(dto.Email);

        // No revelar si el email existe o no por seguridad
        return Ok(new { message = "Si el email existe, recibirá instrucciones para restablecer la contraseña" });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token))
            return BadRequest(new { message = "Token es requerido" });

        if (string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { message = "Nueva contraseña es requerida" });

        try
        {
            await _auth.ResetPassword(dto);
            return Ok(new { message = "Contraseña restablecida exitosamente" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { message = "Usuario no identificado" });

        var userDetails = await _userManagementService.GetUserDetailsAsync(userId);

        if (userDetails == null)
            return NotFound(new { message = "Usuario no encontrado" });

        return Ok(new { message = "Usuario autenticado correctamente", user = userDetails });
    }

    [HttpPut("users/{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateUser([FromRoute] string id, [FromBody] UpdateUserDto dto)
    {
        if (!Guid.TryParse(id, out var userId))
            return BadRequest(new { message = "ID de usuario inválido" });

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var isAdmin = User.IsInRole("Admin");

        // Un usuario solo puede editar su propia información, excepto Admin que puede editar cualquier usuario
        if (!isAdmin && userIdClaim != id)
            return Forbid();

        var result = await _userManagementService.UpdateUserAsync(userId, dto.Email, dto.PhoneNumber, dto.Dpi);

        if (!result)
            return NotFound(new { message = "Usuario no encontrado" });

        return Ok(new { message = "Usuario actualizado exitosamente" });
    }

    [HttpPost("users/{id}/disable-request")]
    [Authorize]
    public async Task<IActionResult> RequestDisableAccount([FromRoute] string id, [FromBody] DisableRequestDto dto)
    {
        if (!Guid.TryParse(id, out var userId))
            return BadRequest(new { message = "ID de usuario inválido" });

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        // Solo puede solicitar deshabilitación de su propia cuenta
        if (userIdClaim != id)
            return Forbid();

        var result = await _userManagementService.RequestDisableAccountAsync(userId, dto.Reason);

        if (!result)
            return BadRequest(new { message = "No se puede solicitar deshabilitación de esta cuenta" });

        return Ok(new { message = "Solicitud de deshabilitación enviada. Espere confirmación del banco." });
    }

    [HttpPost("users/{id}/disable")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveDisableAccount([FromRoute] string id, [FromBody] DisableRequestDto dto)
    {
        if (!Guid.TryParse(id, out var userId))
            return BadRequest(new { message = "ID de usuario inválido" });

        var result = await _userManagementService.ApproveDisableAccountAsync(userId, dto.Reason);

        if (!result)
            return NotFound(new { message = "Usuario no encontrado" });

        return Ok(new { message = "Cuenta deshabilitada exitosamente" });
    }

    [HttpPost("users/{id}/reject-disable-request")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RejectDisableRequest([FromRoute] string id)
    {
        if (!Guid.TryParse(id, out var userId))
            return BadRequest(new { message = "ID de usuario inválido" });

        var result = await _userManagementService.RejectDisableRequestAsync(userId);

        if (!result)
            return NotFound(new { message = "Usuario no encontrado" });

        return Ok(new { message = "Solicitud de deshabilitación rechazada" });
    }

    [HttpPost("users/{id}/enable")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ReenableAccount([FromRoute] string id)
    {
        if (!Guid.TryParse(id, out var userId))
            return BadRequest(new { message = "ID de usuario inválido" });

        var result = await _userManagementService.ReenableAccountAsync(userId);

        if (!result)
            return NotFound(new { message = "Usuario no encontrado" });

        return Ok(new { message = "Cuenta habilitada exitosamente" });
    }
}