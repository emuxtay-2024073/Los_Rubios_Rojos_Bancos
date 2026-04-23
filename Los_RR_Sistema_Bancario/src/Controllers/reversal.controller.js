import { ReversalRequest } from "../Models/reversalRequest.model.js";
import { Transaction } from "../Models/transaction.model.js";
import { Account } from "../Models/account.model.js";

/**
 * CONTROLADOR DE REVERSIONES DE TRANSFERENCIAS
 * 
 * Gestiona solicitudes de reversión de transferencias.
 * Un usuario puede solicitar reversar una transferencia realizada
 * si cumple los criterios (tiempo límite, fondos disponibles, etc).
 */

/**
 * Solicitar reversión de una transferencia
 * 
 * @param {Request} req - Datos: { transactionId, reason, additionalInfo }
 * @param {Response} res - Respuesta JSON
 * 
 * Validaciones:
 * - La transacción debe existir y ser una TRANSFERENCIA
 * - Debe ser solicitada por el origen de la transferencia
 * - No debe pasar del tiempo límite (24-48 horas)
 * - La cuenta destino debe tener fondos suficientes
 * - No puede haber reversión pendiente para esta transacción
 */
export const requestReversal = async (req, res) => {
  try {
    const { transactionId, reason, additionalInfo } = req.body;
    const userId = req.user.id;

    const REVERSAL_TIME_LIMIT = 48 * 60 * 60 * 1000; // 48 horas en ms

    // Validaciones
    if (!transactionId) {
      return res.status(400).json({
        message: "El ID de transacción es obligatorio",
      });
    }

    if (!reason) {
      return res.status(400).json({
        message: "La razón de reversión es obligatoria",
      });
    }

    const validReasons = [
      "Error de transferencia",
      "Transferencia duplicada",
      "Transferencia no autorizada",
      "Cambio de opinión",
      "Otro",
    ];

    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        message: `Razón inválida. Válidas: ${validReasons.join(", ")}`,
      });
    }

    // Obtener transacción
    const transaction = await Transaction.findById(transactionId)
      .populate("originAccount")
      .populate("destinationAccount");

    if (!transaction) {
      return res.status(404).json({
        message: "Transacción no encontrada",
      });
    }

    // Validar que sea una transferencia
    if (transaction.type !== "TRANSFERENCIA") {
      return res.status(400).json({
        message:
          "Solo se pueden reversar transferencias. Este tipo es: " +
          transaction.type,
      });
    }

    // Validar propiedad (solo quien envió puede solicitar)
    if (transaction.originAccount.userId !== userId) {
      return res.status(403).json({
        message: "Solo el remitente puede solicitar la reversión",
      });
    }

    // Validar tiempo límite
    const timeSinceTransaction = Date.now() - new Date(transaction.date);
    if (timeSinceTransaction > REVERSAL_TIME_LIMIT) {
      return res.status(400).json({
        message:
          "No se pueden reversar transferencias con más de 48 horas de antigüedad",
        transactionDate: transaction.date,
        hoursAgo: Math.floor(timeSinceTransaction / (60 * 60 * 1000)),
      });
    }

    // Verificar si ya existe una reversión pendiente/aprobada
    const existingReversal = await ReversalRequest.findOne({
      transactionId,
      status: { $in: ["PENDING", "APPROVED"] },
    });

    if (existingReversal) {
      return res.status(400).json({
        message: "Ya existe una solicitud de reversión pendiente para esta transferencia",
        reversalId: existingReversal._id,
        status: existingReversal.status,
      });
    }

    // Validar fondos en cuenta destino
    if (transaction.destinationAccount.balance < transaction.amount) {
      return res.status(400).json({
        message:
          "No se puede reversar: la cuenta destino no tiene fondos suficientes",
        currentBalance: transaction.destinationAccount.balance,
        requiredAmount: transaction.amount,
      });
    }

    // Crear solicitud de reversión
    const reversalRequest = new ReversalRequest({
      transactionId,
      requestedBy: userId,
      reason,
      additionalInfo: additionalInfo || "",
      status: "PENDING",
      amount: transaction.amount,
      originalTransaction: {
        fromAccountId: transaction.originAccount._id,
        toAccountId: transaction.destinationAccount._id,
        amount: transaction.amount,
        date: transaction.date,
      },
    });

    await reversalRequest.save();

    res.status(201).json({
      success: true,
      message: "Solicitud de reversión creada exitosamente",
      reversalRequest: {
        id: reversalRequest._id,
        transactionId: reversalRequest.transactionId,
        amount: reversalRequest.amount,
        status: reversalRequest.status,
        reason: reversalRequest.reason,
        requestedAt: reversalRequest.requestedAt,
      },
    });
  } catch (error) {
    console.error("Error al solicitar reversión:", error);
    res.status(500).json({
      message: "Error al solicitar reversión",
      error: error.message,
    });
  }
};

/**
 * Obtener solicitudes de reversión del usuario
 * 
 * @param {Request} req - Parámetros: { status } (filtro opcional)
 * @param {Response} res - Respuesta JSON
 */
export const getUserReversals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = { requestedBy: userId };
    if (status) query.status = status;

    const reversals = await ReversalRequest.find(query)
      .sort({ requestedAt: -1 })
      .populate("transactionId", "amount type date")
      .select("-__v");

    res.json({
      success: true,
      total: reversals.length,
      reversals,
    });
  } catch (error) {
    console.error("Error al obtener reversiones:", error);
    res.status(500).json({
      message: "Error al obtener reversiones",
      error: error.message,
    });
  }
};

/**
 * Obtener solicitudes de reversión pendientes (ADMIN)
 * 
 * @param {Request} req - Parámetros de filtro
 * @param {Response} res - Respuesta JSON
 */
export const getPendingReversals = async (req, res) => {
  try {
    if (!req.user.roles.includes("Admin")) {
      return res.status(403).json({
        message: "Solo administradores pueden ver reversiones pendientes",
      });
    }

    const { status } = req.query;
    let query = status ? { status } : { status: "PENDING" };

    const reversals = await ReversalRequest.find(query)
      .sort({ requestedAt: 1 })
      .populate("requestedBy", "email username")
      .populate("transactionId");

    res.json({
      success: true,
      total: reversals.length,
      reversals,
    });
  } catch (error) {
    console.error("Error al obtener reversiones pendientes:", error);
    res.status(500).json({
      message: "Error al obtener reversiones pendientes",
      error: error.message,
    });
  }
};

/**
 * Aprobar y procesar una reversión (ADMIN)
 * 
 * @param {Request} req - ID de la solicitud de reversión
 * @param {Response} res - Respuesta JSON
 * 
 * Efectúa:
 * 1. Revierte los fondos entre cuentas
 * 2. Marca transacción original como reversada
 * 3. Crea registros de auditoría
 */
export const approveReversal = async (req, res) => {
  try {
    const { reversalId } = req.params;

    if (!req.user.roles.includes("Admin")) {
      return res.status(403).json({
        message: "Solo administradores pueden aprobar reversiones",
      });
    }

    const reversal = await ReversalRequest.findById(reversalId);

    if (!reversal) {
      return res.status(404).json({
        message: "Solicitud de reversión no encontrada",
      });
    }

    if (reversal.status !== "PENDING") {
      return res.status(400).json({
        message: `No se puede procesar una reversión con estado: ${reversal.status}`,
      });
    }

    // Obtener transacción y cuentas
    const transaction = await Transaction.findById(reversal.transactionId);
    const fromAccount = await Account.findById(
      reversal.originalTransaction.fromAccountId
    );
    const toAccount = await Account.findById(
      reversal.originalTransaction.toAccountId
    );

    if (!transaction || !fromAccount || !toAccount) {
      return res.status(404).json({
        message: "No se pudo encontrar la transacción o cuentas involucradas",
      });
    }

    // Validar fondos en cuenta destino
    if (toAccount.balance < reversal.amount) {
      reversal.status = "REJECTED";
      reversal.rejectionReason =
        "Fondos insuficientes en la cuenta destino";
      reversal.processedAt = new Date();
      reversal.processedBy = req.user.id;
      await reversal.save();

      return res.status(400).json({
        message: "No se puede procesar: fondos insuficientes",
        reversalId: reversal._id,
        status: "REJECTED",
      });
    }

    // Ejecutar reversión
    fromAccount.balance += reversal.amount;
    toAccount.balance -= reversal.amount;

    await fromAccount.save();
    await toAccount.save();

    // Marcar transacción como reversada
    transaction.isReversed = true;
    transaction.reversedAt = new Date();
    await transaction.save();

    // Actualizar solicitud de reversión
    reversal.status = "COMPLETED";
    reversal.processedAt = new Date();
    reversal.processedBy = req.user.id;
    await reversal.save();

    res.json({
      success: true,
      message: "Reversión aprobada y procesada exitosamente",
      reversal: {
        id: reversal._id,
        status: reversal.status,
        amount: reversal.amount,
        processedAt: reversal.processedAt,
      },
      accounts: {
        fromAccount: {
          id: fromAccount._id,
          newBalance: fromAccount.balance,
        },
        toAccount: {
          id: toAccount._id,
          newBalance: toAccount.balance,
        },
      },
    });
  } catch (error) {
    console.error("Error al aprobar reversión:", error);
    res.status(500).json({
      message: "Error al procesar reversión",
      error: error.message,
    });
  }
};

/**
 * Rechazar una solicitud de reversión (ADMIN)
 * 
 * @param {Request} req - ID de solicitud y motivo del rechazo
 * @param {Response} res - Respuesta JSON
 */
export const rejectReversal = async (req, res) => {
  try {
    const { reversalId } = req.params;
    const { reason } = req.body;

    if (!req.user.roles.includes("Admin")) {
      return res.status(403).json({
        message: "Solo administradores pueden rechazar reversiones",
      });
    }

    if (!reason) {
      return res.status(400).json({
        message: "El motivo del rechazo es obligatorio",
      });
    }

    const reversal = await ReversalRequest.findById(reversalId);

    if (!reversal) {
      return res.status(404).json({
        message: "Solicitud de reversión no encontrada",
      });
    }

    if (reversal.status !== "PENDING") {
      return res.status(400).json({
        message: `No se puede rechazar una reversión con estado: ${reversal.status}`,
      });
    }

    reversal.status = "REJECTED";
    reversal.rejectionReason = reason;
    reversal.processedAt = new Date();
    reversal.processedBy = req.user.id;
    await reversal.save();

    res.json({
      success: true,
      message: "Reversión rechazada exitosamente",
      reversal: {
        id: reversal._id,
        status: reversal.status,
        rejectionReason: reversal.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Error al rechazar reversión:", error);
    res.status(500).json({
      message: "Error al rechazar reversión",
      error: error.message,
    });
  }
};

/**
 * Cancelar una solicitud de reversión por el usuario
 * 
 * @param {Request} req - ID de la solicitud
 * @param {Response} res - Respuesta JSON
 * 
 * Solo se puede cancelar si está en estado PENDING
 */
export const cancelReversal = async (req, res) => {
  try {
    const { reversalId } = req.params;
    const userId = req.user.id;

    const reversal = await ReversalRequest.findById(reversalId);

    if (!reversal) {
      return res.status(404).json({
        message: "Solicitud de reversión no encontrada",
      });
    }

    if (reversal.requestedBy.toString() !== userId) {
      return res.status(403).json({
        message: "Solo puedes cancelar tus propias reversiones",
      });
    }

    if (reversal.status !== "PENDING") {
      return res.status(400).json({
        message: `No se puede cancelar una reversión con estado: ${reversal.status}`,
      });
    }

    reversal.status = "CANCELLED";
    reversal.processedAt = new Date();
    await reversal.save();

    res.json({
      success: true,
      message: "Solicitud de reversión cancelada",
      reversal: {
        id: reversal._id,
        status: reversal.status,
      },
    });
  } catch (error) {
    console.error("Error al cancelar reversión:", error);
    res.status(500).json({
      message: "Error al cancelar reversión",
      error: error.message,
    });
  }
};
