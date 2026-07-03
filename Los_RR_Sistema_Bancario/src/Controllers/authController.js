import User from "../Models/user.model.postgres.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { isEmailValid, isValidPassword, normalizeEmail } from '../Helpers/validators.js';
import { createAuditLog } from '../Services/log.service.js';
import { sendVerificationEmail } from '../Services/email.service.js';
 
// =====================================================
// HELPERS
// =====================================================
const signToken = (user) => {
    const secret = process.env.JWT_SECRET || 'tu_secreto_aqui';
    const issuer = process.env.JWT_ISSUER || 'SistemaBancario';
    const audience = process.env.JWT_AUDIENCE || 'BankingAPI';
 
    return jwt.sign(
        {
            sub: user.id,   // claim estándar — buscado por validate-jwt y authStore
            id: user.id,    // alias por compatibilidad
            email: user.email,
            role: user.role,
        },
        secret,
        {
            expiresIn: '8h',
            issuer,
            audience,
        }
    );
};
 
const signRefreshToken = (userId) => {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'tu_secreto_aqui';
    return jwt.sign(
        { sub: userId.toString(), type: 'refresh' },
        secret,
        { expiresIn: '7d' }
    );
};
 
// =====================================================
// REGISTRO DE USUARIO
// =====================================================
export const register = async (req, res) => {
    try {
        const { username, email, password, accountType, phoneNumber, dpi } = req.body;
        const normalizedEmail = normalizeEmail(email);
 
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Faltan campos obligatorios: username, email y password son requeridos",
            });
        }

        if (phoneNumber) {
            const phoneRegex = /^[+]?([0-9]{1,3})?[\s.-]?[(]?[0-9]{3}[)]?[\s.-]?[0-9]{3,4}[\s.-]?[0-9]{4}$/;
            if (!phoneRegex.test(phoneNumber)) {
                return res.status(400).json({
                    success: false,
                    message: "El número de teléfono no tiene un formato válido",
                });
            }
        }

        if (dpi) {
            const dpiRegex = /^[0-9]{13,15}$/;
            if (!dpiRegex.test(dpi)) {
                return res.status(400).json({
                    success: false,
                    message: "El DPI debe contener entre 13 y 15 dígitos",
                });
            }
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
 
        const finalRole = 'USER';
        const validAccountTypes = ['ahorro', 'monetaria', 'corriente'];
        const finalAccountType = validAccountTypes.includes(accountType) ? accountType : 'ahorro';
 
        const existingUser = await User.findOne({ where: { email: normalizedEmail } });
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
            phoneNumber,
            dpi,
            password,
            role: finalRole,
            emailVerified: false,
            emailVerificationToken: verificationToken,
            accountType: finalAccountType,
        });
 
        const { Account } = await import('../Models/account.model.js');
        const generarNumeroCuenta = () => "ACC" + Math.floor(100000 + Math.random() * 900000);
 
        const account = await Account.create({
            userId: user.id,
            accountNumber: generarNumeroCuenta(),
            type: finalAccountType,
            balance: 0,
        });
 
        await createAuditLog({
            userId: user.id,
            username: user.username,
            email: user.email,
            action: 'user.register',
            entityType: 'User',
            entityId: user.id,
            meta: { role: user.role, accountType: finalAccountType },
            ip: req.ip,
        });
 
        const emailResult = await sendVerificationEmail(user, verificationToken);

        console.log('Email service result:', emailResult);

        res.status(201).json({
            success: true,
            emailVerificationRequired: true,
            verificationUrl: emailResult?.skipped ? emailResult.devLink : undefined,
            emailSkipped: emailResult?.skipped,
            emailError: emailResult?.error,
            message: emailResult?.skipped 
                ? "Usuario registrado correctamente. El servicio de correo no está configurado. Usa el link de desarrollo para verificar tu cuenta."
                : "Usuario registrado correctamente. Revisa tu correo electrónico para verificar tu cuenta antes de iniciar sesión.",
            user: {
                id: user.id,
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
 
        if (err.name === 'SequelizeUniqueConstraintError') {
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
 
        const user = await User.findOne({ where: { email: loginEmail } });
 
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
 
        const token = signToken(user);
        const refreshToken = signRefreshToken(user.id);
 
        await createAuditLog({
            userId: user.id,
            username: user.username,
            email: user.email,
            action: 'user.login',
            entityType: 'User',
            entityId: user.id,
            ip: req.ip,
        });
 
        res.json({
            success: true,
            token,
            accessToken: token,      // alias para compatibilidad con el interceptor del frontend
            refreshToken,
            expiresIn: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            user: {
                id: user.id,
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
// REFRESH TOKEN
// Renueva el access token usando el refresh token
// =====================================================
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken: incomingRefresh } = req.body;
 
        if (!incomingRefresh) {
            return res.status(400).json({
                success: false,
                message: "Refresh token requerido",
            });
        }
 
        const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'tu_secreto_aqui';
 
        let decoded;
        try {
            decoded = jwt.verify(incomingRefresh, secret);
        } catch {
            return res.status(401).json({
                success: false,
                message: "Refresh token inválido o expirado",
                error: "INVALID_REFRESH_TOKEN",
            });
        }
 
        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: "Token inválido",
                error: "INVALID_TOKEN_TYPE",
            });
        }
 
        const user = await User.findByPk(decoded.sub);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Usuario no encontrado o inactivo",
            });
        }
 
        const newAccessToken = signToken(user);
        const newRefreshToken = signRefreshToken(user.id);
 
        res.json({
            success: true,
            token: newAccessToken,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            userDetails: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("Error en refresh token:", err);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};
 
// =====================================================
// VERIFICACIÓN DE EMAIL
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
 
        const user = await User.findOne({ where: { emailVerificationToken: token } });
 
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