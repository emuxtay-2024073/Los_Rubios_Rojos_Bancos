import express from "express";
import {
  getTransactions,
  transfer,
} from "../Controllers/transaction.controller.js";
import { validateJWT } from "../Middleware/validate-jwt.js";

const router = express.Router();

router.use(validateJWT);

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Obtener historial de transacciones
 *     tags: [Transacciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DEPOSITO, RETIRO, TRANSFERENCIA]
 *         description: Filtrar por tipo de transacción
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha mínima
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha máxima
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Monto mínimo
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Monto máximo
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: ID de la cuenta para filtrar transacciones específicas (ADMIN)
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [in, out]
 *         description: Dirección del movimiento para cuentas propias
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Texto de búsqueda en la descripción
 *     responses:
 *       200:
 *         description: Lista de transacciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: No autorizado
 */
router.get("/", getTransactions);

/**
 * @swagger
 * /transactions/transfer:
 *   post:
 *     summary: Realizar una transferencia entre cuentas
 *     tags: [Transacciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromAccountId
 *               - toAccountId
 *               - amount
 *             properties:
 *               fromAccountId:
 *                 type: string
 *               toAccountId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 300.00
 *               description:
 *                 type: string
 *                 description: Descripción opcional de la transferencia
 *     responses:
 *       200:
 *         description: Transferencia realizada exitosamente
 *       400:
 *         description: Fondos insuficientes, cuenta inválida, cuenta deshabilitada o datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 */
router.post("/transfer", transfer);

export default router;
