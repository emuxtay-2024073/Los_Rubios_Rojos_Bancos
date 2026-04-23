import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Modelo de Usuario Mejorado
 * 
 * Incluye campos para:
 * - Autenticación y contraseña (hashada con bcrypt)
 * - Gestión de roles y permisos
 * - Control de estado de cuenta (activa/desactivada)
 * - Auditoría (último login, fechas de creación/actualización)
 */
const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        minlength: 3,
        maxlength: 30,
        unique: true,
        index: true
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        index: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: { 
        type: String, 
        required: true, 
        minlength: 6 
    },
    role: { 
        type: String, 
        enum: ['Cliente', 'Admin'],
        default: 'Cliente',
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    deactivatedAt: {
        type: Date,
        default: null
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lastFailedLogin: {
        type: Date,
        default: null
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    lockedUntil: {
        type: Date,
        default: null
    }
}, { timestamps: true });

/**
 * Pre-save hook para hashear contraseña
 * Solo se ejecuta si la contraseña fue modificada
 */
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

/**
 * Método para comparar contraseñas
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Método para registrar intento fallido de login
 */
userSchema.methods.recordFailedLogin = async function() {
    this.failedLoginAttempts += 1;
    this.lastFailedLogin = new Date();
    
    // Bloquear cuenta después de 5 intentos fallidos
    if (this.failedLoginAttempts >= 5) {
        this.isLocked = true;
        this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    }
    
    return this.save();
};

/**
 * Método para resetear intentos fallidos
 */
userSchema.methods.resetFailedLogins = async function() {
    this.failedLoginAttempts = 0;
    this.lastFailedLogin = null;
    return this.save();
};

/**
 * Método para registrar último login
 */
userSchema.methods.recordSuccessfulLogin = async function() {
    this.lastLogin = new Date();
    this.failedLoginAttempts = 0;
    this.lastFailedLogin = null;
    this.isLocked = false;
    this.lockedUntil = null;
    return this.save();
};

export const User = mongoose.model("User", userSchema);

