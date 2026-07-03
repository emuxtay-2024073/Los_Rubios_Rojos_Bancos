using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

/// <summary>
/// DTO para solicitudes de deshabilitación de cuenta
/// </summary>
public class DisableRequestDto
{
    /// <summary>Razón por la que se solicita deshabilitar la cuenta</summary>
    /// <example>No necesito esta cuenta bancaria en este momento</example>
    [Required(ErrorMessage = "La razón es requerida")]
    [StringLength(500, MinimumLength = 10, ErrorMessage = "La razón debe tener entre 10 y 500 caracteres")]
    public string Reason { get; set; } = string.Empty;
}
