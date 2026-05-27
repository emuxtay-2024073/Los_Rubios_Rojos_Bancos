import { Account } from "../Models/account.model.js";
import { Transaction } from "../Models/transaction.model.js";
import { ExchangeRate } from "../Models/exchangeRate.model.js";
import { DisableAccountRequest } from "../Models/disableAccountRequest.model.js";
import { ReactivateAccountRequest } from "../Models/reactivateAccountRequest.model.js";
import axios from 'axios';
 
const generarNumeroCuenta = () => "ACC" + Math.floor(100000 + Math.random() * 900000);
 
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
 
const getActiveExchangeRate = async (fromCurrency, toCurrency) => {
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
 
const convertAmount = async (amount, fromCurrency, toCurrency) => {
    const rateInfo = await getActiveExchangeRate(fromCurrency, toCurrency);
    return {
        convertedAmount: Number((amount * rateInfo.rate).toFixed(2)),
        exchangeRate: Number(rateInfo.rate.toFixed(6)),
        currency: fromCurrency.toUpperCase(),
    };
};
 
const createDefaultAccountForClient = async (userId, accountType = 'ahorro') => {
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
 
export const createAccount = async (req, res) => {
    try {
        const userId = req.user?.id;
 
        if (!userId) {
            return res.status(401).json({
                message: "No se pudo identificar al usuario. Token inválido o expirado.",
                error: "MISSING_USER_ID"
            });
        }
 
        if (!req.user?.roles?.some(role => role.toLowerCase() === 'admin')) {
            return res.status(403).json({
                message: "Solo los administradores pueden crear cuentas bancarias.",
                error: "INSUFFICIENT_PERMISSIONS"
            });
        }
 
        const { type, initialBalance } = req.body;
 
        if (!type) {
            return res.status(400).json({ message: "El campo type es obligatorio" });
        }
 
        if (!["ahorro", "monetaria", "corriente"].includes(type)) {
            return res.status(400).json({ message: "El tipo debe ser: ahorro, monetaria o corriente" });
        }
 
        if (initialBalance !== undefined && initialBalance < 0) {
            return res.status(400).json({ message: "El saldo inicial no puede ser negativo" });
        }
 
        const cuentaExistente = await Account.findOne({ userId, type });
        if (cuentaExistente) {
            return res.status(400).json({ message: "Ya tienes una cuenta de este tipo" });
        }
 
        const nuevaCuenta = new Account({
            userId,
            accountNumber: generarNumeroCuenta(),
            type,
            balance: initialBalance || 0
        });
 
        await nuevaCuenta.save();
 
        res.status(201).json({
            success: true,
            message: "Cuenta creada exitosamente",
            account: nuevaCuenta
        });
 
    } catch (error) {
        console.error("Error al crear cuenta:", error);
        res.status(500).json({ message: "Error al crear cuenta", error: error.message });
    }
};
 
export const updateAccountType = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { newType } = req.body;
 
        if (!accountId) {
            return res.status(400).json({ message: "accountId es obligatorio" });
        }
 
        if (!newType) {
            return res.status(400).json({ message: "newType es obligatorio" });
        }
 
        const validTypes = ['ahorro', 'monetaria', 'corriente'];
        if (!validTypes.includes(newType)) {
            return res.status(400).json({ message: `El tipo debe ser uno de: ${validTypes.join(', ')}` });
        }
 
        // CORREGIDO: usar findAccountByIdOrNumber en lugar de findById
        const account = await findAccountByIdOrNumber(accountId);
        if (!account) {
            return res.status(404).json({ message: "Cuenta no encontrada" });
        }
 
        if (account.type === newType) {
            return res.status(400).json({ message: `La cuenta ya es de tipo ${newType}` });
        }
 
        const isAdmin = req.user?.roles?.some(role => role.toLowerCase() === 'admin');
        if (!isAdmin && account.userId !== req.user.id) {
            return res.status(403).json({ message: "No tienes permiso para actualizar esta cuenta" });
        }
 
        const existingAccount = await Account.findOne({
            userId: account.userId,
            type: newType,
            _id: { $ne: account._id }
        });
 
        if (existingAccount) {
            return res.status(400).json({ message: `Ya tienes otra cuenta de tipo ${newType}` });
        }
 
        account.type = newType;
        await account.save();
 
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
        console.error("Error al actualizar tipo de cuenta:", error);
        res.status(500).json({ message: "Error al actualizar tipo de cuenta", error: error.message });
    }
};
 
export const getAccounts = async (req, res) => {
    try {
        const isAdmin = req.user.roles.some(role => role.toLowerCase() === 'admin');
        const { accountNumber } = req.query;
        let query = {};
 
        if (accountNumber) {
            query.accountNumber = accountNumber;
        } else if (!isAdmin) {
            query.userId = req.user.id;
        }
 
        let accounts = await Account.find(query).sort({ createdAt: -1 });
 
        if (!accountNumber && !isAdmin && accounts.length === 0) {
            const newAccount = await createDefaultAccountForClient(req.user.id, req.user.accountType);
            accounts = [newAccount];
        }
 
        res.json({ success: true, total: accounts.length, accounts });
    } catch (error) {
        console.error("Error al obtener cuentas:", error);
        res.status(500).json({ message: "Error al obtener cuentas" });
    }
};
 
export const getAccountDetails = async (req, res) => {
    try {
        const { accountId } = req.params;
 
        // CORREGIDO: usar findAccountByIdOrNumber en lugar de findById
        const account = await findAccountByIdOrNumber(accountId);
 
        if (!account) {
            return res.status(404).json({ message: "Cuenta no encontrada" });
        }
 
        const isAdmin = req.user.roles.some(role => role.toLowerCase() === 'admin');
        if (!isAdmin && account.userId !== req.user.id) {
            return res.status(403).json({ message: "No tienes permiso para ver esta cuenta" });
        }
 
        res.json({ success: true, account });
    } catch (error) {
        console.error("Error al obtener detalles de la cuenta:", error);
        res.status(500).json({ message: "Error al obtener detalles de la cuenta" });
    }
};
 
export const getAccountHistory = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { type, direction, startDate, endDate, minAmount, maxAmount, search } = req.query;
 
        // CORREGIDO: usar findAccountByIdOrNumber en lugar de findById
        const account = await findAccountByIdOrNumber(accountId);
        if (!account) {
            return res.status(404).json({ message: "Cuenta no encontrada" });
        }
 
        const isAdmin = req.user.roles.some(role => role.toLowerCase() === 'admin');
        if (!isAdmin && account.userId !== req.user.id) {
            return res.status(403).json({ message: "No tienes permiso sobre esta cuenta" });
        }
 
        // Usar el _id real de MongoDB para buscar transacciones
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
 
        res.json({ success: true, total: transactions.length, accountId, transactions });
    } catch (error) {
        console.error("Error al obtener historial de cuenta:", error);
        res.status(500).json({ message: "Error al obtener historial de cuenta" });
    }
};
 
export const requestDisableAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { reason, additionalInfo } = req.body;
        const userId = req.user.id;
 
        if (!reason) {
            return res.status(400).json({ message: "La razón de la solicitud es obligatoria" });
        }
 
        // CORREGIDO: usar findAccountByIdOrNumber en lugar de findById
        const account = await findAccountByIdOrNumber(accountId);
        if (!account) {
            return res.status(404).json({ message: "Cuenta no encontrada" });
        }
 
        if (account.userId !== userId) {
            return res.status(403).json({ message: "Solo el propietario puede solicitar la deshabilitación" });
        }
 
        if (!account.isActive) {
            return res.status(400).json({ message: "La cuenta ya está deshabilitada" });
        }
 
        const pendingRequest = await DisableAccountRequest.findOne({ accountId: account._id, status: 'PENDING' });
        if (pendingRequest) {
            return res.status(400).json({ message: "Ya existe una solicitud de deshabilitación pendiente para esta cuenta" });
        }
 
        const disableRequest = new DisableAccountRequest({
            accountId: account._id,
            requestedBy: userId,
            reason,
            additionalInfo: additionalInfo || '',
        });
 
        await disableRequest.save();
 
        res.status(201).json({
            success: true,
            message: "Solicitud de deshabilitación creada exitosamente",
            request: disableRequest,
        });
    } catch (error) {
        console.error("Error al solicitar deshabilitación de cuenta:", error);
        res.status(500).json({ message: "Error al crear solicitud de deshabilitación" });
    }
};
 
export const getDisableAccountRequests = async (req, res) => {
    try {
        const isAdmin = req.user.roles.some(role => role.toLowerCase() === 'admin');
        if (!isAdmin) {
            return res.status(403).json({ message: "Solo administradores pueden ver solicitudes de deshabilitación" });
        }
 
        const { status } = req.query;
        const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
        const query = {};
 
        if (status) {
            const normalizedStatus = String(status).trim().toUpperCase();
            if (!allowedStatuses.includes(normalizedStatus)) {
                return res.status(400).json({ message: "Estado inválido para filtrar solicitudes" });
            }
            query.status = normalizedStatus;
        }
 
        const requests = await DisableAccountRequest.find(query).sort({ requestedAt: -1 });
 
        res.json({ success: true, total: requests.length, requests });
    } catch (error) {
        console.error("Error al obtener solicitudes de deshabilitación:", error);
        res.status(500).json({ message: "Error al obtener solicitudes de deshabilitación" });
    }
};
 
export const approveDisableAccountRequest = async (req, res) => {
    try {
        if (!req.user?.roles?.some(role => role.toLowerCase() === 'admin')) {
            return res.status(403).json({ message: "Solo administradores pueden aprobar solicitudes" });
        }
 
        const { requestId } = req.params;
        const { responseReason } = req.body;
 
        const request = await DisableAccountRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Solicitud no encontrada" });
        }
 
        if (request.status !== 'PENDING') {
            return res.status(400).json({ message: "Solo solicitudes pendientes pueden ser aprobadas" });
        }
 
        // request.accountId siempre es un ObjectId guardado internamente, findById es correcto aquí
        const account = await Account.findById(request.accountId);
        if (!account) {
            return res.status(404).json({ message: "Cuenta ligada a la solicitud no encontrada" });
        }
 
        if (!account.isActive) {
            return res.status(400).json({ message: "La cuenta ya está deshabilitada" });
        }
 
        account.isActive = false;
        account.suspendedAt = new Date();
        account.suspensionReason = responseReason || 'Deshabilitación aprobada por administrador';
        await account.save();
 
        request.status = 'APPROVED';
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();
        request.responseReason = responseReason || '';
        await request.save();
 
        res.json({ success: true, message: "Solicitud aprobada y cuenta deshabilitada", request, account });
    } catch (error) {
        console.error("Error al aprobar solicitud de deshabilitación:", error);
        res.status(500).json({ message: "Error al aprobar solicitud de deshabilitación" });
    }
};
 
export const rejectDisableAccountRequest = async (req, res) => {
    try {
        if (!req.user?.roles?.some(role => role.toLowerCase() === 'admin')) {
            return res.status(403).json({ message: "Solo administradores pueden rechazar solicitudes" });
        }
 
        const { requestId } = req.params;
        const { responseReason } = req.body;
 
        const request = await DisableAccountRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Solicitud no encontrada" });
        }
 
        if (request.status !== 'PENDING') {
            return res.status(400).json({ message: "Solo solicitudes pendientes pueden ser rechazadas" });
        }
 
        request.status = 'REJECTED';
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();
        request.responseReason = responseReason || 'Rechazo de solicitud';
        await request.save();
 
        res.json({ success: true, message: "Solicitud rechazada", request });
    } catch (error) {
        console.error("Error al rechazar solicitud de deshabilitación:", error);
        res.status(500).json({ message: "Error al rechazar solicitud de deshabilitación" });
    }
};
 
export const deposit = async (req, res) => {
    try {
        const { accountId, amount, currency = 'GTQ', description = '' } = req.body;
        const depositCurrency = String(currency).toUpperCase();
 
        if (!accountId || amount === undefined) return res.status(400).json({ message: "accountId y amount son obligatorios" });
        const amountNumber = Number(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) return res.status(400).json({ message: "El monto debe ser mayor a 0" });
 
        // CORREGIDO: usar findAccountByIdOrNumber en lugar de findById
        const account = await findAccountByIdOrNumber(accountId);
        if (!account) return res.status(404).json({ message: "Cuenta no encontrada" });
 
        if (!req.user.roles.some(role => role.toLowerCase() === 'admin') && account.userId !== req.user.id) {
            return res.status(403).json({ message: "No tienes permiso sobre esta cuenta" });
        }
 
        if (!account.isActive) return res.status(400).json({ message: "No se puede depositar en una cuenta deshabilitada" });
 
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
 
        res.json({
            success: true,
            message: "Depósito realizado exitosamente",
            account: { id: account._id, accountNumber: account.accountNumber, balance: account.balance },
            transaction,
        });
    } catch (error) {
        console.error("Error al depositar:", error);
        res.status(500).json({ message: "Error al depositar" });
    }
};
 
export const withdraw = async (req, res) => {
    try {
        const { accountId, amount, currency = null, description = '' } = req.body;
 
        if (!accountId || amount === undefined) return res.status(400).json({ message: "accountId y amount son obligatorios" });
        const amountNumber = Number(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) return res.status(400).json({ message: "El monto debe ser mayor a 0" });
 
        // CORREGIDO: usar findAccountByIdOrNumber en lugar de findById
        // (también se movió la validación de accountId antes de la búsqueda)
        const account = await findAccountByIdOrNumber(accountId);
        if (!account) return res.status(404).json({ message: "Cuenta no encontrada" });
 
        if (!req.user.roles.some(role => role.toLowerCase() === 'admin') && account.userId !== req.user.id) {
            return res.status(403).json({ message: "No tienes permiso sobre esta cuenta" });
        }
 
        if (!account.isActive) return res.status(400).json({ message: "No se puede retirar de una cuenta deshabilitada" });
 
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
            return res.status(400).json({ message: "Fondos insuficientes", balanceActual: account.balance });
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
 
        res.json({
            success: true,
            message: "Retiro realizado exitosamente",
            account: { id: account._id, accountNumber: account.accountNumber, balance: account.balance },
            transaction,
        });
    } catch (error) {
        console.error("Error al retirar:", error);
        res.status(500).json({ message: "Error al retirar" });
    }
};
 
export const requestReactivateAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { dpi, description } = req.body;
        const userId = req.user.id;
 
        if (!dpi || !description) {
            return res.status(400).json({ message: "DPI y descripción son obligatorios" });
        }
 
        const dpiClean = String(dpi).replace(/\s+/g, '');
        if (!/^[0-9]{5,20}$/.test(dpiClean)) {
            return res.status(400).json({ message: "DPI inválido. Debe contener solo dígitos (5-20 caracteres)" });
        }
 
        // CORREGIDO: usar findAccountByIdOrNumber en lugar de findById
        const account = await findAccountByIdOrNumber(accountId);
        if (!account) {
            return res.status(404).json({ message: "Cuenta no encontrada" });
        }
 
        if (String(account.userId) !== String(userId)) {
            return res.status(403).json({ message: "Solo el propietario puede solicitar la habilitación" });
        }
 
        if (account.isActive) {
            return res.status(400).json({ message: "La cuenta ya está activa" });
        }
 
        const pending = await ReactivateAccountRequest.findOne({ accountId: account._id, status: 'PENDING' });
        if (pending) {
            return res.status(400).json({ message: "Ya existe una solicitud de habilitación pendiente para esta cuenta" });
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
                    return res.status(400).json({ message: "El DPI proporcionado no coincide con nuestros registros de identidad" });
                }
            } catch (err) {
                console.warn('No se pudo validar DPI con AuthService:', err.message || err);
            }
        }
 
        const reqDoc = new ReactivateAccountRequest({
            accountId: account._id,
            requestedBy: userId,
            dpi: dpiClean,
            description: description.trim(),
        });
 
        await reqDoc.save();
 
        res.status(201).json({ success: true, message: "Solicitud de habilitación creada exitosamente", request: reqDoc });
    } catch (error) {
        console.error("Error al solicitar habilitación de cuenta:", error);
        res.status(500).json({ message: "Error al crear solicitud de habilitación" });
    }
};
 
export const getReactivateAccountRequests = async (req, res) => {
    try {
        if (!req.user?.roles?.some(role => role.toLowerCase() === 'admin')) {
            return res.status(403).json({ message: "Solo administradores pueden ver solicitudes de habilitación" });
        }
 
        const { status } = req.query;
        const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
        const query = {};
 
        if (status) {
            const normalizedStatus = String(status).trim().toUpperCase();
            if (!allowedStatuses.includes(normalizedStatus)) {
                return res.status(400).json({ message: 'Estado inválido para filtrar solicitudes' });
            }
            query.status = normalizedStatus;
        }
 
        const requests = await ReactivateAccountRequest.find(query).sort({ requestedAt: -1 });
 
        res.json({ success: true, total: requests.length, requests });
    } catch (error) {
        console.error('Error al obtener solicitudes de habilitación:', error);
        res.status(500).json({ message: 'Error al obtener solicitudes de habilitación' });
    }
};
 
export const approveReactivateRequest = async (req, res) => {
    try {
        if (!req.user?.roles?.some(role => role.toLowerCase() === 'admin')) {
            return res.status(403).json({ message: "Solo administradores pueden aprobar solicitudes" });
        }
 
        const { requestId } = req.params;
        const { responseReason } = req.body;
 
        const request = await ReactivateAccountRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });
        if (request.status !== 'PENDING') return res.status(400).json({ message: 'Solo solicitudes pendientes pueden ser aprobadas' });
 
        // request.accountId es siempre ObjectId interno, findById es correcto aquí
        const account = await Account.findById(request.accountId);
        if (!account) return res.status(404).json({ message: 'Cuenta ligada a la solicitud no encontrada' });
        if (account.isActive) return res.status(400).json({ message: 'La cuenta ya está activa' });
 
        account.isActive = true;
        account.suspendedAt = null;
        account.suspensionReason = '';
        await account.save();
 
        request.status = 'APPROVED';
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();
        request.responseReason = responseReason || 'Habilitación aprobada por administrador';
        await request.save();
 
        res.json({ success: true, message: 'Solicitud aprobada y cuenta reactivada', request, account });
    } catch (error) {
        console.error('Error al aprobar solicitud de habilitación:', error);
        res.status(500).json({ message: 'Error al aprobar solicitud de habilitación' });
    }
};
 
export const rejectReactivateRequest = async (req, res) => {
    try {
        if (!req.user?.roles?.some(role => role.toLowerCase() === 'admin')) {
            return res.status(403).json({ message: "Solo administradores pueden rechazar solicitudes" });
        }
 
        const { requestId } = req.params;
        const { responseReason } = req.body;
 
        const request = await ReactivateAccountRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });
        if (request.status !== 'PENDING') return res.status(400).json({ message: 'Solo solicitudes pendientes pueden ser rechazadas' });
 
        request.status = 'REJECTED';
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();
        request.responseReason = responseReason || 'Rechazo de solicitud';
        await request.save();
 
        res.json({ success: true, message: 'Solicitud rechazada', request });
    } catch (error) {
        console.error('Error al rechazar solicitud de habilitación:', error);
        res.status(500).json({ message: 'Error al rechazar solicitud de habilitación' });
    }
};
 