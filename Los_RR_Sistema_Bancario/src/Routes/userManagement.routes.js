import { Router } from 'express';
import {
  getMyProfile,
  updateProfile,
  changePassword,
  getUserById,
  getAllUsers,
  changeUserRole,
  deactivateAccount,
  reactivateAccount
} from '../Controllers/userManagement.controller.js';
import { validateJWT, requireRole } from '../Middleware/validate-jwt.js';

const router = Router();

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Obtener mi perfil
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mi perfil de usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 */
router.get('/profile', validateJWT, getMyProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Actualizar mi perfil (username, email)
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "nuevo_usuario"
 *               email:
 *                 type: string
 *                 example: "nuevo@email.com"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Datos inválidos o email ya registrado
 */
router.put('/profile', validateJWT, updateProfile);

/**
 * @swagger
 * /users/password:
 *   post:
 *     summary: Cambiar contraseña
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "miContraseñaActual123"
 *               newPassword:
 *                 type: string
 *                 example: "miNuevaContraseña456"
 *               confirmPassword:
 *                 type: string
 *                 example: "miNuevaContraseña456"
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       401:
 *         description: Contraseña actual incorrecta
 */
router.post('/password', validateJWT, changePassword);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar usuarios (ADMIN)
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Cliente, Admin]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por username o email
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: Solo administradores pueden acceder
 */
router.get('/', validateJWT, requireRole('Admin'), getAllUsers);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Obtener datos de un usuario específico (ADMIN)
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:userId', validateJWT, requireRole('Admin'), getUserById);

/**
 * @swagger
 * /users/{userId}/role:
 *   patch:
 *     summary: Cambiar rol de un usuario (ADMIN)
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newRole:
 *                 type: string
 *                 enum: [Cliente, Admin]
 *                 example: "Admin"
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 */
router.patch('/:userId/role', validateJWT, requireRole('Admin'), changeUserRole);

/**
 * @swagger
 * /users/{userId}/deactivate:
 *   patch:
 *     summary: Desactivar una cuenta de usuario
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: "Un usuario puede desactivar su propia cuenta, Admin puede desactivar cualquiera"
 *     responses:
 *       200:
 *         description: Cuenta desactivada exitosamente
 *       403:
 *         description: No tienes permiso para desactivar esta cuenta
 */
router.patch('/:userId/deactivate', validateJWT, deactivateAccount);

/**
 * @swagger
 * /users/{userId}/reactivate:
 *   patch:
 *     summary: Reactivar una cuenta de usuario (ADMIN)
 *     tags: [Gestión de Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cuenta reactivada exitosamente
 */
router.patch('/:userId/reactivate', validateJWT, requireRole('Admin'), reactivateAccount);

export default router;
