import { Account } from "../Models/account.model.js";

const generarNumeroCuenta = () => "ACC" + Math.floor(100000 + Math.random() * 900000);

export const createAccount = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Validar que userId existe
        if (!userId) {
            return res.status(401).json({ 
                message: "No se pudo identificar al usuario. Token inválido o expirado.",
                error: "MISSING_USER_ID"
            });
        }

        // Verificar que el usuario tenga rol Admin
        if (req.user.role !== 'Admin') {
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

export const getAccounts = async (req, res) => {
    try {
        const isAdmin = req.user.roles.includes("Admin");
        const query = isAdmin ? {} : { userId: req.user.id };
        const accounts = await Account.find(query).sort({ createdAt: -1 });

        res.json({ success: true, total: accounts.length, accounts });
    } catch (error) {
        console.error("Error al obtener cuentas:", error);
        res.status(500).json({ message: "Error al obtener cuentas" });
    }
};

export const deposit = async (req, res) => {
    try {
        const { accountId, amount } = req.body;

        if (!accountId || !amount) return res.status(400).json({ message: "accountId y amount son obligatorios" });
        if (amount <= 0) return res.status(400).json({ message: "El monto debe ser mayor a 0" });

        const account = await Account.findById(accountId);
        if (!account) return res.status(404).json({ message: "Cuenta no encontrada" });

        if (!req.user.roles.includes("Admin") && account.userId !== req.user.id) {
            return res.status(403).json({ message: "No tienes permiso sobre esta cuenta" });
        }

        account.balance += Number(amount);
        await account.save();

        res.json({ success: true, message: "Depósito realizado exitosamente", account: { id: account._id, accountNumber: account.accountNumber, balance: account.balance } });
    } catch (error) {
        res.status(500).json({ message: "Error al depositar" });
    }
};


export const withdraw = async (req, res) => {
    try {
        const { accountId, amount } = req.body;

        if (!accountId || !amount) return res.status(400).json({ message: "accountId y amount son obligatorios" });
        if (amount <= 0) return res.status(400).json({ message: "El monto debe ser mayor a 0" });

        const account = await Account.findById(accountId);
        if (!account) return res.status(404).json({ message: "Cuenta no encontrada" });

        if (!req.user.roles.includes("Admin") && account.userId !== req.user.id) {
            return res.status(403).json({ message: "No tienes permiso sobre esta cuenta" });
        }

        if (account.balance < amount) {
            return res.status(400).json({ message: "Fondos insuficientes", balanceActual: account.balance });
        }

        account.balance -= Number(amount);
        await account.save();

        res.json({ success: true, message: "Retiro realizado exitosamente", account: { id: account._id, accountNumber: account.accountNumber, balance: account.balance } });
    } catch (error) {
        res.status(500).json({ message: "Error al retirar" });
    }
};