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
 *             properties:
 *               fromAccountId:
 *                 type: string
 *               toAccountId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 300.00
 *     responses:
 *       200:
 *         description: Transferencia realizada exitosamente
 *       400:
 *         description: Fondos insuficientes o datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post("/transfer", transfer);

export default router;
