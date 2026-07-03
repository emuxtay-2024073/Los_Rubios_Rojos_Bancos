using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

/// <summary>
/// DTO para actualizar información de usuario
/// </summary>
public class UpdateUserDto
{
    /// <summary>Nuevo email del usuario (opcional)</summary>
    /// <example>newemail@example.com</example>
    [EmailAddress(ErrorMessage = "El email debe tener un formato válido")]
    public string? Email { get; set; }

    /// <summary>Nuevo número telefónico (opcional)</summary>
    /// <example>55123456</example>
    [Phone(ErrorMessage = "El teléfono debe tener un formato válido")]
    public string? PhoneNumber { get; set; }

    /// <summary>Nuevo DPI - Documento Personal de Identificación (opcional)</summary>
    /// <example>1234567890123</example>
    [StringLength(13, MinimumLength = 13, ErrorMessage = "El DPI debe tener exactamente 13 caracteres")]
    public string? Dpi { get; set; }
}
