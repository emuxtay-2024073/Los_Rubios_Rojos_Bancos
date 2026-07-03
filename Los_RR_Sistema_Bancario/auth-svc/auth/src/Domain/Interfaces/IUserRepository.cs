using AuthService.Domain.Entities;

namespace AuthService.Domain.Interfaces;

public interface IUserRepository
{
    Task<bool> ExistsAsync(string email); 
    Task<bool> ExistsByUsernameAsync(string username);
    Task<bool> ExistsByDpiAsync(string dpi);

    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(Guid id);
    Task<List<User>> GetAllAsync();
    Task<List<User>> GetClientsAsync();
    Task<User?> GetByVerificationTokenAsync(string token);
    Task<User?> GetByResetTokenAsync(string token);
    Task AddAsync(User user);
    Task UpdateAsync(User user);
    Task<bool> DeleteAsync(Guid id);
}