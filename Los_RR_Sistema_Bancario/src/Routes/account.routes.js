import { Router } from 'express';
import { 
    createAccount, 
    getAccounts, 
    deposit, 
    withdraw 
} from '../Controllers/account.controller.js';
import { validateJWT, requireRole } from '../Middleware/validate-jwt.js';

const router = Router();
// Todas las rutas de cuentas requieren autenticación
router.use(validateJWT);

/**
 * @swagger
 * /accounts/create:
 *   post:
 *     summary: Crear una nueva cuenta bancaria
 *     tags: [Cuentas]
 *     description: Este endpoint requiere un token JWT válido. Haz click en el botón "Authorize" arriba para ingresar tu token.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: ["ahorro", "monetaria", "corriente"]
 *                 description: Tipo de cuenta a crear
 *                 example: "ahorro"
 *               initialBalance:
 *                 type: number
 *                 description: Saldo inicial (opcional)
 *                 example: 1000.00
 *     responses:
 *       201:
 *         description: Cuenta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 account:
 *                   type: object
 *       400:
 *         description: Datos inválidos o cuenta duplicada
 *       401:
 *         description: No autorizado - token inválido o expirado
 *       403:
 *         description: Permiso denegado
 */
router.post('/create', requireRole('Admin', 'Cliente'), createAccount);

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Obtener cuentas bancarias
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cuentas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: No autorizado
 */
router.get('/', getAccounts);

/**
 * @swagger
 * /accounts/deposit:
 *   post:
 *     summary: Depositar dinero en una cuenta
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 500.00
 *     responses:
 *       200:
 *         description: Depósito realizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/deposit', deposit);

/**
 * @swagger
 * /accounts/withdraw:
 *   post:
 *     summary: Retirar dinero de una cuenta
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 200.00
 *     responses:
 *       200:
 *         description: Retiro realizado exitosamente
 *       400:
 *         description: Fondos insuficientes o datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/withdraw', withdraw);

export default router;
