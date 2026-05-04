using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs
{
    public class RequestReversalDto
    {
        [Required]
        public string TransactionId { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Reason { get; set; } = string.Empty;
    }
}