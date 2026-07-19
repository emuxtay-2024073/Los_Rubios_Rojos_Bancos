import { Op } from "sequelize";
import User from "../Models/user.model.postgres.js";

/**
 * Seed de PostgreSQL - genera usuarios de prueba
 * Es idempotente: si un usuario (por username o email) ya existe -por ejemplo,
 * creado por el seed del auth-svc en .NET que comparte esta misma tabla-
 * se omite en vez de fallar.
 * NOTA: Las cuentas y transacciones se crean en MongoDB vía seedDatabase.js
 */

const createIfNotExists = async ({ username, email, password, role }) => {
  const existing = await User.findOne({
    where: { [Op.or]: [{ username }, { email }] },
  });

  if (existing) {
    console.log(`   - Ya existe (omitido): ${role} -> username="${existing.username}" email="${existing.email}"`);
    return existing;
  }

  const created = await User.create({
    username,
    email,
    password,
    role,
    isActive: true,
    emailVerified: true,
    emailVerificationToken: null,
  });

  console.log(`   - Creado: ${role} -> ${created.email} / ${password}`);
  return created;
};

export const seedPostgres = async () => {
  try {
    console.log("Iniciando seed de PostgreSQL...");

    const defaultSuperEmail    = process.env.SUPER_ADMIN_EMAIL    || 'superadmin@banco.com';
    const defaultSuperPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const defaultClientEmail   = process.env.CLIENT_EMAIL         || 'cliente@banco.com';
    const defaultClientPassword= process.env.CLIENT_PASSWORD      || 'Client123!';
    const defaultAdminEmail    = process.env.TEST_ADMIN_EMAIL     || 'admin@banco.com';
    const defaultAdminPassword = process.env.TEST_ADMIN_PASSWORD  || 'Admin123!';

    await createIfNotExists({ username: "super_admin", email: defaultSuperEmail, password: defaultSuperPassword, role: "SUPER_ADMIN" });
    await createIfNotExists({ username: 'cliente_prueba', email: defaultClientEmail, password: defaultClientPassword, role: 'USER' });
    await createIfNotExists({ username: 'admin_prueba', email: defaultAdminEmail, password: defaultAdminPassword, role: 'ADMIN' });

    console.log("\n Seed de PostgreSQL completado (creados u omitidos si ya existían)\n");

  } catch (error) {
    console.error("❌ Error al ejecutar seed de PostgreSQL:", error.message);
  }
};