import { User } from "../Models/user.model.js";
import { isEmailValid, isValidPassword, isNonEmptyString, normalizeEmail } from "../Helpers/validators.js";

const AUTH_ROLES = ["USER", "ADMIN", "SUPER_ADMIN"];

export const createUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
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
            role: "USER",
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

export const getAllUsers = async (req, res) => {
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

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("-password -__v");
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado",
            });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error al obtener usuario",
        });
    }
};

export const changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { newRole } = req.body;

        // Validar que el nuevo rol sea válido
        if (!AUTH_ROLES.includes(newRole)) {
            return res.status(400).json({
                success: false,
                message: `Rol inválido. Roles permitidos: ${AUTH_ROLES.join(", ")}`,
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado",
            });
        }

        // Prevenir que se cambie el rol del SUPER_ADMIN a otro
        if (user.role === "SUPER_ADMIN" && newRole !== "SUPER_ADMIN") {
            return res.status(403).json({
                success: false,
                message: "No se puede cambiar el rol del Super Admin",
            });
        }

        const oldRole = user.role;
        user.role = newRole;
        await user.save();

        res.json({
            success: true,
            message: `Rol del usuario cambió de ${oldRole} a ${newRole}`,
            user: await user.lean().select("-password -__v"),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error al cambiar el rol del usuario",
        });
    }
};