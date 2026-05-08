import mongoose from "mongoose";

/**
 * Modelo de Reversión de Transferencias
 * 
 * Permite solicitar y gestionar reversióndes de transferencias realizadas.
 * Una transferencia puede ser reversada si:
 * - Fue realizada hace menos de 24-48 horas (configurable)
 * - La cuenta destino tiene fondos suficientes
 * - El estado es válido (pendiente o completada)
 * 
 * Estados:
 * - PENDING: Solicitud en espera de procesamiento
 * - APPROVED: Aprobada por admin o sistema
 * - COMPLETED: Reversión completada exitosamente
 * - REJECTED: Rechazada (fondos insuficientes, tiempo límite, etc)
 * - CANCELLED: Cancelada por el usuario
 * 
 * @typedef {Object} ReversalRequest
 * @property {ObjectId} transactionId - ID de la transacción a reversar
 * @property {ObjectId} requestedBy - ID del usuario que solicita la reversión
 * @property {string} reason - Razón de la reversión
 * @property {string} status - Estado de la solicitud
 * @property {number} amount - Monto a reversar
 * @property {Date} requestedAt - Fecha de solicitud
 * @property {Date} processedAt - Fecha de procesamiento
 * @property {ObjectId} processedBy - Admin que procesó la solicitud
 */
const reversalRequestSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    requestedBy: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
      enum: [
        "Error de transferencia",
        "Transferencia duplicada",
        "Transferencia no autorizada",
        "Cambio de opinión",
        "Otro",
      ],
    },
    additionalInfo: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "COMPLETED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    originalTransaction: {
      fromAccountId: String,
      toAccountId: String,
      amount: Number,
      date: Date,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      maxlength: 200,
      default: null,
    },
  },
  { timestamps: true }
);

// Índices para búsquedas frecuentes
// transactionId ya tiene índice unique, no repetir aquí
reversalRequestSchema.index({ requestedBy: 1, status: 1 });
reversalRequestSchema.index({ status: 1, createdAt: -1 });

export const ReversalRequest = mongoose.model(
  "ReversalRequest",
  reversalRequestSchema
);
