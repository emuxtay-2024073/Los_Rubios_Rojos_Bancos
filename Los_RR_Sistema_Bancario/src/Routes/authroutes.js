import { Router } from 'express';
import { register, login, verifyEmail, refreshToken } from '../Controllers/authController.js';
import { getAllUsers } from '../Controllers/userManagement.controller.js';
import { validateJWT, requireRole } from '../Middleware/validate-jwt.js';
import { loginRateLimiter } from '../Middleware/rateLimiter.js';
 
const router = Router();
 
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "usuario123"
 *               email:
 *                 type: string
 *                 example: "usuario@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Datos inválidos o email ya registrado
 */
router.post('/register', register);
 
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Autenticación]
 *     description: Obtén tu token JWT aquí. Luego copia el token y usa el botón "Authorize" arriba para acceder a otros endpoints.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "usuario@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso, retorna token JWT
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', loginRateLimiter, login);
 
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar access token usando refresh token
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado exitosamente
 *       401:
 *         description: Refresh token inválido o expirado
 */
router.post('/refresh', refreshToken);
 
// Verificar email mediante token
router.get('/verify-email', verifyEmail);
 
// Obtener todos los usuarios (Admin)
router.get('/users', validateJWT, requireRole('ADMIN', 'SUPER_ADMIN'), getAllUsers);
 
export default router;
 