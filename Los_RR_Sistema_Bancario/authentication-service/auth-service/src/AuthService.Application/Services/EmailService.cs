using AuthService.Application.Interfaces;

namespace AuthService.Application.Services;

public class EmailService : IEmailService
{
    public Task SendEmailAsync(string to, string subject, string body)
    {
        Console.WriteLine($"[EMAIL BANCARIO] Destinatario: {to} | Asunto: {subject}");
        return Task.CompletedTask;
    }
}