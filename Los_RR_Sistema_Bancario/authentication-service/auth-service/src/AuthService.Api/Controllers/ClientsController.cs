using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/clientes")]
public class ClientsController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserRepository _users;

    public ClientsController(IAuthService authService, IUserRepository users)
    {
        _authService = authService;
        _users = users;
    }

    /// <summary>
    /// Agrega un cliente nuevo.
    /// Endpoint público para registro de usuarios.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddClient([FromBody] CreateClientDto dto)
    {
        var result = await _authService.Register(new RegisterDto
        {
            Username = dto.Username,
            Email = dto.Email,
            Password = dto.Password,
            PhoneNumber = dto.PhoneNumber,
            Dpi = dto.Dpi,
            Role = "Cliente"
        });

        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Lista todos los clientes registrados.
    /// Requiere token JWT de un usuario con rol Admin.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListClients()
    {
        var clients = await _users.GetClientsAsync();

        var result = clients.Select(client => new ClientDto
        {
            Id = client.Id.ToString(),
            Username = client.Username,
            Email = client.Email,
            PhoneNumber = client.PhoneNumber,
            Dpi = client.Dpi,
            IsActive = client.IsActive,
            EmailConfirmed = client.EmailConfirmed,
            LastLogin = client.LastLogin
        });

        return Ok(result);
    }

    /// <summary>
    /// Elimina un cliente por su identificador.
    /// Requiere token JWT de un usuario con rol Admin.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteClient(Guid id)
    {
        var deleted = await _users.DeleteAsync(id);

        return deleted ? NoContent() : NotFound(new { message = "Cliente no encontrado" });
    }
}