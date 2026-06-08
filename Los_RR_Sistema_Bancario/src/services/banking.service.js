import { Transaction } from "../Models/transaction.model.js";
import User from "../Models/user.model.postgres.js";
import { Account } from "../Models/account.model.js";
import { findAccountByIdOrNumber, convertAmount } from "./account.service.js";
import { verifyLimits } from "./limit.service.js";
import { isAdmin } from "../Helpers/roleHelpers.js";
import { isPositiveAmount } from "../Helpers/validators.js";
import mongoose from "mongoose";

/**
 * Realiza un depósito en una cuenta bancaria.
 */
export const depositService = async (accountId, amount, currency, description, userContext) => {
  if (!accountId || amount === undefined) {
    throw new Error("accountId y amount son obligatorios");
  }

  const amountNumber = Number(amount);
  if (isNaN(amountNumber) || amountNumber <= 0) {
    throw new Error("El monto debe ser mayor a 0");
  }

  const account = await findAccountByIdOrNumber(accountId);
  if (!account) {
    throw new Error("NOT_FOUND");
  }

  if (!isAdmin(userContext) && account.userId !== userContext.id) {
    throw new Error("FORBIDDEN");
  }

  if (!account.isActive) {
    throw new Error("No se puede depositar en una cuenta deshabilitada");
  }

  const depositCurrency = String(currency || 'GTQ').toUpperCase();
  let convertedAmount = amountNumber;
  let exchangeRate = 1;

  if (depositCurrency !== account.currency.toUpperCase()) {
    const conversion = await convertAmount(amountNumber, depositCurrency, account.currency);
    convertedAmount = conversion.convertedAmount;
    exchangeRate = conversion.exchangeRate;
  }

  account.balance += convertedAmount;
  account.totalDeposits += convertedAmount;
  account.lastTransaction = new Date();
  await account.save();

  const transaction = new Transaction({
    type: "DEPOSITO",
    amount: convertedAmount,
    originAccount: null,
    destinationAccount: account._id,
    description: description || `Depósito en ${depositCurrency}`,
    currency: depositCurrency,
    exchangeRate,
  });
  await transaction.save();

  return { account, transaction };
};

/**
 * Realiza un retiro de una cuenta bancaria.
 */
export const withdrawService = async (accountId, amount, currency, description, userContext) => {
  if (!accountId || amount === undefined) {
    throw new Error("accountId y amount son obligatorios");
  }

  const amountNumber = Number(amount);
  if (isNaN(amountNumber) || amountNumber <= 0) {
    throw new Error("El monto debe ser mayor a 0");
  }

  const account = await findAccountByIdOrNumber(accountId);
  if (!account) {
    throw new Error("NOT_FOUND");
  }

  if (!isAdmin(userContext) && account.userId !== userContext.id) {
    throw new Error("FORBIDDEN");
  }

  if (!account.isActive) {
    throw new Error("No se puede retirar de una cuenta deshabilitada");
  }

  let convertedAmount = amountNumber;
  let exchangeRate = 1;
  let withdrawCurrency = account.currency.toUpperCase();

  if (currency) {
    withdrawCurrency = String(currency).toUpperCase();
    if (withdrawCurrency !== account.currency.toUpperCase()) {
      const conversion = await convertAmount(amountNumber, withdrawCurrency, account.currency);
      convertedAmount = conversion.convertedAmount;
      exchangeRate = conversion.exchangeRate;
    }
  }

  if (account.balance < convertedAmount) {
    throw new Error("FONDOS_INSUFICIENTES");
  }

  account.balance -= convertedAmount;
  account.totalWithdrawals += convertedAmount;
  account.lastTransaction = new Date();
  await account.save();

  const transaction = new Transaction({
    type: "RETIRO",
    amount: convertedAmount,
    originAccount: account._id,
    destinationAccount: null,
    description: description || `Retiro en ${withdrawCurrency}`,
    currency: withdrawCurrency,
    exchangeRate,
  });
  await transaction.save();

  return { account, transaction };
};

/**
 * Realiza una transferencia entre dos cuentas bancarias.
 */
export const transferService = async (fromAccountId, toAccountId, amount, description, userContext) => {
  if (!fromAccountId || !toAccountId || !amount) {
    throw new Error("fromAccountId, toAccountId y amount son obligatorios");
  }

  const isValidId = (id) => /^ACC\d{6}$/.test(id) || mongoose.isValidObjectId(id);
  if (!isValidId(fromAccountId) || !isValidId(toAccountId)) {
    throw new Error("IDs de cuenta inválidos");
  }

  if (fromAccountId === toAccountId) {
    throw new Error("No se puede transferir a la misma cuenta");
  }

  const amountNumber = Number(amount);
  if (!isPositiveAmount(amountNumber)) {
    throw new Error("El monto debe ser un número mayor a 0");
  }

  const fromAccount = await findAccountByIdOrNumber(fromAccountId);
  const toAccount = await findAccountByIdOrNumber(toAccountId);

  if (!fromAccount || !toAccount) {
    throw new Error("NOT_FOUND");
  }

  if (!toAccount.isActive) {
    throw new Error("La cuenta destino está deshabilitada");
  }

  if (!fromAccount.isActive) {
    throw new Error("La cuenta origen está deshabilitada");
  }

  // Comprobar si el destinatario es administrador
  let destinationUser = null;
  if (mongoose.isValidObjectId(toAccount.userId)) {
    destinationUser = await User.findByPk(toAccount.userId);
  }
  if (destinationUser && (destinationUser.role === 'ADMIN' || destinationUser.role === 'SUPER_ADMIN')) {
    throw new Error("No se puede transferir a una cuenta de administrador");
  }

  // Verificar que la cuenta origen pertenece al usuario autenticado
  if (!isAdmin(userContext) && fromAccount.userId !== userContext.id) {
    throw new Error("FORBIDDEN");
  }

  // Validar límites
  await verifyLimits(fromAccount.userId, fromAccount.type, amountNumber);

  if (fromAccount.balance < amountNumber) {
    throw new Error("FONDOS_INSUFICIENTES");
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
  return transferencia;
};

/**
 * Obtiene la lista de transacciones aplicando filtros y mapeando nombres de cuenta.
 */
export const getTransactionsService = async (queryParams, userContext) => {
  const userIsAdmin = isAdmin(userContext);
  const { type, startDate, endDate, minAmount, maxAmount, accountId, direction, search } = queryParams;

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

  if (userIsAdmin) {
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
    const userAccounts = await Account.find({ userId: userContext.id }).select("_id");
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

  return transactions;
};
