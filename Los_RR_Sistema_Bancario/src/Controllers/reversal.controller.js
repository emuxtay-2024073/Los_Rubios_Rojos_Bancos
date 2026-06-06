import { ReversalRequest } from "../Models/reversalRequest.model.js";
import { Transaction } from "../Models/transaction.model.js";
import { Account } from "../Models/account.model.js";
import { isAdmin } from "../Helpers/roleHelpers.js";
 
/**
 * CONTROLADOR DE REVERSIONES DE TRANSFERENCIAS
 */
 
export const requestReversal = async (req, res) => {
  // Desestructurar FUERA del try para que esté disponible en el catch
  const { transactionId, reason, additionalInfo } = req.body;
  const userId = req.user.id;
 
  try {
    const REVERSAL_TIME_LIMIT = 24 * 60 * 60 * 1000;
 
    if (!transactionId) {
      return res.status(400).json({ message: "El ID de transacción es obligatorio" });
    }
 
    if (!reason) {
      return res.status(400).json({ message: "La razón de reversión es obligatoria" });
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
 
    const transaction = await Transaction.findById(transactionId);
 
    if (!transaction) {
      return res.status(404).json({ message: "Transacción no encontrada" });
    }
 
    if (transaction.type !== "TRANSFERENCIA") {
      return res.status(400).json({
        message: "Solo se pueden reversar transferencias. Este tipo es: " + transaction.type,
      });
    }
 
    const originAccount = await Account.findById(transaction.originAccount);
 
    if (!originAccount) {
      return res.status(404).json({ message: "Cuenta origen no encontrada" });
    }
 
    if (String(originAccount.userId) !== String(userId)) {
      return res.status(403).json({ message: "Solo el remitente puede solicitar la reversión" });
    }
 
    const timeSinceTransaction = Date.now() - new Date(transaction.date);
    if (timeSinceTransaction > REVERSAL_TIME_LIMIT) {
      return res.status(400).json({
        message: "No se pueden reversar transferencias con más de 24 horas de antigüedad",
        transactionDate: transaction.date,
        hoursAgo: Math.floor(timeSinceTransaction / (60 * 60 * 1000)),
      });
    }
 
    const existingReversal = await ReversalRequest.findOne({
      transactionId,
      requestedBy: userId,
      status: { $in: ["PENDING", "APPROVED"] },
    });
 
    if (existingReversal) {
      return res.status(400).json({
        message: "Ya existe una solicitud de reversión pendiente para esta transferencia",
        reversalId: existingReversal._id,
        status: existingReversal.status,
      });
    }
 
    const rejectedReversal = await ReversalRequest.findOne({
      transactionId,
      requestedBy: userId,
      status: "REJECTED",
    }).sort({ processedAt: -1, requestedAt: -1 });
 
    if (rejectedReversal) {
      const rejectionTime = rejectedReversal.processedAt || rejectedReversal.requestedAt;
      const REJECTION_COOLDOWN = 10 * 60 * 1000;
      const timeSinceRejection = Date.now() - new Date(rejectionTime);
 
      if (timeSinceRejection < REJECTION_COOLDOWN) {
        const remainingMs = REJECTION_COOLDOWN - timeSinceRejection;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const waitMessage = remainingMinutes > 0
          ? `Espera ${remainingMinutes} minuto${remainingMinutes === 1 ? "" : "s"} para realizar otra solicitud de reversión`
          : `Espera ${remainingSeconds} segundo${remainingSeconds === 1 ? "" : "s"} para realizar otra solicitud de reversión`;
 
        return res.status(400).json({
          message: "La última solicitud de reversión fue rechazada.",
          retryAfter: remainingMs,
          waitMessage,
        });
      }
    }
 
    const destinationAccount = await Account.findById(transaction.destinationAccount);
 
    if (!destinationAccount) {
      return res.status(404).json({ message: "Cuenta destino no encontrada" });
    }
 
    if (destinationAccount.balance < transaction.amount) {
      return res.status(400).json({
        message: "No se puede reversar: la cuenta destino no tiene fondos suficientes",
        currentBalance: destinationAccount.balance,
        requiredAmount: transaction.amount,
      });
    }
 
    const reversalRequest = new ReversalRequest({
      transactionId,
      requestedBy: userId,
      reason,
      additionalInfo: additionalInfo || "",
      status: "PENDING",
      amount: transaction.amount,
      originalTransaction: {
        fromAccountId: transaction.originAccount,
        toAccountId: transaction.destinationAccount,
        amount: transaction.amount,
        date: transaction.date,
      },
    });
 
    await reversalRequest.save();

    // Registrar la solicitud en la transacción para que el historial muestre su estado.
    if (transaction) {
      transaction.reversalRequestId = reversalRequest._id;
      await transaction.save();
    }
 
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
 
    // Manejar índice único residual en la BD (E11000)
    if (error?.code === 11000 && error?.keyPattern?.transactionId === 1) {
      // transactionId está en scope porque se desestructuró fuera del try
      const existingReversal = await ReversalRequest.findOne({ transactionId }).catch(() => null);
      if (existingReversal) {
        return res.status(400).json({
          message: "Ya existe una solicitud de reversión para esta transferencia",
          status: existingReversal.status,
          reversalId: existingReversal._id,
        });
      }
      return res.status(500).json({
        message: "Error de índice en BD. Ejecuta: mongosh <URI> --eval \"db.reversalrequests.dropIndex('transactionId_1'); db.reversalrequests.deleteMany({status:'PENDING'})\"",
      });
    }
 
    res.status(500).json({ message: "Error al solicitar reversión", error: error.message });
  }
};
 
/**
 * Obtener solicitudes de reversión del usuario
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
 
    res.json({ success: true, total: reversals.length, reversals });
  } catch (error) {
    console.error("Error al obtener reversiones:", error);
    res.status(500).json({ message: "Error al obtener reversiones", error: error.message });
  }
};
 
/**
 * Obtener solicitudes de reversión pendientes (ADMIN)
 */
export const getPendingReversals = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Solo administradores pueden ver reversiones pendientes" });
    }
 
    const { status } = req.query;
    let query = status ? { status } : { status: "PENDING" };
 
    const reversals = await ReversalRequest.find(query)
      .sort({ requestedAt: 1 })
      .populate("requestedBy", "email username")
      .populate("transactionId");
 
    res.json({ success: true, total: reversals.length, reversals });
  } catch (error) {
    console.error("Error al obtener reversiones pendientes:", error);
    res.status(500).json({ message: "Error al obtener reversiones pendientes", error: error.message });
  }
};
 
/**
 * Aprobar y procesar una reversión (ADMIN)
 */
export const approveReversal = async (req, res) => {
  try {
    const { reversalId } = req.params;
 
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Solo administradores pueden aprobar reversiones" });
    }
 
    const reversal = await ReversalRequest.findById(reversalId);
 
    if (!reversal) {
      return res.status(404).json({ message: "Solicitud de reversión no encontrada" });
    }
 
    if (reversal.status !== "PENDING") {
      return res.status(400).json({
        message: `No se puede procesar una reversión con estado: ${reversal.status}`,
      });
    }
 
    const transaction = await Transaction.findById(reversal.transactionId);
    const fromAccount = await Account.findById(reversal.originalTransaction.fromAccountId);
    const toAccount = await Account.findById(reversal.originalTransaction.toAccountId);
 
    if (!transaction || !fromAccount || !toAccount) {
      return res.status(404).json({ message: "No se pudo encontrar la transacción o cuentas involucradas" });
    }
 
    if (toAccount.balance < reversal.amount) {
      reversal.status = "REJECTED";
      reversal.rejectionReason = "Fondos insuficientes en la cuenta destino";
      reversal.processedAt = new Date();
      reversal.processedBy = req.user.id;
      await reversal.save();
 
      return res.status(400).json({
        message: "No se puede procesar: fondos insuficientes",
        reversalId: reversal._id,
        status: "REJECTED",
      });
    }
 
    fromAccount.balance += reversal.amount;
    toAccount.balance -= reversal.amount;
 
    await fromAccount.save();
    await toAccount.save();
 
    transaction.isReversed = true;
    transaction.reversedAt = new Date();
    transaction.status = 'REVERTIDA';
    await transaction.save();
 
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
        fromAccount: { id: fromAccount._id, newBalance: fromAccount.balance },
        toAccount: { id: toAccount._id, newBalance: toAccount.balance },
      },
    });
  } catch (error) {
    console.error("Error al aprobar reversión:", error);
    res.status(500).json({ message: "Error al procesar reversión", error: error.message });
  }
};
 
/**
 * Rechazar una solicitud de reversión (ADMIN)
 */
export const rejectReversal = async (req, res) => {
  try {
    const { reversalId } = req.params;
    const { reason } = req.body;
 
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Solo administradores pueden rechazar reversiones" });
    }
 
    if (!reason) {
      return res.status(400).json({ message: "El motivo del rechazo es obligatorio" });
    }
 
    const reversal = await ReversalRequest.findById(reversalId);
 
    if (!reversal) {
      return res.status(404).json({ message: "Solicitud de reversión no encontrada" });
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
    res.status(500).json({ message: "Error al rechazar reversión", error: error.message });
  }
};
 
/**
 * Cancelar una solicitud de reversión por el usuario
 */
export const cancelReversal = async (req, res) => {
  try {
    const { reversalId } = req.params;
    const userId = req.user.id;
 
    const reversal = await ReversalRequest.findById(reversalId);
 
    if (!reversal) {
      return res.status(404).json({ message: "Solicitud de reversión no encontrada" });
    }
 
    if (String(reversal.requestedBy) !== String(userId)) {
      return res.status(403).json({ message: "Solo puedes cancelar tus propias reversiones" });
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
      reversal: { id: reversal._id, status: reversal.status },
    });
  } catch (error) {
    console.error("Error al cancelar reversión:", error);
    res.status(500).json({ message: "Error al cancelar reversión", error: error.message });
  }
};
