using AuthService.Application.Interfaces;
using AuthService.Application.Settings;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace AuthService.Application.Services;

public class EmailService : IEmailService
{
    private readonly SmtpSettings _smtpSettings;

    public EmailService(IOptions<SmtpSettings> smtpSettings)
    {
        _smtpSettings = smtpSettings.Value;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        if (!_smtpSettings.Enabled)
        {
            throw new InvalidOperationException("SMTP está deshabilitado. Configure SMTP_ENABLED=true o SmtpSettings__Enabled=true en la configuración.");
        }

        if (string.IsNullOrWhiteSpace(_smtpSettings.Host) ||
            _smtpSettings.Port == 0 ||
            string.IsNullOrWhiteSpace(_smtpSettings.Username) ||
            string.IsNullOrWhiteSpace(_smtpSettings.Password) ||
            string.IsNullOrWhiteSpace(_smtpSettings.FromEmail))
        {
            throw new InvalidOperationException("SmtpSettings incompletos. Verifique Host, Port, Username, Password y FromEmail.");
        }

        Console.WriteLine($"[EMAIL BANCARIO] Enviando email a {to} usando SMTP {_smtpSettings.Host}:{_smtpSettings.Port}");

        var message = new MimeMessage();

        if (_smtpSettings.FromEmail.Contains("<") && _smtpSettings.FromEmail.Contains(">"))
        {
            message.From.Add(MailboxAddress.Parse(_smtpSettings.FromEmail));
        }
        else
        {
            message.From.Add(new MailboxAddress(
                string.IsNullOrWhiteSpace(_smtpSettings.FromName) ? _smtpSettings.FromEmail : _smtpSettings.FromName,
                _smtpSettings.FromEmail));
        }

        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new BodyBuilder { TextBody = body }.ToMessageBody();

        using var smtp = new SmtpClient();

        if (_smtpSettings.IgnoreCertificateErrors)
        {
            smtp.ServerCertificateValidationCallback = (_, _, _, _) => true;
        }

        smtp.AuthenticationMechanisms.Remove("XOAUTH2");

        var socketOptions = _smtpSettings.UseImplicitSsl
    ? SecureSocketOptions.SslOnConnect
    : _smtpSettings.EnableSsl
        ? SecureSocketOptions.StartTlsWhenAvailable
        : SecureSocketOptions.None;

        smtp.Timeout = _smtpSettings.Timeout > 0 ? _smtpSettings.Timeout : 10000;

        await smtp.ConnectAsync(_smtpSettings.Host, _smtpSettings.Port, socketOptions);
        await smtp.AuthenticateAsync(_smtpSettings.Username, _smtpSettings.Password);
        await smtp.SendAsync(message);
        await smtp.DisconnectAsync(true);

        Console.WriteLine($"[EMAIL BANCARIO] Email enviado exitosamente a {to}");
    }
}