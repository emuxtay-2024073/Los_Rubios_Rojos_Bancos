import { TransactionLimit } from "../Models/transactionLimit.model.js";
import { Transaction } from "../Models/transaction.model.js";
import { Account } from "../Models/account.model.js";

/**
 * Obtiene el límite de transacción aplicable para un usuario, tipo de cuenta y tipo de transacción.
 */
export const getApplicableTransactionLimit = async (userId, accountType, transactionType) => {
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

/**
 * Calcula el monto acumulado y la cantidad de transferencias realizadas en un rango de fechas.
 */
export const calculateTransferUsage = async (accountIds, start, end) => {
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

/**
 * Verifica si una operación propuesta excede los límites aplicables del usuario.
 * Lanza un error detallado si se superan los límites.
 */
export const verifyLimits = async (userId, accountType, amount) => {
  const limit = await getApplicableTransactionLimit(userId, accountType, 'TRANSFERENCIA');
  
  // Buscar todas las cuentas del mismo tipo que pertenecen al usuario para calcular el uso acumulado
  const accountIdsOfType = await Account.find({ userId, type: accountType }).select('_id');
  const originAccountIds = accountIdsOfType.length > 0 ? accountIdsOfType.map((a) => String(a._id)) : [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  const { totalAmount: dailyTotal, count: dailyCount } = await calculateTransferUsage(originAccountIds, todayStart, new Date());
  const { totalAmount: monthlyTotal } = await calculateTransferUsage(originAccountIds, monthStart, new Date());

  if (amount > limit.maxPerTransaction) {
    throw new Error(`Límite por transferencia superado. El máximo por operación es ${limit.maxPerTransaction}.`);
  }

  if (dailyTotal + amount > limit.maxDailyTotal) {
    throw new Error(`Límite diario de transferencia superado. Ya se han transferido ${dailyTotal} hoy y el máximo es ${limit.maxDailyTotal}.`);
  }

  if (monthlyTotal + amount > limit.maxMonthlyTotal) {
    throw new Error(`Límite mensual de transferencia superado. Ya se han transferido ${monthlyTotal} este mes y el máximo es ${limit.maxMonthlyTotal}.`);
  }

  if (dailyCount + 1 > limit.maxDailyCount) {
    throw new Error(`Límite de cantidad diaria de transferencias superado. Ya realizaste ${dailyCount} transferencias hoy y el máximo es ${limit.maxDailyCount}.`);
  }

  return true;
};
