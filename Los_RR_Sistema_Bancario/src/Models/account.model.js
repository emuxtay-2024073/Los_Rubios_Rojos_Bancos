import mongoose from "mongoose";

/**
 * Modelo de Cuenta Bancaria Mejorado
 * 
 * Representa una cuenta bancaria con campos para:
 * - Identificación: userId, accountNumber, type
 * - Finanzas: balance, currency
 * - Control: isActive, suspendedAt
 * - Auditoría: createdAt, updatedAt, lastTransaction
 */
const accountSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    accountNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
        match: /^ACC\d{6}$/ // Formato: ACC seguido de 6 dígitos
    },
    type: {
        type: String,
        enum: ['ahorro', 'monetaria', 'corriente'],
        required: true,
        index: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        default: "GTQ", // Por defecto Quetzal guatemalteco
        uppercase: true,
        minlength: 3,
        maxlength: 3 // Código ISO
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    suspendedAt: {
        type: Date,
        default: null
    },
    suspensionReason: {
        type: String,
        maxlength: 200,
        default: ""
    },
    lastTransaction: {
        type: Date,
        default: null
    },
    totalDeposits: {
        type: Number,
        default: 0
    },
    totalWithdrawals: {
        type: Number,
        default: 0
    },
    totalTransfersOut: {
        type: Number,
        default: 0
    },
    totalTransfersIn: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Índices compuestos
accountSchema.index({ userId: 1, type: 1 });
accountSchema.index({ userId: 1, isActive: 1 });
accountSchema.index({ createdAt: -1 });

/**
 * Validación: No permitir cuentas duplicadas por usuario y tipo
 */
accountSchema.pre('save', async function () {
    if (this.isNew) {
        const existingAccount = await mongoose.model('Account').findOne({
            userId: this.userId,
            type: this.type,
            _id: { $ne: this._id }
        });

        if (existingAccount) {
            throw new Error(
                `Ya existe una cuenta de tipo '${this.type}' para este usuario`
            );
        }
    }
});

/**
 * Método para retirar dinero con validaciones
 */
accountSchema.methods.withdraw = async function(amount) {
    if (amount <= 0) {
        throw new Error("El monto debe ser mayor a 0");
    }
    if (this.balance < amount) {
        throw new Error(`Fondos insuficientes. Balance: ${this.balance}, Solicitado: ${amount}`);
    }
    if (!this.isActive) {
        throw new Error("La cuenta está suspendida");
    }
    
    this.balance -= amount;
    this.totalWithdrawals += amount;
    this.lastTransaction = new Date();
    return this.save();
};

/**
 * Método para depositar dinero con validaciones
 */
accountSchema.methods.deposit = async function(amount) {
    if (amount <= 0) {
        throw new Error("El monto debe ser mayor a 0");
    }
    if (!this.isActive) {
        throw new Error("La cuenta está suspendida");
    }
    
    this.balance += amount;
    this.totalDeposits += amount;
    this.lastTransaction = new Date();
    return this.save();
};

/**
 * Método para suspender cuenta
 */
accountSchema.methods.suspend = async function(reason = "") {
    this.isActive = false;
    this.suspendedAt = new Date();
    this.suspensionReason = reason;
    return this.save();
};

/**
 * Método para reactivar cuenta
 */
accountSchema.methods.reactivate = async function() {
    this.isActive = true;
    this.suspendedAt = null;
    this.suspensionReason = "";
    return this.save();
};

export const Account = mongoose.model("Account", accountSchema);
