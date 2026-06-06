/**
 * fixInvalidRoles.js
 * 
 * Corrige usuarios en PostgreSQL cuyo campo "Role" contiene
 * un valor inválido (ej: un UUID u otro string no canónico).
 * 
 * Uso:
 *   node src/scripts/fixInvalidRoles.js
 * 
 * Reglas de corrección:
 *   - Si el valor contiene "super" o "superadmin" → SUPER_ADMIN
 *   - Si el valor contiene "admin"                → ADMIN
 *   - Cualquier otro valor inválido               → USER  (fallback seguro)
 */

import sequelize from '../Config/postgres.js';
import User from '../Models/user.model.postgres.js';
import { Op } from 'sequelize';

const VALID_ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'];

const guessRole = (raw) => {
  if (!raw) return 'USER';
  const s = String(raw).toLowerCase().replace(/[-_\s]/g, '');
  if (s.includes('superadmin') || s.includes('super')) return 'SUPER_ADMIN';
  if (s.includes('admin')) return 'ADMIN';
  return 'USER';
};

const fixInvalidRoles = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Conectado a PostgreSQL\n');

    // Buscar todos los usuarios con roles fuera de los valores válidos
    const invalidUsers = await User.findAll({
      where: {
        role: {
          [Op.notIn]: VALID_ROLES,
        },
      },
    });

    if (invalidUsers.length === 0) {
      console.log('✓ No se encontraron usuarios con roles inválidos. Nada que corregir.');
      process.exit(0);
    }

    console.log(`⚠ Se encontraron ${invalidUsers.length} usuario(s) con rol inválido:\n`);

    for (const user of invalidUsers) {
      const corrected = guessRole(user.role);
      console.log(`  • ${user.email}`);
      console.log(`    Rol actual  : "${user.role}"`);
      console.log(`    Rol correcto: "${corrected}"`);

      user.role = corrected;
      await user.save();
      console.log(`    ✓ Corregido\n`);
    }

    console.log(`✓ ${invalidUsers.length} usuario(s) corregido(s) exitosamente.`);
    console.log('  Los usuarios afectados deben cerrar sesión y volver a entrar para obtener un token actualizado.');
  } catch (err) {
    console.error('✗ Error al corregir roles:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

fixInvalidRoles();
