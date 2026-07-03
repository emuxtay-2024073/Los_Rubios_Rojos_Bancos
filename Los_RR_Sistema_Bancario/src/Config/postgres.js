import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'bancos_db',
  process.env.DB_USER || 'RUBIOSR',
  process.env.DB_PASSWORD || 'Bancos123!',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5436,
    dialect: 'postgres',
    logging: console.log, // Habilitar logging para ver queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Importar modelos para asegurar que se registren con Sequelize
import User from '../Models/user.model.postgres.js';

export const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Conectado a PostgreSQL exitosamente');
    
    // Recrear tabla User completamente para eliminar restricciones antiguas
    try {
      await sequelize.query(`DROP TABLE IF EXISTS "User" CASCADE;`);
      console.log('✓ Tabla User eliminada para recrear sin restricciones antiguas');
    } catch (error) {
      console.log('Nota: No se pudo eliminar tabla (puede que no exista)');
    }

    // Crear tabla manualmente
    await sequelize.query(`
      CREATE TABLE "User" (
        "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "Username" VARCHAR(30) NOT NULL UNIQUE,
        "Email" VARCHAR NOT NULL UNIQUE,
        "PasswordHash" VARCHAR NOT NULL,
        "Role" VARCHAR(20) NOT NULL DEFAULT 'USER',
        "IsActive" BOOLEAN DEFAULT true,
        "LastLogin" TIMESTAMP,
        "IsDisabled" BOOLEAN DEFAULT false,
        "DisabledAt" TIMESTAMP,
        "FailedLoginAttempts" INTEGER DEFAULT 0,
        "IsLocked" BOOLEAN DEFAULT false,
        "EmailConfirmed" BOOLEAN DEFAULT false,
        "VerificationToken" VARCHAR,
        "ResetToken" VARCHAR,
        "ResetTokenExpires" TIMESTAMP,
        "AccountType" VARCHAR(20) DEFAULT 'ahorro',
        "Dpi" VARCHAR,
        "PhoneNumber" VARCHAR,
        "LastPasswordChangeAt" TIMESTAMP,
        "DisabilityReason" VARCHAR,
        "DisableRequestReason" VARCHAR,
        "DisableRequestedAt" TIMESTAMP,
        "HasDisableRequest" BOOLEAN DEFAULT false,
        "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabla User creada/verificada');
    
    return sequelize;
  } catch (error) {
    console.error('✗ Error conectando a PostgreSQL:', error.message);
    throw error;
  }
};

export default sequelize;
