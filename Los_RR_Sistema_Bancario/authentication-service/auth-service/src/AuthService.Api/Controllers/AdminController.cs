using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;


namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/management")]
public class AdminController : ControllerBase
{
    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var username = User.FindFirstValue(JwtRegisteredClaimNames.UniqueName);
        var role = User.FindFirstValue("role");

        return Ok(new
        {
            success = true,
            sub,
            username,
            role
        });
    }

[Authorize(Roles = "adminRestaurante")]
[HttpGet("only-admin")]
public IActionResult OnlyAdmin()
{
    return Ok(new { success = true, message = "Acceso permitido: admin" });
}

}
