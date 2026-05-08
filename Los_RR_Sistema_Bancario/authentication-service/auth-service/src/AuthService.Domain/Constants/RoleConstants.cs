namespace AuthService.Domain.Constants;

public class RoleConstants
{
    public const string Admin = "ADMIN";
    public const string Cajero = "CAJERO";
    public const string Auditor = "AUDITOR";
    public const string Client = "CLIENTE";
    public const string SuperAdmin = "SUPERADMIN";

    public static readonly Dictionary<string, Guid> RoleIds = new()
    {
        { Admin, Guid.Parse("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d") },
        { Cajero, Guid.Parse("c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f") },
        { Auditor, Guid.Parse("d4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a") },
        { Client, Guid.Parse("b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e") },
        { SuperAdmin, Guid.Parse("e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b") }
    };
}
