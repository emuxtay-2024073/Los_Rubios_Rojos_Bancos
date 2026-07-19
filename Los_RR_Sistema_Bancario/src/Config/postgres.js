import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_CONNECTION;
const dbHost = process.env.DB_HOST || 'localhost';
const shouldUseSsl =
  dbHost.includes('supabase.com') ||
  databaseUrl?.includes('supabase.com') ||
  ['require', 'true', '1'].includes((process.env.DB_SSL_MODE || '').toLowerCase());

const sequelizeOptions = {
  dialect: 'postgres',
  logging: console.log, // Habilitar logging para ver queries
  dialectOptions: shouldUseSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : undefined,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, sequelizeOptions)
  : new Sequelize(
      process.env.DB_NAME || 'bancos_db',
      process.env.DB_USER || 'RUBIOSR',
      process.env.DB_PASSWORD || 'Bancos123!',
      {
        ...sequelizeOptions,
        host: dbHost,
        port: process.env.DB_PORT || 5436,
      }
    );

// Importar modelos para asegurar que se registren con Sequelize
import User from '../Models/user.model.postgres.js';

export const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Conectado a PostgreSQL exitosamente');

    // Solo se elimina/recrea la tabla "User" en desarrollo, o si se fuerza explícitamente con
    // RESET_DB=true. En producción NUNCA debe borrarse por defecto: esto destruiría a todos los
    // usuarios reales en cada arranque/redeploy.
    const shouldResetDb = process.env.NODE_ENV !== 'production' || process.env.RESET_DB === 'true';
    if (shouldResetDb) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "User" CASCADE;`);
        console.log('✓ Tabla User eliminada para recrear sin restricciones antiguas');
      } catch (error) {
        console.log('Nota: No se pudo eliminar tabla (puede que no exista)');
      }
    } else {
      console.log('NODE_ENV=production: se omite el DROP de la tabla User.');
    }

    // Crear tabla solo si no existe (seguro para producción: no destruye datos existentes)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "User" (
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