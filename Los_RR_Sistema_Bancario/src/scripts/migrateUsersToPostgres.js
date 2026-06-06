import mongoose from 'mongoose';
import sequelize from '../Config/postgres.js';
import User from '../Models/user.model.postgres.js';
import dotenv from 'dotenv';

dotenv.config();

// Importar el modelo antiguo de MongoDB
import { MongoDBUser } from '../Models/user.model.js';

/**
 * Script para migrar usuarios de MongoDB a PostgreSQL
 * Uso: node scripts/migrateUsersToPostgres.js
 */

export const migrateUsers = async () => {
  try {
    console.log('Iniciando migración de usuarios de MongoDB a PostgreSQL...');

    // Conectar a ambas bases de datos
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sistema_bancario';
    await mongoose.connect(mongoUri);
    console.log('✓ Conectado a MongoDB');

    await sequelize.authenticate();
    console.log('✓ Conectado a PostgreSQL');

    // Sincronizar modelos de PostgreSQL
    await sequelize.sync({ alter: false });
    console.log('✓ Tablas de PostgreSQL sincronizadas');

    // Obtener todos los usuarios de MongoDB
    const mongoUsers = await MongoDBUser.find();
    console.log(`Encontrados ${mongoUsers.length} usuarios en MongoDB`);

    if (mongoUsers.length === 0) {
      console.log('No hay usuarios para migrar');
      await sequelize.close();
      await mongoose.disconnect();
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const mongoUser of mongoUsers) {
      try {
        // Verificar si el usuario ya existe en PostgreSQL
        const existingUser = await User.findOne({
          where: { email: mongoUser.email }
        });

        if (existingUser) {
          console.log(`⊘ Usuario ${mongoUser.email} ya existe en PostgreSQL, saltando...`);
          skippedCount++;
          continue;
        }

        // Crear usuario en PostgreSQL
        await User.create({
          id: mongoUser._id.toString(),
          username: mongoUser.username,
          email: mongoUser.email,
          password: mongoUser.password, // Ya está hasheado en MongoDB
          role: mongoUser.role || 'USER',
          isActive: mongoUser.isActive !== false,
          lastLogin: mongoUser.lastLogin,
          deactivatedAt: mongoUser.deactivatedAt,
          failedLoginAttempts: mongoUser.failedLoginAttempts || 0,
          lastFailedLogin: mongoUser.lastFailedLogin,
          isLocked: mongoUser.isLocked || false,
          lockedUntil: mongoUser.lockedUntil,
          emailVerified: mongoUser.emailVerified || false,
          emailVerificationToken: mongoUser.emailVerificationToken,
          passwordResetToken: mongoUser.passwordResetToken,
          passwordResetExpires: mongoUser.passwordResetExpires,
          accountType: mongoUser.accountType || 'ahorro',
        });

        console.log(`✓ Usuario ${mongoUser.email} migrado exitosamente`);
        migratedCount++;
      } catch (error) {
        console.error(`✗ Error migrando usuario ${mongoUser.email}:`, error.message);
      }
    }

    console.log('\n=== Resumen de Migración ===');
    console.log(`Usuarios migrados: ${migratedCount}`);
    console.log(`Usuarios saltados: ${skippedCount}`);
    console.log(`Total procesados: ${mongoUsers.length}`);

    await sequelize.close();
    await mongoose.disconnect();
    console.log('✓ Migración completada y conexiones cerradas');

  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  }
};

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsers();
}

export default migrateUsers;
