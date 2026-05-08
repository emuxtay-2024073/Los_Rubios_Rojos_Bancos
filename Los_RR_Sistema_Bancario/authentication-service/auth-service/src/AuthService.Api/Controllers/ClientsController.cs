using AuthService.Application.DTOs;
using AuthService.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/clientes")]
public class ClientsController : ControllerBase
{
    private readonly IUserRepository _users;

    public ClientsController(IUserRepository users)
    {
        _users = users;
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

        var result = clients.Select(client => new UserListDto
        {
            Id = client.Id.ToString(),
            Username = client.Username,
            Email = client.Email,
            PhoneNumber = client.PhoneNumber,
            Dpi = client.Dpi,
            Role = client.MainRole,
            IsActive = client.IsActive,
            IsDisabled = client.IsDisabled,
            HasDisableRequest = client.HasDisableRequest,
            DisableRequestReason = client.DisableRequestReason,
            DisableRequestedAt = client.DisableRequestedAt,
            DisabilityReason = client.DisabilityReason,
            DisabledAt = client.DisabledAt,
            EmailConfirmed = client.EmailConfirmed,
            LastLogin = client.LastLogin,
            CreatedAt = client.CreatedAt
        });

        return Ok(result);
    }
}