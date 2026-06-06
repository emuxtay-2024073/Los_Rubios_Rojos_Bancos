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
    logging: false, // Cambiar a console.log para ver queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Conectado a PostgreSQL exitosamente');
    
    // Sincronizar modelos
    await sequelize.sync({ alter: false });
    console.log('✓ Modelos sincronizados con PostgreSQL');
    
    return sequelize;
  } catch (error) {
    console.error('✗ Error conectando a PostgreSQL:', error.message);
    throw error;
  }
};

export default sequelize;
