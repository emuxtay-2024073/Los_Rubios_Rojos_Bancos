using System;
using System.IO;
using Microsoft.Extensions.Configuration;

namespace AuthService.Api.Extensions;

public static class ConfigurationExtensions
{
    public static IConfigurationBuilder AddEnvConfiguration(this IConfigurationBuilder builder, string contentRootPath)
    {
        var dotEnvFile = FindDotEnvFile(contentRootPath) ?? FindDotEnvFile(Directory.GetCurrentDirectory());
        if (dotEnvFile != null)
        {
            Console.WriteLine($"[EMAIL BANCARIO] Cargando variables de entorno desde {dotEnvFile}");
            LoadDotEnvFile(dotEnvFile);
        }

        return builder;
    }

    public static void MapEnvVariables(this IConfiguration configuration)
    {
        string? GetEnv(string name) => Environment.GetEnvironmentVariable(name);
        void MapEnv(string envKey, string configKey)
        {
            var envValue = GetEnv(envKey);
            if (!string.IsNullOrWhiteSpace(envValue)) configuration[configKey] = envValue;
        }

        MapEnv("SMTP_HOST", "SmtpSettings:Host");
        MapEnv("SMTP_PORT", "SmtpSettings:Port");
        MapEnv("SMTP_USER", "SmtpSettings:Username");
        MapEnv("SMTP_PASS", "SmtpSettings:Password");
        MapEnv("SMTP_FROM", "SmtpSettings:FromEmail");
        MapEnv("SMTP_FROM_NAME", "SmtpSettings:FromName");
        MapEnv("SMTP_TIMEOUT", "SmtpSettings:Timeout");
        MapEnv("SMTP_IGNORE_CERTIFICATE_ERRORS", "SmtpSettings:IgnoreCertificateErrors");
        MapEnv("SMTP_USE_FALLBACK", "SmtpSettings:UseFallback");
        MapEnv("FRONTEND_URL", "FrontendUrl");

        var smtpEnabledValue = GetEnv("SMTP_ENABLED");
        if (!string.IsNullOrWhiteSpace(smtpEnabledValue) && TryParseBoolEnv(smtpEnabledValue, out var smtpEnabled))
        {
            configuration["SmtpSettings:Enabled"] = smtpEnabled.ToString();
        }

        var smtpSecureValue = GetEnv("SMTP_SECURE");
        if (!string.IsNullOrWhiteSpace(smtpSecureValue) && TryParseBoolEnv(smtpSecureValue, out var smtpSecure))
        {
            configuration["SmtpSettings:UseImplicitSsl"] = smtpSecure.ToString();
            configuration["SmtpSettings:EnableSsl"] = (!smtpSecure).ToString();
        }
    }

    private static bool TryParseBoolEnv(string? value, out bool result)
    {
        if (bool.TryParse(value, out result)) return true;
        if (string.IsNullOrWhiteSpace(value)) return false;
        return value.Trim().ToLowerInvariant() switch
        {
            "1" => result = true,
            "yes" => result = true,
            "y" => result = true,
            "on" => result = true,
            "true" => result = true,
            "0" => result = false,
            "no" => result = false,
            "n" => result = false,
            "off" => result = false,
            "false" => result = false,
            _ => false
        };
    }

    private static string? FindDotEnvFile(string startPath)
    {
        var dir = new DirectoryInfo(startPath);
        while (dir != null)
        {
            var file = Path.Combine(dir.FullName, ".env");
            if (File.Exists(file)) return file;
            dir = dir.Parent;
        }
        return null;
    }

    private static void LoadDotEnvFile(string filePath)
    {
        foreach (var rawLine in File.ReadAllLines(filePath))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) continue;
            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0) continue;
            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim();
            if (string.IsNullOrWhiteSpace(key)) continue;
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}
