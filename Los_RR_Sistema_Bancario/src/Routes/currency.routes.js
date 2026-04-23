import { Router } from 'express';
import {
  getExchangeRate,
  convertCurrency,
  addExchangeRate,
  getAllExchangeRates,
  getConversionHistory,
  deactivateExchangeRate
} from '../Controllers/currency.controller.js';
import { validateJWT, requireRole } from '../Middleware/validate-jwt.js';

const router = Router();

/**
 * @swagger
 * /currency/rate:
 *   get:
 *     summary: Obtener tasa de cambio entre dos monedas
 *     tags: [Divisas]
 *     parameters:
 *       - in: query
 *         name: fromCurrency
 *         required: true
 *         schema:
 *           type: string
 *           example: "USD"
 *         description: Moneda origen (código ISO de 3 caracteres)
 *       - in: query
 *         name: toCurrency
 *         required: true
 *         schema:
 *           type: string
 *           example: "GTQ"
 *         description: Moneda destino (código ISO de 3 caracteres)
 *     responses:
 *       200:
 *         description: Tasa de cambio obtenida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 fromCurrency:
 *                   type: string
 *                 toCurrency:
 *                   type: string
 *                 rate:
 *                   type: number
 *       404:
 *         description: Tasa de cambio no disponible
 */
router.get('/rate', getExchangeRate);

/**
 * @swagger
 * /currency/convert:
 *   post:
 *     summary: Convertir monto entre dos monedas
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - fromCurrency
 *               - toCurrency
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100
 *               fromCurrency:
 *                 type: string
 *                 example: "USD"
 *               toCurrency:
 *                 type: string
 *                 example: "GTQ"
 *     responses:
 *       200:
 *         description: Conversión realizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 amount:
 *                   type: number
 *                 convertedAmount:
 *                   type: number
 *                 rate:
 *                   type: number
 */
router.post('/convert', validateJWT, convertCurrency);

/**
 * @swagger
 * /currency/rates:
 *   post:
 *     summary: Agregar o actualizar tasa de cambio (ADMIN)
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromCurrency
 *               - toCurrency
 *               - rate
 *             properties:
 *               fromCurrency:
 *                 type: string
 *                 example: "USD"
 *               toCurrency:
 *                 type: string
 *                 example: "GTQ"
 *               rate:
 *                 type: number
 *                 example: 7.85
 *               source:
 *                 type: string
 *                 enum: [MANUAL, EXTERNAL_API, SYSTEM]
 *     responses:
 *       201:
 *         description: Tasa de cambio guardada exitosamente
 */
router.post('/rates', validateJWT, requireRole('Admin'), addExchangeRate);

/**
 * @swagger
 * /currency/rates:
 *   get:
 *     summary: Listar todas las tasas de cambio (ADMIN)
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filtrar por moneda
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de tasas de cambio
 */
router.get('/rates', validateJWT, requireRole('Admin'), getAllExchangeRates);

/**
 * @swagger
 * /currency/history:
 *   get:
 *     summary: Obtener historial de conversiones del usuario
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fromCurrency
 *         schema:
 *           type: string
 *       - in: query
 *         name: toCurrency
 *         schema:
 *           type: string
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
 *         description: Historial de conversiones
 */
router.get('/history', validateJWT, getConversionHistory);

/**
 * @swagger
 * /currency/rates/{rateId}:
 *   delete:
 *     summary: Desactivar tasa de cambio (ADMIN)
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tasa desactivada
 */
router.delete('/rates/:rateId', validateJWT, requireRole('Admin'), deactivateExchangeRate);

export default router;
