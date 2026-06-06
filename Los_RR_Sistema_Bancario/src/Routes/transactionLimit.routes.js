import { Router } from 'express';
import {
  getUserLimits,
  setUserLimits,
  setDefaultLimits,
  removeLimitForUser,
  getAllLimits
} from '../Controllers/transactionLimit.controller.js';
import { validateJWT, requireRole } from '../Middleware/validate-jwt.js';

const router = Router();
router.use(validateJWT);

/**
 * @swagger
 * /limits:
 *   get:
 *     summary: Obtener límites vigentes del usuario
 *     tags: [Límites de Transacciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountType
 *         schema:
 *           type: string
 *           enum: [ahorro, monetaria, corriente]
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [DEPOSITO, RETIRO, TRANSFERENCIA]
 *     responses:
 *       200:
 *         description: Límites del usuario
 */
router.get('/', getUserLimits);

/**
 * @swagger
 * /limits/user:
 *   post:
 *     summary: Establecer límites personalizados para usuario (ADMIN)
 *     tags: [Límites de Transacciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *               - maxPerTransaction
 *               - maxDailyTotal
 *               - maxMonthlyTotal
 *               - maxDailyCount
 *             properties:
 *               targetUserId:
 *                 type: string
 *               accountType:
 *                 type: string
 *                 enum: [ahorro, monetaria, corriente]
 *               transactionType:
 *                 type: string
 *                 enum: [DEPOSITO, RETIRO, TRANSFERENCIA]
 *               maxPerTransaction:
 *                 type: number
 *                 example: 10000
 *               maxDailyTotal:
 *                 type: number
 *                 example: 50000
 *               maxMonthlyTotal:
 *                 type: number
 *                 example: 500000
 *               maxDailyCount:
 *                 type: number
 *                 example: 20
 *     responses:
 *       201:
 *         description: Límites establecidos exitosamente
 *       403:
 *         description: Solo administradores pueden hacer esto
 */
router.post('/user', requireRole('ADMIN', 'SUPER_ADMIN'), setUserLimits);

/**
 * @swagger
 * /limits/default:
 *   post:
 *     summary: Establecer límites por defecto del sistema (ADMIN)
 *     tags: [Límites de Transacciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - maxPerTransaction
 *               - maxDailyTotal
 *               - maxMonthlyTotal
 *               - maxDailyCount
 *             properties:
 *               accountType:
 *                 type: string
 *               transactionType:
 *                 type: string
 *               maxPerTransaction:
 *                 type: number
 *               maxDailyTotal:
 *                 type: number
 *               maxMonthlyTotal:
 *                 type: number
 *               maxDailyCount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Límites por defecto establecidos
 */
router.post('/default', requireRole('ADMIN', 'SUPER_ADMIN'), setDefaultLimits);

/**
 * @swagger
 * /limits/{limitId}:
 *   delete:
 *     summary: Eliminar límite personalizado (ADMIN)
 *     tags: [Límites de Transacciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Límite eliminado exitosamente
 */
router.get('/all', requireRole('ADMIN', 'SUPER_ADMIN'), getAllLimits);

router.delete('/:limitId', requireRole('ADMIN', 'SUPER_ADMIN'), removeLimitForUser);

export default router;