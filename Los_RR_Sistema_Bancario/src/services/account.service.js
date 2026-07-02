import { Account } from "../Models/account.model.js";
import { Transaction } from "../Models/transaction.model.js";
import { ExchangeRate } from "../Models/exchangeRate.model.js";
import { DisableAccountRequest } from "../Models/disableAccountRequest.model.js";
import { ReactivateAccountRequest } from "../Models/reactivateAccountRequest.model.js";
import { isAdmin } from "../Helpers/roleHelpers.js";
import axios from 'axios';

export const generarNumeroCuenta = () => "ACC" + Math.floor(100000 + Math.random() * 900000);

export const findAccountByIdOrNumber = async (accountId) => {
    if (/^ACC\d{6}$/.test(accountId)) {
        return await Account.findOne({ accountNumber: accountId });
    }
    return await Account.findById(accountId);
};

export const getActiveExchangeRate = async (fromCurrency, toCurrency) => {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (from === to) {
        return { rate: 1 };
    }

    const directRate = await ExchangeRate.findOne({
        fromCurrency: from,
        toCurrency: to,
        isActive: true,
        validUntil: { $gte: new Date() },
    });

    if (directRate) {
        return { rate: directRate.rate, source: directRate.source };
    }

    const inverseRate = await ExchangeRate.findOne({
        fromCurrency: to,
        toCurrency: from,
        isActive: true,
        validUntil: { $gte: new Date() },
    });

    if (inverseRate) {
        return { rate: 1 / inverseRate.rate, source: inverseRate.source };
    }

    throw new Error(`No hay tasa de cambio disponible para ${from} -> ${to}`);
};

export const convertAmount = async (amount, fromCurrency, toCurrency) => {
    const rateInfo = await getActiveExchangeRate(fromCurrency, toCurrency);
    return {
        convertedAmount: Number((amount * rateInfo.rate).toFixed(2)),
        exchangeRate: Number(rateInfo.rate.toFixed(6)),
        currency: fromCurrency.toUpperCase(),
    };
};

export const createDefaultAccountForClient = async (userId, accountType = 'ahorro') => {
    const validTypes = ['ahorro', 'monetaria', 'corriente'];
    const type = validTypes.includes(accountType) ? accountType : 'ahorro';
    const defaultAccount = new Account({
        userId,
        accountNumber: generarNumeroCuenta(),
        type,
        balance: 0,
    });
    await defaultAccount.save();
    return defaultAccount;
};

export const createAccountService = async (userId, type, initialBalance, userRoleContext) => {
    if (!userId) {
        throw new Error("MISSING_USER_ID");
    }

    if (!isAdmin(userRoleContext)) {
        throw new Error("INSUFFICIENT_PERMISSIONS");
    }

    if (!type) {
        throw new Error("El campo type es obligatorio");
    }

    if (!["ahorro", "monetaria", "corriente"].includes(type)) {
        throw new Error("El tipo debe ser: ahorro, monetaria o corriente");
    }

    if (initialBalance !== undefined && initialBalance < 0) {
        throw new Error("El saldo inicial no puede ser negativo");
    }

    const cuentaExistente = await Account.findOne({ userId, type });
    if (cuentaExistente) {
        throw new Error("Ya tienes una cuenta de este tipo");
    }

    const nuevaCuenta = new Account({
        userId,
        accountNumber: generarNumeroCuenta(),
        type,
        balance: initialBalance || 0
    });

    await nuevaCuenta.save();
    return nuevaCuenta;
};

export const updateAccountTypeService = async (accountId, newType, userContext) => {
    if (!accountId) {
        throw new Error("accountId es obligatorio");
    }

    if (!newType) {
        throw new Error("newType es obligatorio");
    }

    const validTypes = ['ahorro', 'monetaria', 'corriente'];
    if (!validTypes.includes(newType)) {
        throw new Error(`El tipo debe ser uno de: ${validTypes.join(', ')}`);
    }

    const account = await findAccountByIdOrNumber(accountId);
    if (!account) {
        throw new Error("NOT_FOUND");
    }

    if (account.type === newType) {
        throw new Error(`La cuenta ya es de tipo ${newType}`);
    }

    const userIsAdmin = isAdmin(userContext);
    if (!userIsAdmin && account.userId !== userContext.id) {
        throw new Error("FORBIDDEN");
    }

    const existingAccount = await Account.findOne({
        userId: account.userId,
        type: newType,
        _id: { $ne: account._id }
    });

    if (existingAccount) {
        throw new Error(`Ya tienes otra cuenta de tipo ${newType}`);
    }

    account.type = newType;
    await account.save();
    return account;
};

export const getAccountsService = async (accountNumber, userContext) => {
    const userIsAdmin = isAdmin(userContext);
    let query = {};

    if (accountNumber) {
        query.accountNumber = accountNumber;
    } else if (!userIsAdmin) {
        query.userId = userContext.id;
    }

    let accounts = await Account.find(query).sort({ createdAt: -1 });

    if (!accountNumber && !userIsAdmin && accounts.length === 0) {
        const newAccount = await createDefaultAccountForClient(userContext.id, userContext.accountType);
        accounts = [newAccount];
    }

    return accounts;
};

export const getAccountDetailsService = async (accountId, userContext) => {
    const account = await findAccountByIdOrNumber(accountId);

    if (!account) {
        throw new Error("NOT_FOUND");
    }

    const userIsAdmin = isAdmin(userContext);
    if (!userIsAdmin && account.userId !== userContext.id) {
        throw new Error("FORBIDDEN");
    }

    return account;
};

export const getAccountHistoryService = async (accountId, queryParams, userContext) => {
    const account = await findAccountByIdOrNumber(accountId);
    if (!account) {
        throw new Error("NOT_FOUND");
    }

    const userIsAdmin = isAdmin(userContext);
    if (!userIsAdmin && account.userId !== userContext.id) {
        throw new Error("FORBIDDEN");
    }

    const { type, direction, startDate, endDate, minAmount, maxAmount, search } = queryParams;
    const mongoId = account._id.toString();

    const query = {
        $or: [
            { originAccount: mongoId },
            { destinationAccount: mongoId },
        ],
    };

    if (type) {
        query.type = type.toUpperCase();
    }

    if (direction === 'in') {
        query.$or = undefined;
        query.destinationAccount = mongoId;
    } else if (direction === 'out') {
        query.$or = undefined;
        query.originAccount = mongoId;
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

    const transactions = await Transaction.find(query).sort({ date: -1 });
    return transactions;
};

export const requestDisableAccountService = async (accountId, reason, additionalInfo, userContext) => {
    if (!reason) {
        throw new Error("La razón de la solicitud es obligatoria");
    }

    const account = await findAccountByIdOrNumber(accountId);
    if (!account) {
        throw new Error("NOT_FOUND");
    }

    if (account.userId !== userContext.id) {
        throw new Error("FORBIDDEN");
    }

    if (!account.isActive) {
        throw new Error("La cuenta ya está deshabilitada");
    }

    const pendingRequest = await DisableAccountRequest.findOne({ accountId: account._id, status: 'PENDING' });
    if (pendingRequest) {
        throw new Error("Ya existe una solicitud de deshabilitación pendiente para esta cuenta");
    }

    const disableRequest = new DisableAccountRequest({
        accountId: account._id,
        requestedBy: userContext.id,
        reason,
        additionalInfo: additionalInfo || '',
    });

    await disableRequest.save();
    return disableRequest;
};

export const getDisableAccountRequestsService = async (status, userContext) => {
    const userIsAdmin = isAdmin(userContext);
    if (!userIsAdmin) {
        throw new Error("FORBIDDEN");
    }

    const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
    const query = {};

    if (status) {
        const normalizedStatus = String(status).trim().toUpperCase();
        if (!allowedStatuses.includes(normalizedStatus)) {
            throw new Error("Estado inválido para filtrar solicitudes");
        }
        query.status = normalizedStatus;
    }

    const requests = await DisableAccountRequest.find(query).sort({ requestedAt: -1 });
    return requests;
};

export const approveDisableAccountRequestService = async (requestId, responseReason, userContext) => {
    if (!isAdmin(userContext)) {
        throw new Error("FORBIDDEN");
    }

    const request = await DisableAccountRequest.findById(requestId);
    if (!request) {
        throw new Error("NOT_FOUND_REQUEST");
    }

    if (request.status !== 'PENDING') {
        throw new Error("Solo solicitudes pendientes pueden ser aprobadas");
    }

    const account = await Account.findById(request.accountId);
    if (!account) {
        throw new Error("NOT_FOUND_ACCOUNT");
    }

    if (!account.isActive) {
        throw new Error("La cuenta ya está deshabilitada");
    }

    account.isActive = false;
    account.suspendedAt = new Date();
    account.suspensionReason = responseReason || 'Deshabilitación aprobada por administrador';
    await account.save();

    request.status = 'APPROVED';
    request.reviewedBy = userContext.id;
    request.reviewedAt = new Date();
    request.responseReason = responseReason || '';
    await request.save();

    return { request, account };
};

export const rejectDisableAccountRequestService = async (requestId, responseReason, userContext) => {
    if (!isAdmin(userContext)) {
        throw new Error("FORBIDDEN");
    }

    const request = await DisableAccountRequest.findById(requestId);
    if (!request) {
        throw new Error("NOT_FOUND_REQUEST");
    }

    if (request.status !== 'PENDING') {
        throw new Error("Solo solicitudes pendientes pueden ser rechazadas");
    }

    request.status = 'REJECTED';
    request.reviewedBy = userContext.id;
    request.reviewedAt = new Date();
    request.responseReason = responseReason || 'Rechazo de solicitud';
    await request.save();

    return request;
};

export const requestReactivateAccountService = async (accountId, dpi, description, userContext) => {
    if (!dpi || !description) {
        throw new Error("DPI y descripción son obligatorios");
    }

    const dpiClean = String(dpi).replace(/\s+/g, '');
    if (!/^[0-9]{5,20}$/.test(dpiClean)) {
        throw new Error("DPI inválido. Debe contener solo dígitos (5-20 caracteres)");
    }

    const account = await findAccountByIdOrNumber(accountId);
    if (!account) {
        throw new Error("NOT_FOUND");
    }

    if (String(account.userId) !== String(userContext.id)) {
        throw new Error("FORBIDDEN");
    }

    if (account.isActive) {
        throw new Error("La cuenta ya está activa");
    }

    const pending = await ReactivateAccountRequest.findOne({ accountId: account._id, status: 'PENDING' });
    if (pending) {
        throw new Error("Ya existe una solicitud de habilitación pendiente para esta cuenta");
    }

    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5109';
    const adminToken = process.env.AUTH_SERVICE_ADMIN_TOKEN || null;
    if (adminToken) {
        try {
            const resp = await axios.get(`${authServiceUrl}/api/auth/users`, {
                headers: { Authorization: `Bearer ${adminToken}` },
                timeout: 5000,
            });
            const users = Array.isArray(resp.data) ? resp.data : resp.data?.users || [];
            const owner = users.find(u => String(u.id) === String(account.userId) || String(u.Id) === String(account.userId));
            if (!owner) {
                console.warn(`AuthService: usuario ${account.userId} no encontrado al validar DPI`);
            } else if (owner.dpi && String(owner.dpi).replace(/\s+/g, '') !== dpiClean) {
                throw new Error("El DPI proporcionado no coincide con nuestros registros de identidad");
            }
        } catch (err) {
            console.warn('No se pudo validar DPI con AuthService:', err.message || err);
            if (err.message.includes("El DPI proporcionado")) {
                throw err;
            }
        }
    }

    const reqDoc = new ReactivateAccountRequest({
        accountId: account._id,
        requestedBy: userContext.id,
        dpi: dpiClean,
        description: description.trim(),
    });

    await reqDoc.save();
    return reqDoc;
};

export const getReactivateAccountRequestsService = async (status, userContext) => {
    if (!isAdmin(userContext)) {
        throw new Error("FORBIDDEN");
    }

    const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
    const query = {};

    if (status) {
        const normalizedStatus = String(status).trim().toUpperCase();
        if (!allowedStatuses.includes(normalizedStatus)) {
            throw new Error('Estado inválido para filtrar solicitudes');
        }
        query.status = normalizedStatus;
    }

    const requests = await ReactivateAccountRequest.find(query).sort({ requestedAt: -1 });
    return requests;
};

export const approveReactivateRequestService = async (requestId, responseReason, userContext) => {
    if (!isAdmin(userContext)) {
        throw new Error("FORBIDDEN");
    }

    const request = await ReactivateAccountRequest.findById(requestId);
    if (!request) throw new Error('NOT_FOUND_REQUEST');
    if (request.status !== 'PENDING') throw new Error('Solo solicitudes pendientes pueden ser aprobadas');

    const account = await Account.findById(request.accountId);
    if (!account) throw new Error('NOT_FOUND_ACCOUNT');
    if (account.isActive) throw new Error('La cuenta ya está activa');

    account.isActive = true;
    account.suspendedAt = null;
    account.suspensionReason = '';
    await account.save();

    request.status = 'APPROVED';
    request.reviewedBy = userContext.id;
    request.reviewedAt = new Date();
    request.responseReason = responseReason || 'Habilitación aprobada por administrador';
    await request.save();

    return { request, account };
};

export const rejectReactivateRequestService = async (requestId, responseReason, userContext) => {
    if (!isAdmin(userContext)) {
        throw new Error("FORBIDDEN");
    }

    const request = await ReactivateAccountRequest.findById(requestId);
    if (!request) throw new Error('NOT_FOUND_REQUEST');
    if (request.status !== 'PENDING') throw new Error('Solo solicitudes pendientes pueden ser rechazadas');

    request.status = 'REJECTED';
    request.reviewedBy = userContext.id;
    request.reviewedAt = new Date();
    request.responseReason = responseReason || 'Rechazo de solicitud';
    await request.save();

    return request;
};
