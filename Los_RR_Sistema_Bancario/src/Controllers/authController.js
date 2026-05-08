import { User } from "../Models/user.model.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// =====================================================
// REGISTRO DE USUARIO
// Maneja la creación de nuevos usuarios en el sistema
// =====================================================
export const register = async (req, res) => {
    try {
        // Extraemos los datos del cuerpo de la petición
        const { username, email, password, role } = req.body;
        
        // Validación básica de campos obligatorios
        if (!username || !email || !password) {
            return res.status(400).json({ 
                error: "Faltan campos obligatorios: username, email y password son requeridos" 
            });
        }

        // Verificamos si el email ya existe en la base de datos
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                error: "Ya existe un usuario con este email" 
            });
        }

        // Creamos el nuevo usuario - la contraseña se hashea automáticamente en el modelo
        const user = await User.create({ 
            username: username.trim(), 
            email: email.toLowerCase(), 
            password,  // Se hashea en el pre-save hook del modelo
            role: role || 'Cliente'
        });
        
        // Respondemos con éxito, sin incluir la contraseña
        res.status(201).json({
            success: true,
            message: "Usuario registrado correctamente",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
        
    } catch (err) {
        console.error("Error durante el registro:", err);
        res.status(400).json({ error: err.message });
    }
};

// =====================================================
// INICIO DE SESIÓN
// Valida las credenciales y genera un token JWT
// =====================================================
export const login = async (req, res) => {
    try {
        // Obtenemos email y password del request
        const { email, password } = req.body;
        
        // Verificamos que ambos campos estén presentes
        if (!email || !password) {
            return res.status(400).json({ 
                error: "Se requieren email y contraseña" 
            });
        }

        // Buscamos al usuario por email (convertido a minúsculas para consistencia)
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ 
                error: "Credenciales incorrectas" 
            });
        }

        // Verificamos que la contraseña coincida con el hash almacenado
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: "Credenciales incorrectas" 
            });
        }

        // Generamos el token JWT con la información del usuario
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'tu_secreto_aqui',
            { 
                expiresIn: '8h',
                issuer: process.env.JWT_ISSUER || 'SistemaBancario',
                audience: process.env.JWT_AUDIENCE || 'BankingAPI'
            }
        );
        
        // Enviamos respuesta exitosa con token y datos del usuario
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (err) {
        console.error("Error durante el login:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

