import { Beneficiary } from "../Models/beneficiary.model.js";
import { Account } from "../Models/account.model.js";
import { isAdmin } from "../Helpers/roleHelpers.js";
 
/**
 * CONTROLADOR DE BENEFICIARIOS
 *
 * Gestiona cuentas favoritas/beneficiarios que los usuarios pueden guardar
 * para realizar transferencias rápidas sin recordar el ID de la cuenta.
 */
 
/**
 * Busca una cuenta por su accountNumber (ej: "ACC388507") o por su ObjectId de MongoDB.
 * Acepta ambos formatos para mayor compatibilidad con el frontend.
 */
const findAccountByIdOrNumber = async (accountId) => {
  if (/^ACC\d{6}$/.test(accountId)) {
    return await Account.findOne({ accountNumber: accountId, isActive: true });
  }
  return await Account.findOne({ _id: accountId, isActive: true });
};
 
/**
 * Agregar una nueva cuenta como beneficiario
 *
 * @param {Request} req - Datos: { name, accountId, description, isFavorite }
 * @param {Response} res - Respuesta JSON
 *
 * Validaciones:
 * - El usuario no puede agregar su propia cuenta
 * - El nombre debe ser único por usuario
 * - La cuenta debe existir en el sistema
 */
export const addBeneficiary = async (req, res) => {
  try {
    const { name, accountId, description, isFavorite } = req.body;
    const userId = req.user.id;
 
    // Validaciones básicas
    if (!name || !accountId) {
      return res.status(400).json({
        message: "El nombre y accountId son obligatorios",
      });
    }
 
    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({
        message: "El nombre debe tener entre 2 y 50 caracteres",
      });
    }
 
    // CORREGIDO: buscar por accountNumber o ObjectId, y verificar que esté activa
    const account = await findAccountByIdOrNumber(accountId);
    if (!account) {
      return res.status(404).json({
        message: "La cuenta especificada no existe o está deshabilitada",
      });
    }
 
    // Validar que no sea su propia cuenta
    if (account.userId === userId) {
      return res.status(400).json({
        message: "No puedes agregar tu propia cuenta como beneficiario",
      });
    }
 
    // Verificar si el beneficiario ya existe
    const existingBeneficiary = await Beneficiary.findOne({
      userId,
      accountId: account._id,
    });
    if (existingBeneficiary) {
      return res.status(400).json({
        message: "Ya has agregado esta cuenta como beneficiario",
      });
    }
 
    // Crear beneficiario usando el _id real de MongoDB
    const beneficiary = new Beneficiary({
      userId,
      name: name.trim(),
      accountId: account._id,
      accountNumber: account.accountNumber,
      description: description?.trim() || "",
      isFavorite: isFavorite || false,
    });
 
    await beneficiary.save();
 
    res.status(201).json({
      success: true,
      message: "Beneficiario agregado exitosamente",
      beneficiary: {
        id: beneficiary._id,
        name: beneficiary.name,
        accountNumber: beneficiary.accountNumber,
        isFavorite: beneficiary.isFavorite,
        addedAt: beneficiary.addedAt,
      },
    });
  } catch (error) {
    console.error("Error al agregar beneficiario:", error);
    res.status(500).json({
      message: "Error al agregar beneficiario",
      error: error.message,
    });
  }
};
 
/**
 * Listar todos los beneficiarios del usuario
 *
 * @param {Request} req - Parámetros: { favorite } (filtro opcional)
 * @param {Response} res - Respuesta JSON
 *
 * Retorna:
 * - Todos los beneficiarios del usuario si no hay filtro
 * - Solo favoritos si favorite=true
 */
export const getBeneficiaries = async (req, res) => {
  try {
    const userId = req.user.id;
    const userIsAdmin = isAdmin(req.user);
    const { favorite } = req.query;
 
    const query = {};
    if (!userIsAdmin) {
      query.userId = userId;
    }
 
    // Si se solicita solo favoritos
    if (favorite === "true") {
      query.isFavorite = true;
    }
 
    const beneficiaries = await Beneficiary.find(query)
      .sort({ isFavorite: -1, addedAt: -1 })
      .select("-__v");
 
    res.json({
      success: true,
      total: beneficiaries.length,
      beneficiaries,
    });
  } catch (error) {
    console.error("Error al obtener beneficiarios:", error);
    res.status(500).json({
      message: "Error al obtener beneficiarios",
      error: error.message,
    });
  }
};
 
/**
 * Obtener un beneficiario específico
 *
 * @param {Request} req - ID del beneficiario en URL
 * @param {Response} res - Respuesta JSON
 *
 * Validación:
 * - Solo el propietario del beneficiario puede verlo
 */
export const getBeneficiaryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
 
    const beneficiary = await Beneficiary.findById(id);
 
    if (!beneficiary) {
      return res.status(404).json({
        message: "Beneficiario no encontrado",
      });
    }
 
    // Verificar propiedad
    if (beneficiary.userId.toString() !== userId) {
      return res.status(403).json({
        message: "No tienes permiso para acceder a este beneficiario",
      });
    }
 
    res.json({
      success: true,
      beneficiary,
    });
  } catch (error) {
    console.error("Error al obtener beneficiario:", error);
    res.status(500).json({
      message: "Error al obtener beneficiario",
      error: error.message,
    });
  }
};
 
/**
 * Actualizar un beneficiario
 *
 * @param {Request} req - ID y datos actualizables: { name, description, isFavorite }
 * @param {Response} res - Respuesta JSON
 *
 * Solo el propietario puede actualizar
 */
export const updateBeneficiary = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isFavorite } = req.body;
    const userId = req.user.id;
 
    const beneficiary = await Beneficiary.findById(id);
 
    if (!beneficiary) {
      return res.status(404).json({
        message: "Beneficiario no encontrado",
      });
    }
 
    // Verificar propiedad
    if (beneficiary.userId.toString() !== userId) {
      return res.status(403).json({
        message: "No tienes permiso para actualizar este beneficiario",
      });
    }
 
    // Validar nombre si se proporciona
    if (name) {
      if (name.trim().length < 2 || name.trim().length > 50) {
        return res.status(400).json({
          message: "El nombre debe tener entre 2 y 50 caracteres",
        });
      }
      beneficiary.name = name.trim();
    }
 
    if (description !== undefined) {
      beneficiary.description = description.trim();
    }
 
    if (isFavorite !== undefined) {
      beneficiary.isFavorite = Boolean(isFavorite);
    }
 
    await beneficiary.save();
 
    res.json({
      success: true,
      message: "Beneficiario actualizado exitosamente",
      beneficiary: {
        id: beneficiary._id,
        name: beneficiary.name,
        accountNumber: beneficiary.accountNumber,
        isFavorite: beneficiary.isFavorite,
        description: beneficiary.description,
      },
    });
  } catch (error) {
    console.error("Error al actualizar beneficiario:", error);
    res.status(500).json({
      message: "Error al actualizar beneficiario",
      error: error.message,
    });
  }
};
 
/**
 * Eliminar un beneficiario
 *
 * @param {Request} req - ID del beneficiario en URL
 * @param {Response} res - Respuesta JSON
 *
 * Solo el propietario puede eliminar
 */
export const deleteBeneficiary = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
 
    const beneficiary = await Beneficiary.findById(id);
 
    if (!beneficiary) {
      return res.status(404).json({
        message: "Beneficiario no encontrado",
      });
    }
 
    // Verificar propiedad
    if (beneficiary.userId.toString() !== userId) {
      return res.status(403).json({
        message: "No tienes permiso para eliminar este beneficiario",
      });
    }
 
    await Beneficiary.findByIdAndDelete(id);
 
    res.json({
      success: true,
      message: "Beneficiario eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar beneficiario:", error);
    res.status(500).json({
      message: "Error al eliminar beneficiario",
      error: error.message,
    });
  }
};
 
/**
 * Marcar/desmarcar como favorito
 *
 * @param {Request} req - ID del beneficiario
 * @param {Response} res - Respuesta JSON
 */
export const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
 
    const beneficiary = await Beneficiary.findById(id);
 
    if (!beneficiary) {
      return res.status(404).json({
        message: "Beneficiario no encontrado",
      });
    }
 
    if (beneficiary.userId.toString() !== userId) {
      return res.status(403).json({
        message: "No tienes permiso para modificar este beneficiario",
      });
    }
 
    beneficiary.isFavorite = !beneficiary.isFavorite;
    await beneficiary.save();
 
    res.json({
      success: true,
      message: beneficiary.isFavorite
        ? "Agregado a favoritos"
        : "Removido de favoritos",
      isFavorite: beneficiary.isFavorite,
    });
  } catch (error) {
    console.error("Error al cambiar favorito:", error);
    res.status(500).json({
      message: "Error al cambiar favorito",
      error: error.message,
    });
  }
};