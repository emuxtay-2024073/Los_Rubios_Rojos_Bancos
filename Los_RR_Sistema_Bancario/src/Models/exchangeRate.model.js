import mongoose from "mongoose";

/**
 * Modelo de Tasa de Cambio (Exchange Rate)
 * 
 * Almacena las tasas de cambio entre diferentes divisas.
 * Permite conversiones de moneda en transacciones internacionales.
 * 
 * Las tasas son actualizadas periódicamente (por admin o API externa).
 * Cada tasa tiene un registro histórico para auditoría.
 * 
 * @typedef {Object} ExchangeRate
 * @property {string} fromCurrency - Código ISO de moneda origen (USD, GTQ, MXN, etc)
 * @property {string} toCurrency - Código ISO de moneda destino
 * @property {number} rate - Tasa de conversión
 * @property {Date} updatedAt - Última actualización
 * @property {string} source - Fuente de la tasa (manual, API externa, etc)
 */
const exchangeRateSchema = new mongoose.Schema(
  {
    fromCurrency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3, // Código ISO (USD, EUR, GTQ, etc)
      index: true,
    },
    toCurrency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      index: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    source: {
      type: String,
      enum: ["MANUAL", "EXTERNAL_API", "SYSTEM"],
      default: "MANUAL",
    },
    lastUpdatedBy: {
      type: String,
      default: null,
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Crear índice compuesto para buscar tasa exacta
exchangeRateSchema.index({ fromCurrency: 1, toCurrency: 1, isActive: 1 });

/**
 * Modelo de Historial de Conversión
 * 
 * Registra cada conversión realizada para auditoría y reporting.
 * 
 * @typedef {Object} CurrencyConversion
 * @property {ObjectId} userId - Usuario que realizó la conversión
 * @property {string} fromCurrency - Moneda origen
 * @property {string} toCurrency - Moneda destino
 * @property {number} amountFrom - Monto en moneda origen
 * @property {number} amountTo - Monto en moneda destino
 * @property {number} rate - Tasa aplicada
 * @property {ObjectId} transactionId - Transacción asociada (si aplica)
 */
const currencyConversionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    fromCurrency: {
      type: String,
      required: true,
      uppercase: true,
    },
    toCurrency: {
      type: String,
      required: true,
      uppercase: true,
    },
    amountFrom: {
      type: Number,
      required: true,
      min: 0,
    },
    amountTo: {
      type: Number,
      required: true,
      min: 0,
    },
    rate: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
      default: null,
    },
    conversionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Índice para historial de usuario
currencyConversionSchema.index({ userId: 1, conversionDate: -1 });

export const ExchangeRate = mongoose.model("ExchangeRate", exchangeRateSchema);
export const CurrencyConversion = mongoose.model(
  "CurrencyConversion",
  currencyConversionSchema
);
