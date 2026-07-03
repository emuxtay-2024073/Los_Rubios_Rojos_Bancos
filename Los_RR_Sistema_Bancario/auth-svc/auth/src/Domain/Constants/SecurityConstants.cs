namespace AuthService.Domain.Constants;

public class SecurityConstants
{
    public const int MinPasswordLength = 8;
    public const int MaxLoginAttempts = 5;
    public const int LockoutDurationMinutes = 30;
    public const int RefreshTokenExpirationDays = 7;
    public const int AccessTokenExpirationHours = 2;
    public const int PasswordResetTokenExpirationHours = 1;
    public const int EmailVerificationTokenExpirationDays = 3;
    public const int BcryptWorkFactor = 12;
}
