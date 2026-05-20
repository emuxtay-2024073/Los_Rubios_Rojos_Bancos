import mongoose from "mongoose";

/**
 * Modelo de Límites de Transacciones
 * 
 * Gestiona los límites de transacciones por usuario y tipo de transacción.
 * Permite control sobre:
 * - Límite máximo por transacción
 * - Límite diario acumulado
 * - Límite mensual acumulado
 * - Número máximo de transacciones por día
 * 
 * Los administradores pueden establecer límites por defecto,
 * y los usuarios pueden tener límites personalizados.
 * 
 * @typedef {Object} TransactionLimit
 * @property {string} userId - ID del usuario (opcional si es límite por defecto)
 * @property {string} accountType - Tipo de cuenta (ahorro, monetaria, corriente)
 * @property {string} transactionType - Tipo de transacción (DEPOSITO, RETIRO, TRANSFERENCIA)
 * @property {number} maxPerTransaction - Monto máximo por transacción
 * @property {number} maxDailyTotal - Límite total diario
 * @property {number} maxMonthlyTotal - Límite total mensual
 * @property {number} maxDailyCount - Máximo número de transacciones por día
 * @property {boolean} isDefault - Si es límite por defecto (aplicado a todos)
 */
const transactionLimitSchema = new mongoose.Schema(
  {
      userId: {
        type: String,
        default: null, // null si es límite por defecto
        index: true,
      },
    accountType: {
      type: String,
      enum: ["ahorro", "monetaria", "corriente"],
      default: null, // null si aplica a todos
    },
    transactionType: {
      type: String,
      enum: ["DEPOSITO", "RETIRO", "TRANSFERENCIA"],
      default: null, // null si aplica a todos
    },
    maxPerTransaction: {
      type: Number,
      default: 10000, // Monto máximo por transacción
      min: 0,
    },
    maxDailyTotal: {
      type: Number,
      default: 50000, // Total diario
      min: 0,
    },
    maxMonthlyTotal: {
      type: Number,
      default: 500000, // Total mensual
      min: 0,
    },
    maxDailyCount: {
      type: Number,
      default: 20, // Máximo de transacciones por día
      min: 0,
    },
    isDefault: {
      type: Boolean,
      default: false, // Marca si es límite por defecto
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Índice para búsquedas rápidas
transactionLimitSchema.index({ userId: 1, accountType: 1, transactionType: 1 });

export const TransactionLimit = mongoose.model(
  "TransactionLimit",
  transactionLimitSchema
);
