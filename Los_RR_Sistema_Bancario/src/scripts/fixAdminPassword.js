import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../Config/database.js';
import { User } from '../Models/user.model.js';

dotenv.config();

const USERS_TO_FIX = [
  {
    email: process.env.SUPER_ADMIN_EMAIL    || 'superadmin@banco.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!',
    username: 'super_admin',
    role: 'SUPER_ADMIN',
  },
  {
    email: process.env.TEST_ADMIN_EMAIL     || 'admin@banco.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'Admin123!',
    username: 'admin_prueba',
    role: 'ADMIN',
  },
  {
    email: process.env.CLIENT_EMAIL         || 'cliente@banco.com',
    password: process.env.CLIENT_PASSWORD   || 'Client123!',
    username: 'cliente_prueba',
    role: 'USER',
  },
];

(async () => {
  try {
    await connectDB();
    console.log('Conectado a MongoDB\n');

    for (const userData of USERS_TO_FIX) {
      const existing = await User.findOne({ email: userData.email }).select('+password');

      if (!existing) {
        console.log(`[SKIP] ${userData.email} no existe en la BD — se creará en el próximo inicio.`);
        continue;
      }

      // Reemplazar contraseña con texto plano — el pre('save') la hasheará una sola vez
      existing.password = userData.password;
      existing.emailVerified = true;
      existing.emailVerificationToken = null;
      existing.isActive = true;
      existing.isLocked = false;
      existing.failedLoginAttempts = 0;
      existing.lockedUntil = null;
      await existing.save();

      console.log(`[OK] ${userData.email} — contraseña reseteada correctamente`);
    }

    console.log('\nScript finalizado. Ya puedes iniciar sesión con las credenciales del seed.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
