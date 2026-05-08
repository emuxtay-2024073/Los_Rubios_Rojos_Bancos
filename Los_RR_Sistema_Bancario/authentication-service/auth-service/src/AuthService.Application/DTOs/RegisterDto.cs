using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

public class RegisterDto
{
    [Required(ErrorMessage = "Username es requerido")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username debe tener entre 3 y 50 caracteres")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password es requerido")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password debe tener al menos 8 caracteres")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email es requerido")]
    [EmailAddress(ErrorMessage = "Email debe tener un formato válido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "PhoneNumber es requerido")]
    [StringLength(20, MinimumLength = 8, ErrorMessage = "PhoneNumber debe tener entre 8 y 20 caracteres")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Dpi es requerido")]
    [StringLength(13, MinimumLength = 13, ErrorMessage = "Dpi debe tener exactamente 13 caracteres")]
    public string Dpi { get; set; } = string.Empty;

    public string SecretKey { get; set; } = string.Empty;

    [Required(ErrorMessage = "Role es requerido")]
    public string Role { get; set; } = "Cliente";
}
