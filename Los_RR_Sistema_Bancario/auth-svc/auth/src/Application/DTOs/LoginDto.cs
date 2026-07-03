using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

/// <summary>
/// DTO para autenticación de usuarios
/// </summary>
public class LoginDto
{
    /// <summary>Email del usuario registrado</summary>
    /// <example>usuario@example.com</example>
    [Required(ErrorMessage = "El email es requerido")]
    [EmailAddress(ErrorMessage = "El email debe tener un formato válido")]
    public string Email { get; set; } = string.Empty;

    /// <summary>Contraseña del usuario</summary>
    /// <example>MiContra123!</example>
    [Required(ErrorMessage = "La contraseña es requerida")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "La contraseña debe tener entre 8 y 100 caracteres")]
    public string Password { get; set; } = string.Empty;
}
