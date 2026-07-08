using Microsoft.EntityFrameworkCore;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Persistence.Data;

namespace AuthService.Persistence.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // --- MÉTODOS DE LECTURA ---

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.User
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<bool> ExistsAsync(string email)
        {
            return await _context.User.AnyAsync(u => u.Email == email);
        }

        public async Task<bool> ExistsByUsernameAsync(string username)
        {
            return await _context.User.AnyAsync(u => u.Username == username);
        }

        public async Task<bool> ExistsByDpiAsync(string dpi)
        {
            if (string.IsNullOrWhiteSpace(dpi))
                return false;
            return await _context.User.AnyAsync(u => u.Dpi == dpi);
        }

        public async Task<User?> GetByVerificationTokenAsync(string token)
        {
            return await _context.User
                .FirstOrDefaultAsync(u => u.VerificationToken == token);
        }

        public async Task<User?> GetByResetTokenAsync(string token)
        {
            return await _context.User
                .FirstOrDefaultAsync(u => u.ResetToken == token);
        }

        // --- MÉTODOS DE ESCRITURA (CON SAVECHANGES) ---

        public async Task AddAsync(User user)
        {
            await _context.User.AddAsync(user);
            await _context.SaveChangesAsync(); // Importante: Guardar en DB
        }

        public async Task UpdateAsync(User user)
        {
            _context.User.Update(user);
            await _context.SaveChangesAsync(); // Importante: Guardar en DB
        }

        // --- OTROS MÉTODOS (Opcionales para administración) ---

        public async Task<User?> GetByIdAsync(Guid id)
        {
            return await _context.User
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<List<User>> GetAllAsync()
        {
            return await _context.User
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .OrderBy(u => u.Username)
                .ToListAsync();
        }

        public async Task<List<User>> GetClientsAsync()
        {
            return await _context.User
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Where(u => u.UserRoles != null && u.UserRoles.Any(ur => ur.Role != null && ur.Role.Name == "Cliente"))
                .OrderBy(u => u.Username)
                .ToListAsync();
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var user = await _context.User.FindAsync(id);
            if (user == null)
            {
                return false;
            }

            _context.User.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}