namespace AuthService.Application.Exceptions
{
    /// <summary>
    /// Excepción cuando un usuario no es encontrado
    /// </summary>
    public class UserNotFoundException : Exception
    {
        public UserNotFoundException() 
            : base("Usuario no encontrado")
        {
        }

        public UserNotFoundException(string message) 
            : base(message)
        {
        }

        public UserNotFoundException(Guid userId) 
            : base($"Usuario con ID {userId} no encontrado")
        {
        }
    }

    /// <summary>
    /// Excepción cuando las credenciales son inválidas
    /// </summary>
    public class InvalidCredentialsException : Exception
    {
        public InvalidCredentialsException() 
            : base("Credenciales inválidas")
        {
        }

        public InvalidCredentialsException(string message) 
            : base(message)
        {
        }
    }

    /// <summary>
    /// Excepción cuando no hay fondos suficientes
    /// </summary>
    public class InsufficientFundsException : Exception
    {
        public decimal RequiredAmount { get; }
        public decimal AvailableAmount { get; }

        public InsufficientFundsException(decimal required, decimal available) 
            : base($"Fondos insuficientes. Requerido: {required:C}, Disponible: {available:C}")
        {
            RequiredAmount = required;
            AvailableAmount = available;
        }

        public InsufficientFundsException(string message) 
            : base(message)
        {
        }
    }

    /// <summary>
    /// Excepción cuando una cuenta está bloqueada
    /// </summary>
    public class AccountBlockedException : Exception
    {
        public DateTime? BlockedUntil { get; }

        public AccountBlockedException(DateTime? blockedUntil = null) 
            : base("La cuenta está temporalmente bloqueada")
        {
            BlockedUntil = blockedUntil;
        }

        public AccountBlockedException(string message) 
            : base(message)
        {
        }
    }

    /// <summary>
    /// Excepción cuando el email no está verificado
    /// </summary>
    public class EmailNotVerifiedException : Exception
    {
        public EmailNotVerifiedException() 
            : base("Debe verificar su email antes de continuar")
        {
        }

        public EmailNotVerifiedException(string message) 
            : base(message)
        {
        }
    }
}