import { Router } from 'express';
import { 
    createAccount, 
    getAccounts, 
    getAccountDetails,
    getAccountHistory,
    deposit, 
    withdraw,
    requestDisableAccount,
    getDisableAccountRequests,
    approveDisableAccountRequest,
    rejectDisableAccountRequest,
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
router.post('/create', requireRole('admin', 'cliente'), createAccount);

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
 * /accounts/disable-requests:
 *   get:
 *     summary: Listar solicitudes de deshabilitación de cuentas (ADMIN)
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *         description: Filtrar por estado de la solicitud
 *     responses:
 *       200:
 *         description: Lista de solicitudes de deshabilitación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 */
router.get('/disable-requests', requireRole('admin'), getDisableAccountRequests);

/**
 * @swagger
 * /accounts/disable-requests/{requestId}/approve:
 *   post:
 *     summary: Aprobar solicitud de deshabilitación de cuenta (ADMIN)
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la solicitud
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               responseReason:
 *                 type: string
 *                 example: "Solicitud aprobada por cumplimiento de requisitos"
 *     responses:
 *       200:
 *         description: Solicitud aprobada y cuenta deshabilitada
 *       400:
 *         description: Estado inválido o solicitud no pendiente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 */
router.post('/disable-requests/:requestId/approve', requireRole('admin'), approveDisableAccountRequest);

/**
 * @swagger
 * /accounts/disable-requests/{requestId}/reject:
 *   post:
 *     summary: Rechazar solicitud de deshabilitación de cuenta (ADMIN)
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la solicitud
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               responseReason:
 *                 type: string
 *                 example: "Solicitud rechazada por datos incompletos"
 *     responses:
 *       200:
 *         description: Solicitud rechazada
 *       400:
 *         description: Estado inválido o solicitud no pendiente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 */
router.post('/disable-requests/:requestId/reject', requireRole('admin'), rejectDisableAccountRequest);

/**
 * @swagger
 * /accounts/{accountId}/history:
 *   get:
 *     summary: Obtener historial de movimientos de una cuenta
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cuenta
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DEPOSITO, RETIRO, TRANSFERENCIA]
 *         description: Filtrar por tipo de movimiento
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [in, out]
 *         description: Filtrar por dirección del movimiento respecto a la cuenta
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha mínima de inicio
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha máxima de fin
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por descripción
 *     responses:
 *       200:
 *         description: Historial de movimientos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 *       404:
 *         description: Cuenta no encontrada
 */
router.get('/:accountId/history', getAccountHistory);

/**
 * @swagger
 * /accounts/{accountId}:
 *   get:
 *     summary: Obtener información detallada de una cuenta
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cuenta
 *     responses:
 *       200:
 *         description: Detalles de la cuenta
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 *       404:
 *         description: Cuenta no encontrada
 */
router.get('/:accountId', getAccountDetails);

/**
 * @swagger
 * /accounts/{accountId}/disable-request:
 *   post:
 *     summary: Solicitar deshabilitación de una cuenta bancaria
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cuenta a deshabilitar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Motivo de la solicitud
 *               additionalInfo:
 *                 type: string
 *                 description: Información adicional
 *     responses:
 *       201:
 *         description: Solicitud enviada exitosamente
 *       400:
 *         description: Datos inválidos o solicitud existente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 */
router.post('/:accountId/disable-request', requestDisableAccount);

/**
 * @swagger
 * /accounts/disable-requests:
 *   get:
 *     summary: Listar solicitudes de deshabilitación de cuentas (ADMIN)
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *         description: Filtrar por estado de la solicitud
 *     responses:
 *       200:
 *         description: Lista de solicitudes de deshabilitación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 */
router.get('/disable-requests', requireRole('admin'), getDisableAccountRequests);

/**
 * @swagger
 * /accounts/disable-requests/{requestId}/approve:
 *   post:
 *     summary: Aprobar solicitud de deshabilitación de cuenta (ADMIN)
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la solicitud
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               responseReason:
 *                 type: string
 *                 example: "Solicitud aprobada por cumplimiento de requisitos"
 *     responses:
 *       200:
 *         description: Solicitud aprobada y cuenta deshabilitada
 *       400:
 *         description: Estado inválido o solicitud no pendiente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 */
router.post('/disable-requests/:requestId/approve', requireRole('admin'), approveDisableAccountRequest);

/**
 * @swagger
 * /accounts/disable-requests/{requestId}/reject:
 *   post:
 *     summary: Rechazar solicitud de deshabilitación de cuenta (ADMIN)
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la solicitud
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               responseReason:
 *                 type: string
 *                 example: "Solicitud rechazada por datos incompletos"
 *     responses:
 *       200:
 *         description: Solicitud rechazada
 *       400:
 *         description: Estado inválido o solicitud no pendiente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 */
router.post('/disable-requests/:requestId/reject', requireRole('admin'), rejectDisableAccountRequest);

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
 *             required:
 *               - accountId
 *               - amount
 *             properties:
 *               accountId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 500.00
 *               currency:
 *                 type: string
 *                 example: "USD"
 *                 description: Moneda del depósito. Si no se envía, se asume GTQ.
 *               description:
 *                 type: string
 *                 description: Descripción opcional de la transacción
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
 *             required:
 *               - accountId
 *               - amount
 *             properties:
 *               accountId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 200.00
 *               currency:
 *                 type: string
 *                 example: "USD"
 *                 description: Opcional. Si se desea retirar en otra moneda se convertirá al saldo de la cuenta.
 *               description:
 *                 type: string
 *                 description: Descripción opcional de la transacción
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
