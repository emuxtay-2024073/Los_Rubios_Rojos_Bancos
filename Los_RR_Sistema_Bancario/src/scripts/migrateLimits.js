import mongoose from 'mongoose';
import { TransactionLimit } from '../Models/transactionLimit.model.js';
import { User } from '../Models/user.model.js';

const MONGO = 'mongodb://127.0.0.1:27017/sistema_bancario';

const run = async () => {
  try {
    await mongoose.connect(MONGO, { });
    console.log('Conectado a MongoDB for migration');

    const cursor = TransactionLimit.find({}).cursor();
    let migrated = 0;
    let total = 0;

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      total++;
      const uid = doc.userId;
      if (!uid) continue;

      // Si ya es ObjectId, saltar
      if (mongoose.isValidObjectId(uid) && typeof uid !== 'string') continue;

      // Si es string y es un hex válido, convertir directamente
      if (typeof uid === 'string' && mongoose.isValidObjectId(uid)) {
        await TransactionLimit.updateOne({ _id: doc._id }, { $set: { userId: mongoose.Types.ObjectId(uid) } });
        migrated++;
        continue;
      }

      // Si es string pero no válido como ObjectId, intentar encontrar usuario por email o username
      if (typeof uid === 'string') {
        const userById = await User.findOne({ _id: uid }).lean();
        if (userById) {
          await TransactionLimit.updateOne({ _id: doc._id }, { $set: { userId: userById._id } });
          migrated++;
          continue;
        }

        const userByEmail = await User.findOne({ email: uid }).lean();
        if (userByEmail) {
          await TransactionLimit.updateOne({ _id: doc._id }, { $set: { userId: userByEmail._id } });
          migrated++;
          continue;
        }

        const userByUsername = await User.findOne({ username: uid }).lean();
        if (userByUsername) {
          await TransactionLimit.updateOne({ _id: doc._id }, { $set: { userId: userByUsername._id } });
          migrated++;
          continue;
        }

        console.log('No se pudo resolver userId para límite', doc._id.toString(), 'userId=', uid);
      }
    }

    console.log(`Proceso completado. Documentos analizados: ${total}. Migrados: ${migrated}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error durante migración:', err);
    process.exit(1);
  }
};

run();
