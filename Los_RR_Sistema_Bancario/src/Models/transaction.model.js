import mongoose from "mongoose";

/**
 * Modelo de Transacción Mejorado
 * 
 * Registra todos los movimientos de dinero en el sistema:
 * - DEPOSITO: dinero ingresando a una cuenta
 * - RETIRO: dinero saliendo de una cuenta
 * - TRANSFERENCIA: dinero entre cuentas
 * 
 * Nuevos campos:
 * - isReversed: indica si la transacción fue reversada
 * - reversedAt: fecha cuando fue reversada
 * - reversalRequestId: referencia a la solicitud de reversión
 * - description: detalles adicionales de la transacción
 */
const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["DEPOSITO", "RETIRO", "TRANSFERENCIA"],
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    originAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        index: true
    },
    destinationAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        index: true
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    description: {
        type: String,
        maxlength: 200,
        default: ""
    },
    // Campos para reversión
    isReversed: {
        type: Boolean,
        default: false,
        index: true
    },
    reversedAt: {
        type: Date,
        default: null
    },
    reversalRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReversalRequest',
        default: null
    },
    // Control de conversión de moneda (si aplica)
    currency: {
        type: String,
        default: "GTQ", // Por defecto Quetzal
        uppercase: true
    },
    exchangeRate: {
        type: Number,
        default: 1 // 1 si es misma moneda
    }
}, { timestamps: true });

// Índices compuestos para búsquedas eficientes
transactionSchema.index({ originAccount: 1, date: -1 });
transactionSchema.index({ destinationAccount: 1, date: -1 });
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ isReversed: 1, date: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema); 