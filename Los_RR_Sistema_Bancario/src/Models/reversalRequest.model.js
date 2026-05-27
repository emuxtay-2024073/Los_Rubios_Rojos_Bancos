import mongoose from "mongoose";
 
/**
 * Modelo de Reversión de Transferencias
 * 
 * Estados:
 * - PENDING: Solicitud en espera de procesamiento
 * - APPROVED: Aprobada por admin o sistema
 * - COMPLETED: Reversión completada exitosamente
 * - REJECTED: Rechazada (fondos insuficientes, tiempo límite, etc)
 * - CANCELLED: Cancelada por el usuario
 * 
 * NOTA: transactionId NO es unique a nivel de BD.
 * La unicidad se controla en el controlador: solo se bloquea
 * si ya existe una reversión en estado PENDING o APPROVED.
 * Esto permite reintentar tras un rechazo o cancelación.
 */
const reversalRequestSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      // unique: true  <-- ELIMINADO: permitir múltiples intentos tras rechazo/cancelación
      index: true,
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
 
reversalRequestSchema.index({ requestedBy: 1, status: 1 });
reversalRequestSchema.index({ status: 1, createdAt: -1 });
reversalRequestSchema.index({ transactionId: 1, status: 1 }); // para la consulta de duplicados en el controlador
 
export const ReversalRequest = mongoose.model(
  "ReversalRequest",
  reversalRequestSchema
);