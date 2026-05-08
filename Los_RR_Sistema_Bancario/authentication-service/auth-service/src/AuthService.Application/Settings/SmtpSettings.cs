namespace AuthService.Application.Settings;

public class SmtpSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public bool EnableSsl { get; set; }
    public bool UseImplicitSsl { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public int Timeout { get; set; }
    public bool UseFallback { get; set; }
    public bool IgnoreCertificateErrors { get; set; }
}
