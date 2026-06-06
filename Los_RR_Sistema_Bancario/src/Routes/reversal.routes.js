import { Router } from 'express';
import {
  requestReversal,
  getUserReversals,
  getPendingReversals,
  approveReversal,
  rejectReversal,
  cancelReversal
} from '../Controllers/reversal.controller.js';
import { validateJWT, requireRole } from '../Middleware/validate-jwt.js';

const router = Router();
router.use(validateJWT);

/**
 * @swagger
 * /reversals/request:
 *   post:
 *     summary: Solicitar reversión de una transferencia (máximo 24 horas desde la transacción)
 *     tags: [Reversiones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - reason
 *             properties:
 *               transactionId:
 *                 type: string
 *                 example: "60d5ec49c1234567890abcde"
 *               reason:
 *                 type: string
 *                 enum:
 *                   - Error de transferencia
 *                   - Transferencia duplicada
 *                   - Transferencia no autorizada
 *                   - Cambio de opinión
 *                   - Otro
 *               additionalInfo:
 *                 type: string
 *                 example: "Detalles adicionales de la solicitud"
 *     responses:
 *       201:
 *         description: Reversión solicitada exitosamente
 *       400:
 *         description: Datos inválidos o condiciones no cumplidas
 *       404:
 *         description: Transacción no encontrada
 */
router.post('/request', requestReversal);

/**
 * @swagger
 * /reversals:
 *   get:
 *     summary: Obtener mis reversiones solicitadas
 *     tags: [Reversiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, COMPLETED, REJECTED, CANCELLED]
 *     responses:
 *       200:
 *         description: Lista de mis reversiones
 */
router.get('/', getUserReversals);

/**
 * @swagger
 * /reversals/pending:
 *   get:
 *     summary: Reversiones pendientes de aprobación (ADMIN)
 *     tags: [Reversiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reversiones pendientes
 */
router.get('/pending', requireRole('ADMIN', 'SUPER_ADMIN'), getPendingReversals);

/**
 * @swagger
 * /reversals/{reversalId}/approve:
 *   post:
 *     summary: Aprobar y procesar reversión (ADMIN)
 *     tags: [Reversiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reversalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reversión aprobada y procesada
 *       400:
 *         description: No se puede procesar (estado inválido o fondos insuficientes)
 */
router.post('/:reversalId/approve', requireRole('ADMIN', 'SUPER_ADMIN'), approveReversal);

/**
 * @swagger
 * /reversals/{reversalId}/reject:
 *   post:
 *     summary: Rechazar solicitud de reversión (ADMIN)
 *     tags: [Reversiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reversalId
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
 *               reason:
 *                 type: string
 *                 example: "Fondos insuficientes en cuenta destino"
 *     responses:
 *       200:
 *         description: Reversión rechazada
 */
router.post('/:reversalId/reject', requireRole('ADMIN', 'SUPER_ADMIN'), rejectReversal);

/**
 * @swagger
 * /reversals/{reversalId}/cancel:
 *   delete:
 *     summary: Cancelar mi solicitud de reversión
 *     tags: [Reversiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reversalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Solicitud de reversión cancelada
 */
router.delete('/:reversalId/cancel', cancelReversal);

export default router;
