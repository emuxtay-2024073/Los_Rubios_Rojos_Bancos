# Guía de Finalización - Crear Rutas y Endpoints

## Estado Actual
Todos los modelos, controladores y validaciones han sido implementados.  
El siguiente paso es crear las rutas (routes) con documentación Swagger para cada módulo nuevo.

---

## Cómo Crear Rutas - Patrón del Proyecto

El proyecto usa el patrón de Express Router con Swagger JSDoc. Aquí está el formato a seguir:

### 1. BENEFICIARIOS - src/Routes/beneficiary.routes.js

```javascript
import { Router } from 'express';
import {
  addBeneficiary,
  getBeneficiaries,
  getBeneficiaryById,
  updateBeneficiary,
  deleteBeneficiary,
  toggleFavorite
} from '../Controllers/beneficiary.controller.js';
import { validateJWT, requireRole } from '../Middleware/validate-jwt.js';

const router = Router();
router.use(validateJWT);

/**
 * @swagger
 * /beneficiaries:
 *   post:
 *     summary: Agregar una cuenta como beneficiario
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - accountId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Mi cuenta favorita"
 *               accountId:
 *                 type: string
 *                 example: "60d5ec49c1234567890abcde"
 *               description:
 *                 type: string
 *               isFavorite:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Beneficiario agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No permitido agregar propia cuenta
 */
router.post('/', addBeneficiary);

/**
 * @swagger
 * /beneficiaries:
 *   get:
 *     summary: Listar beneficiarios
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: favorite
 *         schema:
 *           type: boolean
 *         description: Filtrar solo favoritos
 *     responses:
 *       200:
 *         description: Lista de beneficiarios
 */
router.get('/', getBeneficiaries);

/**
 * @swagger
 * /beneficiaries/{id}:
 *   get:
 *     summary: Obtener detalles de un beneficiario
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles del beneficiario
 *       404:
 *         description: Beneficiario no encontrado
 */
router.get('/:id', getBeneficiaryById);

/**
 * @swagger
 * /beneficiaries/{id}:
 *   put:
 *     summary: Actualizar beneficiario
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isFavorite:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Beneficiario actualizado
 */
router.put('/:id', updateBeneficiary);

/**
 * @swagger
 * /beneficiaries/{id}:
 *   delete:
 *     summary: Eliminar beneficiario
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Beneficiario eliminado
 */
router.delete('/:id', deleteBeneficiary);

/**
 * @swagger
 * /beneficiaries/{id}/favorite:
 *   patch:
 *     summary: Marcar/desmarcar como favorito
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado favorito actualizado
 */
router.patch('/:id/favorite', toggleFavorite);

export default router;
```

---

### 2. LÍMITES DE TRANSACCIONES - src/Routes/transactionLimit.routes.js

```javascript
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

/**
 * @swagger
 * /limits:
 *   get:
 *     summary: Obtener límites vigentes (usuario)
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
router.get('/', validateJWT, getUserLimits);

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
 *               maxDailyTotal:
 *                 type: number
 *               maxMonthlyTotal:
 *                 type: number
 *               maxDailyCount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Límites establecidos
 *       403:
 *         description: No autorizado
 */
router.post('/user', validateJWT, requireRole('Admin'), setUserLimits);

/**
 * @swagger
 * /limits/default:
 *   post:
 *     summary: Establecer límites por defecto (ADMIN)
 *     tags: [Límites de Transacciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
router.post('/default', validateJWT, requireRole('Admin'), setDefaultLimits);

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
 *         description: Límite eliminado
 */
router.delete('/:limitId', validateJWT, requireRole('Admin'), removeLimitForUser);

/**
 * @swagger
 * /limits/all:
 *   get:
 *     summary: Listar todos los límites (ADMIN)
 *     tags: [Límites de Transacciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de todos los límites
 */
router.get('/all', validateJWT, requireRole('Admin'), getAllLimits);

export default router;
```

---

### 3. REVERSIONES - src/Routes/reversal.routes.js

```javascript
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

/**
 * @swagger
 * /reversals/request:
 *   post:
 *     summary: Solicitar reversión de transferencia
 *     tags: [Reversiones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
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
 *     responses:
 *       201:
 *         description: Reversión solicitada exitosamente
 *       400:
 *         description: Datos inválidos o condiciones no cumplidas
 */
router.post('/request', validateJWT, requestReversal);

/**
 * @swagger
 * /reversals:
 *   get:
 *     summary: Obtener mis reversiones
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
 *         description: Mis reversiones
 */
router.get('/', validateJWT, getUserReversals);

/**
 * @swagger
 * /reversals/pending:
 *   get:
 *     summary: Reversiones pendientes (ADMIN)
 *     tags: [Reversiones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reversiones pendientes
 */
router.get('/pending', validateJWT, requireRole('Admin'), getPendingReversals);

/**
 * @swagger
 * /reversals/{reversalId}/approve:
 *   post:
 *     summary: Aprobar reversión (ADMIN)
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
 */
router.post('/:reversalId/approve', validateJWT, requireRole('Admin'), approveReversal);

/**
 * @swagger
 * /reversals/{reversalId}/reject:
 *   post:
 *     summary: Rechazar reversión (ADMIN)
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
 *     responses:
 *       200:
 *         description: Reversión rechazada
 */
router.post('/:reversalId/reject', validateJWT, requireRole('Admin'), rejectReversal);

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
 *         description: Reversión cancelada
 */
router.delete('/:reversalId/cancel', validateJWT, cancelReversal);

export default router;
```

---

### 4. DIVISAS - src/Routes/currency.routes.js

```javascript
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
 *     summary: Obtener tasa de cambio
 *     tags: [Divisas]
 *     parameters:
 *       - in: query
 *         name: fromCurrency
 *         required: true
 *         schema:
 *           type: string
 *           example: "USD"
 *       - in: query
 *         name: toCurrency
 *         required: true
 *         schema:
 *           type: string
 *           example: "GTQ"
 *     responses:
 *       200:
 *         description: Tasa de cambio
 */
router.get('/rate', getExchangeRate);

/**
 * @swagger
 * /currency/convert:
 *   post:
 *     summary: Convertir moneda
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               fromCurrency:
 *                 type: string
 *               toCurrency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversión realizada
 */
router.post('/convert', validateJWT, convertCurrency);

/**
 * @swagger
 * /currency/rates:
 *   post:
 *     summary: Agregar tasa de cambio (ADMIN)
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromCurrency:
 *                 type: string
 *               toCurrency:
 *                 type: string
 *               rate:
 *                 type: number
 *               source:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tasa agregada
 */
router.post('/rates', validateJWT, requireRole('Admin'), addExchangeRate);

/**
 * @swagger
 * /currency/rates:
 *   get:
 *     summary: Listar tasas de cambio (ADMIN)
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de tasas
 */
router.get('/rates', validateJWT, requireRole('Admin'), getAllExchangeRates);

/**
 * @swagger
 * /currency/history:
 *   get:
 *     summary: Historial de conversiones del usuario
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
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
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
```

---

### 5. GESTIÓN DE USUARIOS - src/Routes/userManagement.routes.js

```javascript
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
 *         description: Mi perfil
 */
router.get('/profile', validateJWT, getMyProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Actualizar mi perfil
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
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado
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
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada
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
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/', validateJWT, requireRole('Admin'), getAllUsers);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Obtener usuario (ADMIN)
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
 */
router.get('/:userId', validateJWT, requireRole('Admin'), getUserById);

/**
 * @swagger
 * /users/{userId}/role:
 *   patch:
 *     summary: Cambiar rol de usuario (ADMIN)
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
 *     responses:
 *       200:
 *         description: Rol actualizado
 */
router.patch('/:userId/role', validateJWT, requireRole('Admin'), changeUserRole);

/**
 * @swagger
 * /users/{userId}/deactivate:
 *   patch:
 *     summary: Desactivar cuenta
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
 *         description: Cuenta desactivada
 */
router.patch('/:userId/deactivate', validateJWT, deactivateAccount);

/**
 * @swagger
 * /users/{userId}/reactivate:
 *   patch:
 *     summary: Reactivar cuenta (ADMIN)
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
 *         description: Cuenta reactivada
 */
router.patch('/:userId/reactivate', validateJWT, requireRole('Admin'), reactivateAccount);

export default router;
```

---

## Actualizar app.js

Una vez creadas todas las rutas, registrarlas en `src/app.js`:

```javascript
// Agregar estas importaciones
import beneficiaryRoutes from "./Routes/beneficiary.routes.js";
import transactionLimitRoutes from "./Routes/transactionLimit.routes.js";
import reversalRoutes from "./Routes/reversal.routes.js";
import currencyRoutes from "./Routes/currency.routes.js";
import userManagementRoutes from "./Routes/userManagement.routes.js";

// Agregar estos middleware de rutas
app.use("/beneficiaries", beneficiaryRoutes);
app.use("/limits", transactionLimitRoutes);
app.use("/reversals", reversalRoutes);
app.use("/currency", currencyRoutes);
app.use("/users", userManagementRoutes);

// Actualizar la configuración de Swagger
const swaggerOptions = {
  definition: {
    // ... configuración existente ...
    apis: [
      "./src/Routes/*.js", // Esto incluye todas las nuevas rutas
    ],
  },
  // ...
};
```

---

## Checklist de Finalización

- [ ] Crear beneficiary.routes.js
- [ ] Crear transactionLimit.routes.js
- [ ] Crear reversal.routes.js
- [ ] Crear currency.routes.js
- [ ] Crear userManagement.routes.js
- [ ] Actualizar app.js con importaciones y registros
- [ ] Probar cada endpoint en Swagger
- [ ] Verificar autenticación JWT en todos
- [ ] Verificar roles (Admin) donde aplica
- [ ] Documentar en README.md
- [ ] Realizar git commit

---

## Verificación de Endpoints

Después de crear las rutas, ir a `http://localhost:3000/api-docs` y verificar que:

1. Todos los tags aparezcan: Beneficiarios, Límites, Reversiones, Divisas, Gestión de Usuarios
2. Cada endpoint tenga documentación completa
3. Los esquemas request/response sean correctos
4. El botón "Authorize" esté disponible en la esquina superior derecha

---

**Próximo paso:** Ejecutar los comandos para crear los archivos de rutas y registrarlos en app.js.
