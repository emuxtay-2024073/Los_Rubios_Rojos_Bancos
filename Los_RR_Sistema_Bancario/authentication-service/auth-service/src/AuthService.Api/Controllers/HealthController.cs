using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuthService.Persistence.Data; // CORREGIDO: Era AppDbContext

namespace AuthService.Api.Controllers
{
    /// <summary>
    /// Controlador para verificar la salud del sistema
    /// </summary>
    [ApiController]
    [Route("api/health")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext; // CORREGIDO
        private readonly ILogger<HealthController> _logger;

        public HealthController(
            ApplicationDbContext dbContext, // CORREGIDO
            ILogger<HealthController> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Verifica la salud del sistema
        /// GET /api/health
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> Check()
        {
            var healthStatus = new
            {
                api = "Healthy",
                database = "Unknown",
                timestamp = DateTime.UtcNow
            };

            try
            {
                // Verificar conexión a base de datos
                var startTime = DateTime.UtcNow;
                var canConnect = await _dbContext.Database.CanConnectAsync();
                var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

                if (canConnect)
                {
                    var rolesCount = await _dbContext.Role.CountAsync();
                    
                    healthStatus = healthStatus with 
                    { 
                        database = $"Healthy ({responseTime:F0}ms, {rolesCount} roles)" 
                    };
                }
                else
                {
                    healthStatus = healthStatus with { database = "Unhealthy" };
                }

                var overallHealthy = healthStatus.database.StartsWith("Healthy");

                return Ok(new
                {
                    success = true,
                    status = overallHealthy ? "Healthy" : "Unhealthy",
                    checks = healthStatus,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al verificar la salud del sistema");

                return StatusCode(503, new
                {
                    success = false,
                    status = "Unhealthy",
                    checks = new
                    {
                        api = "Healthy",
                        database = "Unhealthy",
                        error = ex.Message
                    },
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Ping simple
        /// GET /api/health/ping
        /// </summary>
        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok(new
            {
                success = true,
                status = "alive",
                timestamp = DateTime.UtcNow
            });
        }
    }
}