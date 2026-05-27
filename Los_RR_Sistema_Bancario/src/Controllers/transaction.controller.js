import mongoose from "mongoose";
import { Account } from "../Models/account.model.js";
import { Transaction } from "../Models/transaction.model.js";
import { User } from "../Models/user.model.js";
import { TransactionLimit } from "../Models/transactionLimit.model.js";
import { isValidObjectId, isPositiveAmount } from "../Helpers/validators.js";
import { createAuditLog } from "../services/log.service.js";
 
/**
 * Busca una cuenta por su accountNumber (ej: "ACC644113") o por su ObjectId de MongoDB.
 * Acepta ambos formatos para mayor compatibilidad con el frontend.
 */
const findAccountByIdOrNumber = async (accountId) => {
  if (/^ACC\d{6}$/.test(accountId)) {
    return await Account.findOne({ accountNumber: accountId });
  }
  return await Account.findById(accountId);
};
 
const getApplicableTransactionLimit = async (userId, accountType, transactionType) => {
  const normalizedUserId = String(userId);
  const normalizedType = transactionType || 'TRANSFERENCIA';
  const normalizedAccountType = accountType || null;
 
  // 1. Límite personalizado del usuario con accountType y transactionType específicos (mayor prioridad)
  let limit = await TransactionLimit.findOne({
    userId: normalizedUserId,
    accountType: normalizedAccountType,
    transactionType: normalizedType,
  });
 
  // 2. Límite personalizado del usuario sin accountType específico (aplica a todos sus tipos de cuenta)
  if (!limit && normalizedAccountType != null) {
    limit = await TransactionLimit.findOne({
      userId: normalizedUserId,
      accountType: null,
      transactionType: normalizedType,
    });
  }
 
  // 3. Límite personalizado del usuario completamente genérico (sin accountType ni transactionType)
  if (!limit) {
    limit = await TransactionLimit.findOne({
      userId: normalizedUserId,
      accountType: null,
      transactionType: null,
    });
  }
 
  // 4. Límite por defecto del sistema con accountType específico (solo si no hay límite personalizado)
  if (!limit) {
    limit = await TransactionLimit.findOne({
      isDefault: true,
      accountType: normalizedAccountType,
      transactionType: normalizedType,
    });
  }
 
  // 5. Límite por defecto del sistema sin accountType (fallback global)
  if (!limit) {
    limit = await TransactionLimit.findOne({
      isDefault: true,
      accountType: null,
      transactionType: normalizedType,
    });
  }
 
  // 6. Límite por defecto completamente genérico (último recurso)
  if (!limit) {
    limit = await TransactionLimit.findOne({
      isDefault: true,
      accountType: null,
      transactionType: null,
    });
  }
 
  return limit || {
    maxPerTransaction: 10000,
    maxDailyTotal: 50000,
    maxMonthlyTotal: 500000,
    maxDailyCount: 20,
  };
};
 
const calculateTransferUsage = async (accountIds, start, end) => {
  const query = {
    type: 'TRANSFERENCIA',
    originAccount: { $in: accountIds },
    isReversed: false,
    date: { $gte: start, $lte: end },
  };
 
  const transfers = await Transaction.find(query);
  const totalAmount = transfers.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const count = transfers.length;
 
  return { totalAmount, count };
};
 
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
        .populate("reversalRequestId", "status")
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
        .populate("reversalRequestId", "status")
        .sort({ date: -1 });
    }
 
    const accountIdsToLookup = new Set();
    transactions.forEach((transaction) => {
      const origin = transaction.originAccount;
      const destination = transaction.destinationAccount;
      if (typeof origin === 'string' && mongoose.isValidObjectId(origin)) {
        accountIdsToLookup.add(origin);
      }
      if (origin && typeof origin === 'object' && !origin.accountNumber && origin._id) {
        accountIdsToLookup.add(String(origin._id));
      }
      if (typeof destination === 'string' && mongoose.isValidObjectId(destination)) {
        accountIdsToLookup.add(destination);
      }
      if (destination && typeof destination === 'object' && !destination.accountNumber && destination._id) {
        accountIdsToLookup.add(String(destination._id));
      }
    });
 
    if (accountIdsToLookup.size > 0) {
      const accounts = await Account.find({ _id: { $in: Array.from(accountIdsToLookup) } }).select('accountNumber');
      const accountNumberMap = new Map(accounts.map((account) => [String(account._id), account.accountNumber]));
 
      transactions = transactions.map((transaction) => {
        const normalizedTransaction = transaction.toObject ? transaction.toObject() : { ...transaction };
 
        const normalizeAccount = (account) => {
          if (!account) return null;
          if (typeof account === 'string') {
            if (/^ACC\d{6}$/.test(account)) return { accountNumber: account };
            return { accountNumber: accountNumberMap.get(account) || account };
          }
          if (account.accountNumber) return account;
          const accountId = account._id ? String(account._id) : account;
          return { accountNumber: accountNumberMap.get(accountId) || accountId };
        };
 
        return {
          ...normalizedTransaction,
          originAccount: normalizeAccount(normalizedTransaction.originAccount),
          destinationAccount: normalizeAccount(normalizedTransaction.destinationAccount),
        };
      });
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
 
    // CORREGIDO: validar formato ACC###### o ObjectId válido
    const isValidId = (id) => /^ACC\d{6}$/.test(id) || mongoose.isValidObjectId(id);
    if (!isValidId(fromAccountId) || !isValidId(toAccountId)) {
      return res.status(400).json({ message: "IDs de cuenta inválidos" });
    }
 
    if (fromAccountId === toAccountId) {
      return res.status(400).json({ message: "No se puede transferir a la misma cuenta" });
    }
 
    const amountNumber = Number(amount);
    if (!isPositiveAmount(amountNumber)) {
      return res.status(400).json({ message: "El monto debe ser un número mayor a 0" });
    }
 
    // CORREGIDO: usar findAccountByIdOrNumber en lugar de findById
    const fromAccount = await findAccountByIdOrNumber(fromAccountId);
    const toAccount = await findAccountByIdOrNumber(toAccountId);
 
    if (!fromAccount || !toAccount) {
      return res.status(404).json({ message: "Una o ambas cuentas no existen" });
    }
 
    if (!toAccount.isActive) {
      return res.status(400).json({ message: "La cuenta destino está deshabilitada" });
    }
 
    if (!fromAccount.isActive) {
      return res.status(400).json({ message: "La cuenta origen está deshabilitada" });
    }
 
    let destinationUser = null;
    if (mongoose.isValidObjectId(toAccount.userId)) {
      destinationUser = await User.findById(toAccount.userId);
    }
    if (destinationUser && destinationUser.roles.some(role => role.toLowerCase() === 'admin')) {
      return res.status(400).json({ message: "No se puede transferir a una cuenta de administrador" });
    }
 
    // Verificar que la cuenta origen pertenece al usuario autenticado
    if (!req.user.roles.some(role => role.toLowerCase() === 'admin') && fromAccount.userId !== req.user.id) {
      return res.status(403).json({ message: "No tienes permiso sobre la cuenta origen" });
    }
 
    const limit = await getApplicableTransactionLimit(fromAccount.userId, fromAccount.type, 'TRANSFERENCIA');
    const accountIdsOfType = await Account.find({ userId: fromAccount.userId, type: fromAccount.type }).select('_id');
    const originAccountIds = accountIdsOfType.length > 0 ? accountIdsOfType.map((a) => String(a._id)) : [String(fromAccount._id)];
 
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
 
    const { totalAmount: dailyTotal, count: dailyCount } = await calculateTransferUsage(originAccountIds, todayStart, new Date());
    const { totalAmount: monthlyTotal } = await calculateTransferUsage(originAccountIds, monthStart, new Date());
 
    if (amountNumber > limit.maxPerTransaction) {
      return res.status(400).json({
        message: `Límite por transferencia superado. El máximo por operación es ${limit.maxPerTransaction}.`,
      });
    }
 
    if (dailyTotal + amountNumber > limit.maxDailyTotal) {
      return res.status(400).json({
        message: `Límite diario de transferencia superado. Ya se han transferido ${dailyTotal} hoy y el máximo es ${limit.maxDailyTotal}.`,
      });
    }
 
    if (monthlyTotal + amountNumber > limit.maxMonthlyTotal) {
      return res.status(400).json({
        message: `Límite mensual de transferencia superado. Ya se han transferido ${monthlyTotal} este mes y el máximo es ${limit.maxMonthlyTotal}.`,
      });
    }
 
    if (dailyCount + 1 > limit.maxDailyCount) {
      return res.status(400).json({
        message: `Límite de cantidad diaria de transferencias superado. Ya realizaste ${dailyCount} transferencias hoy y el máximo es ${limit.maxDailyCount}.`,
      });
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
      originAccount: fromAccount._id,
      destinationAccount: toAccount._id,
      description,
      status: "COMPLETADO",
    });
 
    await transferencia.save();
 
    await createAuditLog({
      userId: req.user?.id || null,
      username: req.user?.email || null,
      email: req.user?.email || null,
      action: 'transaction.transfer',
      entityType: 'Transaction',
      entityId: transferencia._id.toString(),
      ip: req.ip,
      meta: {
        fromAccountId: fromAccount._id,
        toAccountId: toAccount._id,
        amount: amountNumber,
      },
    });
 
    res.status(201).json({
      success: true,
      message: "Transferencia realizada exitosamente",
      transferencia,
    });
 
  } catch (error) {
    console.error("Error en transferencia:", error);
    const message = error?.message || "Error al transferir dinero";
    res.status(500).json({ message, error: error?.message });
  }
};
 