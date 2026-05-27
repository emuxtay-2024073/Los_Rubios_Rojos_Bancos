/**
 * Script de migración: fixReversalIndex.js
 * 
 * Elimina el índice único en transactionId de la colección reversalrequests
 * y limpia documentos PENDING basura de intentos anteriores fallidos.
 * 
 * Ejecutar UNA sola vez con:
 *   node src/scripts/fixReversalIndex.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conectado a MongoDB");

  const db = mongoose.connection.db;
  const collection = db.collection("reversalrequests");

  // 1. Listar índices actuales
  const indexes = await collection.indexes();
  console.log("Índices actuales:", indexes.map(i => i.name));

  // 2. Eliminar índice único en transactionId si existe
  const hasUniqueIndex = indexes.some(
    i => i.key?.transactionId === 1 && i.unique === true
  );

  if (hasUniqueIndex) {
    await collection.dropIndex("transactionId_1");
    console.log("✅ Índice único 'transactionId_1' eliminado");
  } else {
    console.log("ℹ️  El índice único ya no existe, nada que eliminar");
  }

  // 3. Limpiar documentos PENDING basura de intentos anteriores fallidos
  const deleted = await collection.deleteMany({ status: "PENDING" });
  console.log(`🗑️  Documentos PENDING eliminados: ${deleted.deletedCount}`);

  console.log("✅ Migración completada");
  await mongoose.disconnect();
};

run().catch(err => {
  console.error("Error en migración:", err);
  process.exit(1);
});
