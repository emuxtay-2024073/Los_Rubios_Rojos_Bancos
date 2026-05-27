import { User } from "../Models/user.model.js";
import { isEmailValid, isValidPassword, isNonEmptyString, normalizeEmail } from "../Helpers/validators.js";

const AUTH_ROLES = ["Cliente", "Admin"];

export const createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!isNonEmptyString(username) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
            return res.status(400).json({
                success: false,
                message: "Todos los campos son obligatorios",
            });
        }

        if (username.trim().length < 3 || username.trim().length > 30) {
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

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "El email ya está registrado",
            });
        }

        const newUser = new User({
            username: username.trim(),
            email: normalizedEmail,
            password,
            role: AUTH_ROLES.includes(role) ? role : "Cliente",
            isActive: true,
        });

        await newUser.save();

        const returnedUser = await User.findById(newUser._id).select("-password -__v");

        res.status(201).json({
            success: true,
            message: "Usuario creado exitosamente",
            user: returnedUser,
        });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "El email o nombre de usuario ya está registrado",
            });
        }
        res.status(500).json({
            success: false,
            message: "Error al crear usuario",
        });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password -__v");
        res.json({ success: true, users });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error al obtener usuarios",
        });
    }
};