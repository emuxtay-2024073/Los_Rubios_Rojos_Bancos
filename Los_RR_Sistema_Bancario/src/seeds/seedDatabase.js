import { User } from "../Models/user.model.js";
import { Account } from "../Models/account.model.js";
import { Transaction } from "../Models/transaction.model.js";
 
/**
 * Seed de base de datos - genera usuarios y operaciones de prueba
 * Se ejecuta automáticamente al iniciar si no existen usuarios
 *
 * IMPORTANTE: NO pre-hashear contraseñas aquí. El modelo User tiene un
 * pre('save') hook que hashea automáticamente. Si se pasa el hash ya hecho,
 * el hook lo volvería a hashear y el login fallaría siempre.
 */
 
export const seedDatabase = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: 'SUPER_ADMIN' })
      .select('+emailVerified +emailVerificationToken');
 
    console.log("Iniciando seed de base de datos...");
 
    if (existingSuperAdmin) {
      console.log("SUPER_ADMIN existente encontrado.");
      if (!existingSuperAdmin.emailVerified) {
        existingSuperAdmin.emailVerified = true;
        existingSuperAdmin.emailVerificationToken = null;
        await existingSuperAdmin.save();
        console.log(`SUPER_ADMIN existente ${existingSuperAdmin.email} marcado como verificado.`);
      }
      console.log("Seed ya ejecutado anteriormente. No se crearán nuevos usuarios.");
      return;
    }
 
    const defaultSuperEmail    = process.env.SUPER_ADMIN_EMAIL    || 'superadmin@banco.com';
    const defaultSuperPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const defaultClientEmail   = process.env.CLIENT_EMAIL         || 'cliente@banco.com';
    const defaultClientPassword= process.env.CLIENT_PASSWORD      || 'Client123!';
    const defaultAdminEmail    = process.env.TEST_ADMIN_EMAIL     || 'admin@banco.com';
    const defaultAdminPassword = process.env.TEST_ADMIN_PASSWORD  || 'Admin123!';
 
    // Pasar contraseñas en texto plano — el pre('save') hook del modelo las hashea
    const superAdmin = await User.create({
      username: "super_admin",
      email: defaultSuperEmail,
      password: defaultSuperPassword,
      role: "SUPER_ADMIN",
      isActive: true,
      emailVerified: true,
      emailVerificationToken: null,
    });
 
    console.log("Usuario inicial creado:");
    console.log(`   - SUPER_ADMIN: ${superAdmin.email} / ${defaultSuperPassword}`);
 
    const user1 = await User.create({
      username: 'cliente_prueba',
      email: defaultClientEmail,
      password: defaultClientPassword,
      role: 'USER',
      isActive: true,
      emailVerified: true,
    });
 
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
 
    // Crear cuentas bancarias para usuarios de prueba
    const account1 = await Account.create({
      userId: user1._id.toString(),
      accountNumber: "ACC100001",
      type: "monetaria",
      balance: 5000.0,
      currency: "GTQ",
      isActive: true,
    });
 
    const account2 = await Account.create({
      userId: user2._id.toString(),
      accountNumber: "ACC100002",
      type: "corriente",
      balance: 2500.0,
      currency: "GTQ",
      isActive: true,
    });
 
    // Crear transacciones de prueba
    const transaction1 = await Transaction.create({
      type: "TRANSFERENCIA",
      amount: 500.00,
      originAccount: account1._id,
      destinationAccount: account2._id,
      description: "Transferencia de prueba inicial",
      currency: "GTQ",
      exchangeRate: 1.00,
      isReversed: false,
    });
 
    const transaction2 = await Transaction.create({
      type: "TRANSFERENCIA",
      amount: 250.00,
      originAccount: account2._id,
      destinationAccount: account1._id,
      description: "Transferencia de retorno",
      currency: "GTQ",
      exchangeRate: 1.00,
      isReversed: false,
    });
 
    account1.balance = 5000.0 - 500.0 + 250.0;
    account2.balance = 2500.0 + 500.0 - 250.0;
    account1.lastTransaction = new Date();
    account2.lastTransaction = new Date();
    await account1.save();
    await account2.save();
 
    console.log("\n Seed completado exitosamente!");
    console.log("Cuentas: ACC100001 (cliente) y ACC100002 (admin)\n");
 
  } catch (error) {
    console.error("❌ Error al ejecutar seed:", error.message);
    throw error;
  }
};
 