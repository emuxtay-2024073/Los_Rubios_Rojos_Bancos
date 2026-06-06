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
// Obtener todos los usuarios (Admin o SUPER_ADMIN)
router.get('/admin/all', requireRole('ADMIN', 'SUPER_ADMIN'), getAllUsers);

// Obtener perfil propio
router.get("/profile", getMyProfile);

// Actualizar perfil propio
router.put("/profile", updateProfile);

// Cambiar contraseña
router.put("/change-password", changePassword);

// Obtener usuario por ID (Admin o SUPER_ADMIN) - DESPUÉS de rutas específicas
router.get('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), getUserById);

// Cambiar rol de usuario (solo SUPER_ADMIN)
router.put('/:id/role', requireRole('SUPER_ADMIN'), changeUserRole);

// Desactivar cuenta (Admin o propio usuario)
router.put('/:id/deactivate', deactivateAccount);

// Reactivar cuenta (Admin o SUPER_ADMIN)
router.put('/:id/reactivate', requireRole('ADMIN', 'SUPER_ADMIN'), reactivateAccount);

export default router;
