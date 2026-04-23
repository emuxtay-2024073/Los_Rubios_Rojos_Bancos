import { Account } from "../Models/account.model.js";
import { Transaction } from "../Models/transaction.model.js";

// =====================================================
// HISTORIAL DE TRANSACCIONES
// =====================================================
export const getTransactions = async (req, res) => {
  try {
    const isAdmin = req.user.roles.includes("Admin");

    let transactions;

    if (isAdmin) {
      // Admin ve todas
      transactions = await Transaction.find()
        .populate("originAccount", "accountNumber")
        .populate("destinationAccount", "accountNumber")
        .sort({ date: -1 });
    } else {
      const userAccounts = await Account.find({ userId: req.user.id }).select("_id");
      const accountIds = userAccounts.map(a => a._id);

      transactions = await Transaction.find({
        $or: [
          { originAccount: { $in: accountIds } },
          { destinationAccount: { $in: accountIds } }
        ]
      })
        .populate("originAccount", "accountNumber")
        .populate("destinationAccount", "accountNumber")
        .sort({ date: -1 });
    }

    res.json({ success: true, total: transactions.length, transactions });

  } catch (error) {
    res.status(500).json({ message: "Error al obtener transacciones", error: error.message });
  }
};

// =====================================================
// TRANSFERENCIA
// =====================================================
export const transfer = async (req, res) => {
  try {
    let { fromAccountId, toAccountId, amount } = req.body;

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ message: "fromAccountId, toAccountId y amount son obligatorios" });
    }

    amount = Number(amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "El monto debe ser mayor a 0" });
    }

    const fromAccount = await Account.findById(fromAccountId);
    const toAccount = await Account.findById(toAccountId);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ message: "Una o ambas cuentas no existen" });
    }

    // Verificar que la cuenta origen pertenece al usuario autenticado
    if (!req.user.roles.includes("Admin") && fromAccount.userId !== req.user.id) {
      return res.status(403).json({ message: "No tienes permiso sobre la cuenta origen" });
    }

    if (fromAccount.balance < amount) {
      return res.status(400).json({ message: "Fondos insuficientes", balance: fromAccount.balance });
    }

    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await fromAccount.save();
    await toAccount.save();

    const transferencia = new Transaction({
      type: "TRANSFERENCIA",
      amount,
      originAccount: fromAccountId,
      destinationAccount: toAccountId,
    });

    await transferencia.save();

    res.json({
      success: true,
      message: "Transferencia realizada correctamente",
      transferencia,
    });

  } catch (error) {
    res.status(500).json({ message: "Error al transferir dinero", error: error.message });
  }
};
