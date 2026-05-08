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
            Console.WriteLine("[EMAIL BANCARIO] SMTP deshabilitado en la configuración. No se envía el correo.");
            return;
        }

        if (string.IsNullOrWhiteSpace(_smtpSettings.Host) ||
            _smtpSettings.Port == 0 ||
            string.IsNullOrWhiteSpace(_smtpSettings.Username) ||
            string.IsNullOrWhiteSpace(_smtpSettings.Password) ||
            string.IsNullOrWhiteSpace(_smtpSettings.FromEmail))
        {
            throw new InvalidOperationException("SmtpSettings incompletos. Verifique Host, Port, Username, Password y FromEmail.");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            string.IsNullOrWhiteSpace(_smtpSettings.FromName) ? _smtpSettings.FromEmail : _smtpSettings.FromName,
            _smtpSettings.FromEmail));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder
        {
            TextBody = body
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var smtp = new SmtpClient();

        if (_smtpSettings.IgnoreCertificateErrors)
        {
            smtp.ServerCertificateValidationCallback = (_, _, _, _) => true;
        }

        SecureSocketOptions socketOptions;
        if (_smtpSettings.UseImplicitSsl)
        {
            socketOptions = SecureSocketOptions.SslOnConnect;
        }
        else if (_smtpSettings.EnableSsl)
        {
            socketOptions = SecureSocketOptions.StartTls;
        }
        else
        {
            socketOptions = SecureSocketOptions.Auto;
        }

        smtp.Timeout = _smtpSettings.Timeout;

        await smtp.ConnectAsync(_smtpSettings.Host, _smtpSettings.Port, socketOptions);
        await smtp.AuthenticateAsync(_smtpSettings.Username, _smtpSettings.Password);
        await smtp.SendAsync(message);
        await smtp.DisconnectAsync(true);
    }
}