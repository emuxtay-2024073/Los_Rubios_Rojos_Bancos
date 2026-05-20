import { TransactionLimit } from "../Models/transactionLimit.model.js";
import { Account } from "../Models/account.model.js";

/**
 * CONTROLADOR DE LÍMITES DE TRANSACCIONES
 * 
 * Gestiona los límites diarios, mensuales y por transacción para usuarios.
 * Los administradores pueden establecer límites globales (por defecto) y personalizados por usuario.
 */

/**
 * Obtener límites vigentes para un usuario
 * 
 * @param {Request} req - Parámetros: { accountType, transactionType } (opcionales)
 * @param {Response} res - Respuesta JSON
 * 
 * Retorna:
 * - Límites personalizados si existen
 * - Si no, límites por defecto del sistema
 * - Si no hay límites, retorna valores por defecto
 */
export const getUserLimits = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { accountType, transactionType } = req.query;

    const query = {};
    if (userId) {
      query.userId = String(userId);
    }

    console.log('getUserLimits - query:', JSON.stringify(query), 'accountType:', accountType, 'transactionType:', transactionType);

    if (accountType) query.accountType = accountType;
    if (transactionType) query.transactionType = transactionType;

    const userLimits = await TransactionLimit.find(query);

    // Si no hay límites personalizados, obtener límites por defecto
    let defaultLimits = [];
    if (userLimits.length === 0) {
      let defaultQuery = { isDefault: true };
      if (accountType) defaultQuery.accountType = accountType;
      if (transactionType) defaultQuery.transactionType = transactionType;

      defaultLimits = await TransactionLimit.find(defaultQuery);
    }

    const limits = userLimits.length > 0 ? userLimits : defaultLimits;

    // Si aún no hay límites, proporcionar valores hardcodeados
    if (limits.length === 0) {
      return res.json({
        success: true,
        message: "Límites por defecto del sistema",
        limits: [
          {
            maxPerTransaction: 10000,
            maxDailyTotal: 50000,
            maxMonthlyTotal: 500000,
            maxDailyCount: 20,
          },
        ],
      });
    }

    res.json({
      success: true,
      isPersonalLimit: userLimits.length > 0,
      limits,
    });
  } catch (error) {
    console.error("Error al obtener límites:", error?.message);
    console.error(error?.stack);
    res.status(500).json({
      message: "Error al obtener límites",
      error: error.message,
    });
  }
};

/**
 * Establecer límites personalizados para un usuario (ADMIN)
 * 
 * @param {Request} req - Datos: userId, accountType, transactionType, límites
 * @param {Response} res - Respuesta JSON
 * 
 * Solo administradores pueden crear límites personalizados
 */
export const setUserLimits = async (req, res) => {
  try {
    const {
      targetUserId,
      accountType,
      transactionType,
      maxPerTransaction,
      maxDailyTotal,
      maxMonthlyTotal,
      maxDailyCount,
    } = req.body;

    // Validar que sea admin
    if (!req.user.roles.some(role => role.toLowerCase() === 'admin')) {
      return res.status(403).json({
        message: "Solo administradores pueden establecer límites personalizados",
      });
    }

    // Validaciones
    if (!targetUserId) {
      return res.status(400).json({
        message: "targetUserId es obligatorio",
      });
    }

    if (maxPerTransaction === undefined ||
      maxDailyTotal === undefined ||
      maxMonthlyTotal === undefined ||
      maxDailyCount === undefined
    ) {
      return res.status(400).json({
        message:
          "Todos los campos de límites son obligatorios: maxPerTransaction, maxDailyTotal, maxMonthlyTotal, maxDailyCount",
      });
    }

    // Validar valores positivos
    if (
      maxPerTransaction < 0 ||
      maxDailyTotal < 0 ||
      maxMonthlyTotal < 0 ||
      maxDailyCount < 0
    ) {
      return res.status(400).json({
        message: "Los valores de límites no pueden ser negativos",
      });
    }

    // Buscar o crear límite
    const normalizedUserId = String(targetUserId);
    let limit = await TransactionLimit.findOne({
      userId: normalizedUserId,
      accountType: accountType || null,
      transactionType: transactionType || null,
    });

    if (!limit) {
      limit = new TransactionLimit({
        userId: normalizedUserId,
        accountType: accountType || null,
        transactionType: transactionType || null,
        maxPerTransaction,
        maxDailyTotal,
        maxMonthlyTotal,
        maxDailyCount,
      });
    } else {
      // Actualizar límites existentes
      limit.maxPerTransaction = maxPerTransaction;
      limit.maxDailyTotal = maxDailyTotal;
      limit.maxMonthlyTotal = maxMonthlyTotal;
      limit.maxDailyCount = maxDailyCount;
    }

    await limit.save();

    res.status(201).json({
      success: true,
      message: "Límites establecidos exitosamente",
      limit,
    });
  } catch (error) {
    console.error("Error al establecer límites:", error);
    res.status(500).json({
      message: "Error al establecer límites",
      error: error.message,
    });
  }
};

/**
 * Establecer límites por defecto del sistema (ADMIN SUPER)
 * 
 * @param {Request} req - Datos de límites por defecto
 * @param {Response} res - Respuesta JSON
 * 
 * Solo super-administradores
 */
export const setDefaultLimits = async (req, res) => {
  try {
    const {
      accountType,
      transactionType,
      maxPerTransaction,
      maxDailyTotal,
      maxMonthlyTotal,
      maxDailyCount,
    } = req.body;

    // Validar permisos de super-admin
    if (!req.user.roles.some(role => role.toLowerCase() === 'admin')) {
      return res.status(403).json({
        message: "Solo administradores pueden establecer límites por defecto",
      });
    }

    if (maxPerTransaction === undefined ||
      maxDailyTotal === undefined ||
      maxMonthlyTotal === undefined ||
      maxDailyCount === undefined
    ) {
      return res.status(400).json({
        message: "Todos los campos de límites son obligatorios",
      });
    }

    // Buscar o crear límite por defecto
    let limit = await TransactionLimit.findOne({
      isDefault: true,
      accountType: accountType || null,
      transactionType: transactionType || null,
    });

    if (!limit) {
      limit = new TransactionLimit({
        userId: null,
        accountType: accountType || null,
        transactionType: transactionType || null,
        maxPerTransaction,
        maxDailyTotal,
        maxMonthlyTotal,
        maxDailyCount,
        isDefault: true,
      });
    } else {
      limit.maxPerTransaction = maxPerTransaction;
      limit.maxDailyTotal = maxDailyTotal;
      limit.maxMonthlyTotal = maxMonthlyTotal;
      limit.maxDailyCount = maxDailyCount;
    }

    await limit.save();

    res.status(201).json({
      success: true,
      message: "Límites por defecto establecidos",
      limit,
    });
  } catch (error) {
    console.error("Error al establecer límites por defecto:", error);
    res.status(500).json({
      message: "Error al establecer límites por defecto",
      error: error.message,
    });
  }
};

/**
 * Eliminar límites personalizados de un usuario
 * 
 * @param {Request} req - ID del límite
 * @param {Response} res - Respuesta JSON
 */
export const removeLimitForUser = async (req, res) => {
  try {
    const { limitId } = req.params;

    if (!req.user.roles.some(role => role.toLowerCase() === 'admin')) {
      return res.status(403).json({
        message: "Solo administradores pueden eliminar límites",
      });
    }

    await TransactionLimit.findByIdAndDelete(limitId);

    res.json({
      success: true,
      message: "Límite eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar límite:", error);
    res.status(500).json({
      message: "Error al eliminar límite",
      error: error.message,
    });
  }
};

/**
 * Listar todos los límites (ADMIN)
 * 
 * @param {Request} req - Filtros opcionales: { userId, isDefault }
 * @param {Response} res - Respuesta JSON
 */
export const getAllLimits = async (req, res) => {
  try {
    if (!req.user.roles.some(role => role.toLowerCase() === 'admin')) {
      return res.status(403).json({
        message: "Solo administradores pueden ver todos los límites",
      });
    }

    const { userId, isDefault } = req.query;
    let query = {};

    if (userId) query.userId = String(userId);
    if (isDefault) query.isDefault = isDefault === "true";

    const limits = await TransactionLimit.find(query).sort({ isDefault: -1, userId: 1 });

    const personalizedLimits = limits.filter((limit) => !limit.isDefault && limit.userId);
    const userIds = Array.from(new Set(personalizedLimits.map((limit) => limit.userId)));

    const accounts = userIds.length > 0
      ? await Account.find({ userId: { $in: userIds } }).lean()
      : [];

    const accountMap = accounts.reduce((map, account) => {
      if (!map[account.userId]) map[account.userId] = {};
      if (account.type) {
        map[account.userId][account.type] = account.accountNumber;
      }
      if (!map[account.userId].default) {
        map[account.userId].default = account.accountNumber;
      }
      return map;
    }, {});

    const limitsWithAccount = limits.map((limit) => {
      const accountNumber = limit.isDefault
        ? 'General'
        : accountMap[limit.userId]?.[limit.accountType] || accountMap[limit.userId]?.default || null;
      return {
        ...limit.toObject(),
        accountNumber,
      };
    });

    res.json({
      success: true,
      total: limitsWithAccount.length,
      limits: limitsWithAccount,
    });
  } catch (error) {
    console.error("Error al listar límites:", error);
    res.status(500).json({
      message: "Error al listar límites",
      error: error.message,
    });
  }
};
 