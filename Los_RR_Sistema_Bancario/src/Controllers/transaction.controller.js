import { Account } from "../Models/account.model.js";
import { Transaction } from "../Models/transaction.model.js";
import { User } from "../Models/user.model.js";

// =====================================================
// HISTORIAL DE TRANSACCIONES
// =====================================================
export const getTransactions = async (req, res) => {
  try {
    const isAdmin = req.user.roles.some(role => role.toLowerCase() === 'admin');
    const { type, startDate, endDate, minAmount, maxAmount, accountId, direction, search } = req.query;

    const query = {};

    if (type) {
      query.type = type.toUpperCase();
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (minAmount !== undefined) {
      query.amount = { ...query.amount, $gte: Number(minAmount) };
    }

    if (maxAmount !== undefined) {
      query.amount = { ...query.amount, $lte: Number(maxAmount) };
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    let transactions;

    if (isAdmin) {
      if (accountId) {
        query.$or = [
          { originAccount: accountId },
          { destinationAccount: accountId },
        ];
      }

      transactions = await Transaction.find(query)
        .populate("originAccount", "accountNumber")
        .populate("destinationAccount", "accountNumber")
        .sort({ date: -1 });
    } else {
      const userAccounts = await Account.find({ userId: req.user.id }).select("_id");
      const accountIds = userAccounts.map(a => a._id);

      const ownershipFilter = {
        $or: [
          { originAccount: { $in: accountIds } },
          { destinationAccount: { $in: accountIds } },
        ],
      };

      if (direction === 'in') {
        query.destinationAccount = { $in: accountIds };
      } else if (direction === 'out') {
        query.originAccount = { $in: accountIds };
      } else {
        query.$or = ownershipFilter.$or;
      }

      transactions = await Transaction.find(query)
        .populate("originAccount", "accountNumber")
        .populate("destinationAccount", "accountNumber")
        .sort({ date: -1 });
    }

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

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ message: "fromAccountId, toAccountId y amount son obligatorios" });
    }

    const amountNumber = Number(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ message: "El monto debe ser mayor a 0" });
    }

    const fromAccount = await Account.findById(fromAccountId);
    const toAccount = await Account.findById(toAccountId);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ message: "Una o ambas cuentas no existen" });
    }

    if (!toAccount.isActive) {
      return res.status(400).json({ message: "La cuenta destino está deshabilitada" });
    }

    if (!fromAccount.isActive) {
      return res.status(400).json({ message: "La cuenta origen está deshabilitada" });
    }

    const destinationUser = await User.findById(toAccount.userId);
    if (destinationUser && destinationUser.roles.some(role => role.toLowerCase() === 'admin')) {
      return res.status(400).json({ message: "No se puede transferir a una cuenta de administrador" });
    }

    // Verificar que la cuenta origen pertenece al usuario autenticado
    if (!req.user.roles.some(role => role.toLowerCase() === 'admin') && fromAccount.userId !== req.user.id) {
      return res.status(403).json({ message: "No tienes permiso sobre la cuenta origen" });
    }

    if (fromAccount.balance < amountNumber) {
      return res.status(400).json({ message: "Fondos insuficientes", balance: fromAccount.balance });
    }

    fromAccount.balance -= amountNumber;
    toAccount.balance += amountNumber;

    await fromAccount.save();
    await toAccount.save();

    const transferencia = new Transaction({
      type: "TRANSFERENCIA",
      amount: amountNumber,
      originAccount: fromAccountId,
      destinationAccount: toAccountId,
      description,
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
