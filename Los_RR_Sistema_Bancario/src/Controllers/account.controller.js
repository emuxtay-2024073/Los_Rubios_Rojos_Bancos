import {
  createAccountService,
  updateAccountTypeService,
  getAccountsService,
  getAccountDetailsService,
  getAccountHistoryService,
  requestDisableAccountService,
  getDisableAccountRequestsService,
  approveDisableAccountRequestService,
  rejectDisableAccountRequestService,
  requestReactivateAccountService,
  getReactivateAccountRequestsService,
  approveReactivateRequestService,
  rejectReactivateRequestService
} from "../services/account.service.js";

import {
  depositService,
  withdrawService
} from "../services/banking.service.js";

export const createAccount = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { type, initialBalance } = req.body;

    const nuevaCuenta = await createAccountService(userId, type, initialBalance, req.user);

    res.status(201).json({
      success: true,
      message: "Cuenta creada exitosamente",
      account: nuevaCuenta
    });
  } catch (error) {
    if (error.message === "MISSING_USER_ID") {
      return res.status(401).json({
        message: "No se pudo identificar al usuario. Token inválido o expirado.",
        error: "MISSING_USER_ID"
      });
    }
    if (error.message === "INSUFFICIENT_PERMISSIONS") {
      return res.status(403).json({
        message: "Solo los administradores pueden crear cuentas bancarias.",
        error: "INSUFFICIENT_PERMISSIONS"
      });
    }
    res.status(400).json({ message: error.message });
  }
};

export const updateAccountType = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { newType } = req.body;

    const account = await updateAccountTypeService(accountId, newType, req.user);

    res.json({
      success: true,
      message: "Tipo de cuenta actualizado exitosamente",
      account: {
        id: account._id,
        accountNumber: account.accountNumber,
        type: account.type,
        balance: account.balance
      }
    });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "No tienes permiso para actualizar esta cuenta" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const { accountNumber } = req.query;
    const accounts = await getAccountsService(accountNumber, req.user);

    res.json({ success: true, total: accounts.length, accounts });
  } catch (error) {
    console.error("Error al obtener cuentas:", error);
    res.status(500).json({ message: "Error al obtener cuentas" });
  }
};

export const getAccountDetails = async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await getAccountDetailsService(accountId, req.user);

    res.json({ success: true, account });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "No tienes permiso para ver esta cuenta" });
    }
    res.status(500).json({ message: "Error al obtener detalles de la cuenta" });
  }
};

export const getAccountHistory = async (req, res) => {
  try {
    const { accountId } = req.params;
    const transactions = await getAccountHistoryService(accountId, req.query, req.user);

    res.json({ success: true, total: transactions.length, accountId, transactions });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "No tienes permiso sobre esta cuenta" });
    }
    console.error("Error al obtener historial de cuenta:", error);
    res.status(500).json({ message: "Error al obtener historial de cuenta" });
  }
};

export const requestDisableAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { reason, additionalInfo } = req.body;

    const disableRequest = await requestDisableAccountService(accountId, reason, additionalInfo, req.user);

    res.status(201).json({
      success: true,
      message: "Solicitud de deshabilitación creada exitosamente",
      request: disableRequest,
    });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Solo el propietario puede solicitar la deshabilitación" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const getDisableAccountRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await getDisableAccountRequestsService(status, req.user);

    res.json({ success: true, total: requests.length, requests });
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Solo administradores pueden ver solicitudes de deshabilitación" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const approveDisableAccountRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { responseReason } = req.body;

    const result = await approveDisableAccountRequestService(requestId, responseReason, req.user);

    res.json({
      success: true,
      message: "Solicitud aprobada y cuenta deshabilitada",
      request: result.request,
      account: result.account
    });
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Solo administradores pueden aprobar solicitudes" });
    }
    if (error.message === "NOT_FOUND_REQUEST") {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }
    if (error.message === "NOT_FOUND_ACCOUNT") {
      return res.status(404).json({ message: "Cuenta ligada a la solicitud no encontrada" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const rejectDisableAccountRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { responseReason } = req.body;

    const request = await rejectDisableAccountRequestService(requestId, responseReason, req.user);

    res.json({ success: true, message: "Solicitud rechazada", request });
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Solo administradores pueden rechazar solicitudes" });
    }
    if (error.message === "NOT_FOUND_REQUEST") {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const deposit = async (req, res) => {
  try {
    const { accountId, amount, currency, description } = req.body;
    const result = await depositService(accountId, amount, currency, description, req.user);

    res.json({
      success: true,
      message: "Depósito realizado exitosamente",
      account: {
        id: result.account._id,
        accountNumber: result.account.accountNumber,
        balance: result.account.balance
      },
      transaction: result.transaction,
    });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "No tienes permiso sobre esta cuenta" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const withdraw = async (req, res) => {
  try {
    const { accountId, amount, currency, description } = req.body;
    const result = await withdrawService(accountId, amount, currency, description, req.user);

    res.json({
      success: true,
      message: "Retiro realizado exitosamente",
      account: {
        id: result.account._id,
        accountNumber: result.account.accountNumber,
        balance: result.account.balance
      },
      transaction: result.transaction,
    });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "No tienes permiso sobre esta cuenta" });
    }
    if (error.message === "FONDOS_INSUFICIENTES") {
      return res.status(400).json({ message: "Fondos insuficientes" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const requestReactivateAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { dpi, description } = req.body;

    const request = await requestReactivateAccountService(accountId, dpi, description, req.user);

    res.status(201).json({
      success: true,
      message: "Solicitud de habilitación creada exitosamente",
      request
    });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Solo el propietario puede solicitar la habilitación" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const getReactivateAccountRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await getReactivateAccountRequestsService(status, req.user);

    res.json({ success: true, total: requests.length, requests });
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Solo administradores pueden ver solicitudes de habilitación" });
    }
    res.status(400).json({ message: error.message });
  }
};

export const approveReactivateRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { responseReason } = req.body;

    const result = await approveReactivateRequestService(requestId, responseReason, req.user);

    res.json({
      success: true,
      message: 'Solicitud aprobada y cuenta reactivada',
      request: result.request,
      account: result.account
    });
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Solo administradores pueden aprobar solicitudes" });
    }
    if (error.message === "NOT_FOUND_REQUEST") {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    if (error.message === "NOT_FOUND_ACCOUNT") {
      return res.status(404).json({ message: 'Cuenta ligada a la solicitud no encontrada' });
    }
    res.status(400).json({ message: error.message });
  }
};

export const rejectReactivateRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { responseReason } = req.body;

    const request = await rejectReactivateRequestService(requestId, responseReason, req.user);

    res.json({ success: true, message: 'Solicitud rechazada', request });
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Solo administradores pueden rechazar solicitudes" });
    }
    if (error.message === "NOT_FOUND_REQUEST") {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    res.status(400).json({ message: error.message });
  }
};