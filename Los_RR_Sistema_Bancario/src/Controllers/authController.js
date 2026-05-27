import { User } from "../Models/user.model.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { isEmailValid, isValidPassword, normalizeEmail } from '../Helpers/validators.js';
import { createAuditLog } from '../Services/log.service.js';

const DEFAULT_ROLE = 'Cliente';
const AUTH_ROLES = ['Cliente', 'Admin'];

// =====================================================
// REGISTRO DE USUARIO
// Maneja la creación de nuevos usuarios en el sistema
// =====================================================
export const register = async (req, res) => {
    try {
        const { username, email, password, role, accountType } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Faltan campos obligatorios: username, email y password son requeridos",
            });
        }

        if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
            return res.status(400).json({
                success: false,
                message: "El nombre de usuario debe tener entre 3 y 30 caracteres",
            });
        }

        if (!isEmailValid(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "El email no tiene un formato válido",
            });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "La contraseña debe tener al menos 6 caracteres",
            });
        }

        const finalRole = AUTH_ROLES.includes(role) ? role : DEFAULT_ROLE;
        const validAccountTypes = ['ahorro', 'monetaria', 'corriente'];
        const finalAccountType = validAccountTypes.includes(accountType) ? accountType : 'ahorro';

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Ya existe un usuario con este email",
            });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            username: username.trim(),
            email: normalizedEmail,
            password,
            role: finalRole,
            emailVerified: false,
            emailVerificationToken: verificationToken,
        });

        // Crear cuenta bancaria automáticamente
        const { Account } = await import('../Models/account.model.js');
        const generarNumeroCuenta = () => "ACC" + Math.floor(100000 + Math.random() * 900000);
        
        const account = await Account.create({
            userId: user._id.toString(),
            accountNumber: generarNumeroCuenta(),
            type: finalAccountType,
            balance: 0,
        });

        await createAuditLog({
            userId: user._id.toString(),
            username: user.username,
            email: user.email,
            action: 'user.register',
            entityType: 'User',
            entityId: user._id.toString(),
            meta: { role: user.role, accountType: finalAccountType },
            ip: req.ip,
        });

        res.status(201).json({
            success: true,
            message: "Usuario registrado correctamente. Revisa tu correo electrónico para verificar tu cuenta antes de iniciar sesión.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
            account: {
                id: account._id,
                accountNumber: account.accountNumber,
                type: account.type,
                balance: account.balance,
            },
        });
    } catch (err) {
        console.error("Error durante el registro:", err);

        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "El email o nombre de usuario ya existe",
            });
        }

        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};

// =====================================================
// INICIO DE SESIÓN
// Valida las credenciales y genera un token JWT
// =====================================================
export const login = async (req, res) => {
    try {
        const { email, password, Email, Password } = req.body;
        const loginEmail = normalizeEmail(email || Email);
        const loginPassword = password || Password;

        if (!loginEmail || !loginPassword) {
            return res.status(400).json({
                success: false,
                message: "Se requieren email y contraseña",
            });
        }

        if (!isEmailValid(loginEmail)) {
            return res.status(400).json({
                success: false,
                message: "El email no tiene un formato válido",
            });
        }

        const user = await User.findOne({ email: loginEmail }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Credenciales incorrectas",
            });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: "Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.",
            });
        }

        if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
            return res.status(403).json({
                success: false,
                message: "Cuenta bloqueada por múltiples intentos fallidos. Intenta más tarde.",
            });
        }

        if (user.lockedUntil && user.lockedUntil <= new Date()) {
            user.isLocked = false;
            user.failedLoginAttempts = 0;
            user.lockedUntil = null;
            await user.save();
        }

        const isPasswordValid = await user.comparePassword(loginPassword);
        if (!isPasswordValid) {
            await user.recordFailedLogin();
            return res.status(401).json({
                success: false,
                message: "Credenciales incorrectas",
            });
        }

        await user.recordSuccessfulLogin();

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET || 'tu_secreto_aqui',
            {
                expiresIn: '8h',
                issuer: process.env.JWT_ISSUER || 'SistemaBancario',
                audience: process.env.JWT_AUDIENCE || 'BankingAPI',
            }
        );

        await createAuditLog({
            userId: user._id.toString(),
            username: user.username,
            email: user.email,
            action: 'user.login',
            entityType: 'User',
            entityId: user._id.toString(),
            ip: req.ip,
        });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("Error durante el login:", err);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};

// =====================================================
// VERIFICACIÓN DE EMAIL
// Confirma el correo del usuario mediante token
// =====================================================
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token de verificación requerido",
            });
        }

        const user = await User.findOne({ emailVerificationToken: token }).select('+emailVerificationToken');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Token de verificación inválido o ya utilizado",
            });
        }

        user.emailVerified = true;
        user.emailVerificationToken = null;
        await user.save();

        res.json({
            success: true,
            message: "Correo verificado correctamente. Ya puedes iniciar sesión.",
        });
    } catch (err) {
        console.error("Error durante la verificación de email:", err);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};
 