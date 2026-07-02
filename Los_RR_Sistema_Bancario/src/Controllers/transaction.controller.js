import {
  getTransactionsService,
  transferService
} from "../services/banking.service.js";
import { createAuditLog } from "../services/log.service.js";

// =====================================================
// HISTORIAL DE TRANSACCIONES
// =====================================================
export const getTransactions = async (req, res) => {
  try {
    const transactions = await getTransactionsService(req.query, req.user);
    res.json({ success: true, total: transactions.length, transactions });
  } catch (error) {
    console.error("Error al obtener transacciones:", error);
    res.status(500).json({ message: "Error al obtener transacciones", error: error.message });
  }
};

// =====================================================
// TRANSFERENCIA
// =====================================================
export const transfer = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, description = '' } = req.body;
    const userContext = req.user;

    const transferencia = await transferService(fromAccountId, toAccountId, amount, description, userContext);

    // Registro de auditoría
    await createAuditLog({
      userId: userContext?.id || null,
      username: userContext?.email || null,
      email: userContext?.email || null,
      action: 'transaction.transfer',
      entityType: 'Transaction',
      entityId: transferencia._id.toString(),
      ip: req.ip,
      meta: {
        fromAccountId,
        toAccountId,
        amount: Number(amount),
      },
    });

    res.status(201).json({
      success: true,
      message: "Transferencia realizada exitosamente",
      transferencia,
    });
  } catch (error) {
    console.error("Error en transferencia:", error);
    
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Una o ambas cuentas no existen" });
    }
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "No tienes permiso sobre la cuenta origen" });
    }
    if (error.message === "FONDOS_INSUFICIENTES") {
      return res.status(400).json({ message: "Fondos insuficientes" });
    }
    
    res.status(400).json({ message: error.message, error: error.message });
  }
};