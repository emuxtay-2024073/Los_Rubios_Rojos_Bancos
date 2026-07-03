
const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

exports.deposit = async (accountId, amount) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const account = await Account.findById(accountId).session(session);
        if (!account) throw new Error("Cuenta no encontrada");

        account.balance += amount;
        await account.save({ session });

        await Transaction.create([{
            accountId,
            type: 'DEPOSIT',
            amount
        }], { session });

        await session.commitTransaction();
        session.endSession();
        return account;

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
