import express from "express";
import { createUser, getUsers } from "../Controllers/user.controller.js";
import { 
    getMyProfile, 
    updateProfile, 
    changePassword, 
    getUserById, 
    getAllUsers, 
    changeUserRole, 
    deactivateAccount, 
    reactivateAccount 
} from "../Controllers/userManagement.controller.js";
import { validateJWT, requireRole } from '../Middleware/validate-jwt.js';

const router = express.Router();

// Crear usuario
router.post("/", createUser);

// Obtener todos los usuarios (sin autenticación)
router.get("/", getUsers);

// Rutas de gestión de usuarios con autenticación
router.use(validateJWT);

// IMPORTANTE: Rutas específicas ANTES de rutas parametrizadas
// Obtener todos los usuarios (Admin)
router.get('/admin/all', requireRole('admin'), getAllUsers);

// Obtener perfil propio
router.get("/profile", getMyProfile);

// Actualizar perfil propio
router.put("/profile", updateProfile);

// Cambiar contraseña
router.put("/change-password", changePassword);

// Obtener usuario por ID (Admin) - DESPUÉS de rutas específicas
router.get('/:id', requireRole('admin'), getUserById);

// Cambiar rol de usuario (Admin)
router.put('/:id/role', requireRole('admin'), changeUserRole);

// Desactivar cuenta (Admin)
router.put('/:id/deactivate', requireRole('admin'), deactivateAccount);

// Reactivar cuenta (Admin)
router.put('/:id/reactivate', requireRole('admin'), reactivateAccount);

export default router;
