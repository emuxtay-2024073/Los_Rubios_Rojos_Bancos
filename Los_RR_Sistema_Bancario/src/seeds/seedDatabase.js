import { User } from "../Models/user.model.js";
import { Account } from "../Models/account.model.js";
import { Transaction } from "../Models/transaction.model.js";
import bcrypt from "bcryptjs";

/**
 * Seed de base de datos - genera usuarios y operaciones de prueba
 * Se ejecuta automáticamente al iniciar si no existen usuarios
 */

export const seedDatabase = async () => {
  try {
    // Verificar si ya existen usuarios
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("Base de datos ya contiene usuarios. Seed omitido.");
      return;
    }

    console.log("Iniciando seed de base de datos...");

    // Crear 2 usuarios de prueba
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Password123", salt);

    const user1 = await User.create({
      username: "admin_user",
      email: "admin@banco.com",
      password: hashedPassword,
      role: "Admin",
      isActive: true,
    });

    const user2 = await User.create({
      username: "cliente_test",
      email: "cliente@banco.com",
      password: hashedPassword,
      role: "Cliente",
      isActive: true,
    });

    console.log("Usuarios creados:");
    console.log(`   - Admin: ${user1.email} (Contraseña: Password123)`);
    console.log(`   - Cliente: ${user2.email} (Contraseña: Password123)`);

    // Crear cuentas bancarias para ambos usuarios
    const account1 = await Account.create({
      userId: user1._id.toString(),
      accountNumber: "ACC100001",
      type: "monetaria",
      balance: 5000.00,
      currency: "GTQ",
      isActive: true,
    });

    const account2 = await Account.create({
      userId: user2._id.toString(),
      accountNumber: "ACC100002",
      type: "corriente",
      balance: 2500.00,
      currency: "GTQ",
      isActive: true,
    });

    console.log("Cuentas bancarias creadas:");
    console.log(`   - Cuenta Admin: ${account1.accountNumber} - Balance: Q${account1.balance}`);
    console.log(`   - Cuenta Cliente: ${account2.accountNumber} - Balance: Q${account2.balance}`);

    // Crear operaciones de prueba
    const transaction1 = await Transaction.create({
      type: "TRANSFERENCIA",
      amount: 500.00,
      originAccount: account1.accountNumber,
      destinationAccount: account2.accountNumber,
      description: "Transferencia de prueba inicial",
      currency: "GTQ",
      exchangeRate: 1.00,
      isReversed: false,
    });

    const transaction2 = await Transaction.create({
      type: "TRANSFERENCIA",
      amount: 250.00,
      originAccount: account2.accountNumber,
      destinationAccount: account1.accountNumber,
      description: "Transferencia de retorno",
      currency: "GTQ",
      exchangeRate: 1.00,
      isReversed: false,
    });

    // Actualizar balances después de las transacciones
    account1.balance = account1.balance - 500.00 + 250.00; // -500 de primer envío, +250 de retorno
    account2.balance = account2.balance + 500.00 - 250.00; // +500 de primer recibimiento, -250 de retorno
    account1.lastTransaction = new Date();
    account2.lastTransaction = new Date();
    account1.totalTransfersOut = 500.00;
    account1.totalTransfersIn = 250.00;
    account2.totalTransfersOut = 250.00;
    account2.totalTransfersIn = 500.00;
    
    await account1.save();
    await account2.save();

    console.log("Operaciones creadas:");
    console.log(`   - Transferencia 1: Q${transaction1.amount} de Admin a Cliente`);
    console.log(`   - Transferencia 2: Q${transaction2.amount} de Cliente a Admin`);
    console.log(`   - Balance final Admin: Q${account1.balance}`);
    console.log(`   - Balance final Cliente: Q${account2.balance}`);

    console.log("\n Seed completado exitosamente!");
    console.log("Datos de prueba disponibles para testing\n");

  } catch (error) {
    console.error("❌ Error al ejecutar seed:", error.message);
    throw error;
  }
};
