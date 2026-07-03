import User from "../Models/user.model.postgres.js";

/**
 * Seed de PostgreSQL - genera usuarios de prueba
 * Se ejecuta automáticamente al iniciar si no existen usuarios
 * NOTA: Las cuentas y transacciones se crean en MongoDB vía seedDatabase.js
 */

export const seedPostgres = async () => {
  try {
    console.log("Iniciando seed de PostgreSQL...");

    const defaultSuperEmail    = process.env.SUPER_ADMIN_EMAIL    || 'superadmin@banco.com';
    const defaultSuperPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const defaultClientEmail   = process.env.CLIENT_EMAIL         || 'cliente@banco.com';
    const defaultClientPassword= process.env.CLIENT_PASSWORD      || 'Client123!';
    const defaultAdminEmail    = process.env.TEST_ADMIN_EMAIL     || 'admin@banco.com';
    const defaultAdminPassword = process.env.TEST_ADMIN_PASSWORD  || 'Admin123!';

    // Crear SUPER_ADMIN
    const superAdmin = await User.create({
      username: "super_admin",
      email: defaultSuperEmail,
      password: defaultSuperPassword,
      role: "SUPER_ADMIN",
      isActive: true,
      emailVerified: true,
      emailVerificationToken: null,
    });

    console.log("Usuario inicial creado en PostgreSQL:");
    console.log(`   - SUPER_ADMIN: ${superAdmin.email} / ${defaultSuperPassword}`);

    // Crear USER
    const user1 = await User.create({
      username: 'cliente_prueba',
      email: defaultClientEmail,
      password: defaultClientPassword,
      role: 'USER',
      isActive: true,
      emailVerified: true,
    });

    // Crear ADMIN
    const user2 = await User.create({
      username: 'admin_prueba',
      email: defaultAdminEmail,
      password: defaultAdminPassword,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    });

    console.log(`   - ADMIN:       ${user2.email} / ${defaultAdminPassword}`);
    console.log(`   - USER:        ${user1.email} / ${defaultClientPassword}`);

    console.log("\n Seed de PostgreSQL completado exitosamente!");
    console.log("Usuarios creados en PostgreSQL (cuentas en MongoDB)\n");

  } catch (error) {
    console.error("❌ Error al ejecutar seed de PostgreSQL:", error.message);
    throw error;
  }
};
