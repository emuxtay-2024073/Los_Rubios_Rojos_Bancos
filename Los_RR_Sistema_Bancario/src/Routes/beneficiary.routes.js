import { Router } from 'express';
import {
  addBeneficiary,
  getBeneficiaries,
  getBeneficiaryById,
  updateBeneficiary,
  deleteBeneficiary,
  toggleFavorite
} from '../Controllers/beneficiary.controller.js';
import { validateJWT } from '../Middleware/validate-jwt.js';

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
 *                 example: "Cuenta para transferencias rápidas"
 *               isFavorite:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Beneficiario agregado exitosamente
 *       400:
 *         description: Datos inválidos o cuenta ya agregada
 *       403:
 *         description: No permitido agregar propia cuenta
 */
router.post('/', addBeneficiary);

/**
 * @swagger
 * /beneficiaries:
 *   get:
 *     summary: Listar beneficiarios del usuario
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: favorite
 *         schema:
 *           type: boolean
 *         description: Filtrar solo favoritos (true/false)
 *     responses:
 *       200:
 *         description: Lista de beneficiarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: number
 *                 beneficiaries:
 *                   type: array
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
 *         description: ID del beneficiario
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
 *       403:
 *         description: No tienes permiso
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
