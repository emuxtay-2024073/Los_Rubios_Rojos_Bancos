import { useEffect, useMemo, useState } from 'react';
import { createAccount, depositToAccount, getAccounts, getTransactions, withdrawFromAccount } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { useAuthStore } from '../features/auth/store/authStore.js';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatMoney, formatDateTime, toTitleCase } from '../shared/utils/banking.js';

const emptyAccount = {
  type: 'ahorro',
  initialBalance: '',
};

export const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [actionType, setActionType] = useState('deposit');
  const [activeAccount, setActiveAccount] = useState(null);
  const [form, setForm] = useState(emptyAccount);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const [accountsData, transactionsData] = await Promise.all([getAccounts(), getTransactions()]);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (error) {
      showError('No se pudieron cargar las cuentas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        account.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
        account.type?.toLowerCase().includes(search.toLowerCase()) ||
        String(account.balance ?? '').includes(search),
      ),
    [accounts, search],
  );

  const accountMovements = useMemo(() => {
    if (!selectedAccount) return [];

    return transactions.filter((transaction) => {
      const isDepositOrWithdrawal = transaction.type === 'DEPOSITO' || transaction.type === 'RETIRO';
      const matchesAccount =
        transaction.originAccount?._id === selectedAccount._id ||
        transaction.destinationAccount?._id === selectedAccount._id ||
        transaction.originAccount?.accountNumber === selectedAccount.accountNumber ||
        transaction.destinationAccount?.accountNumber === selectedAccount.accountNumber;

      return isDepositOrWithdrawal && matchesAccount;
    });
  }, [selectedAccount, transactions]);

  const handleOpenModal = () => {
    setForm(emptyAccount);
    setModalOpen(true);
  };

  const openActionModal = (account, type) => {
    setActiveAccount(account);
    setActionType(type);
    setForm({ initialBalance: '' });
    setActionModalOpen(true);
  };

  const handleOpenAccountDetails = (account) => {
    setSelectedAccount(account);
    setAccountDetailsOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await createAccount({
        type: form.type,
        initialBalance: Number(form.initialBalance) || 0,
      });
      showSuccess('Cuenta creada');
      setModalOpen(false);
      loadAccounts();
    } catch (error) {
      showError(error?.response?.data?.message || 'No se pudo crear la cuenta');
    }
  };

  const handleActionSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        accountId: activeAccount._id,
        amount: Number(form.initialBalance) || 0,
      };

      if (actionType === 'deposit') {
        await depositToAccount(payload);
        showSuccess('Depósito realizado');
      } else {
        await withdrawFromAccount(payload);
        showSuccess('Retiro realizado');
      }

      setActionModalOpen(false);
      loadAccounts();
    } catch (error) {
      showError(error?.response?.data?.message || 'No se pudo procesar la operación');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:justify-between md:items-end'>
        <div>
          <p className='text-sm text-gray-500'>Gestión de cuentas</p>
          <h1 className='text-3xl font-bold text-main-blue'>Cuentas</h1>
          {isAdmin && (
            <p className='mt-2 text-sm text-gray-500'>Vista de sólo lectura para administradores. Aquí puedes ver datos y filtrar cuentas, pero no crear ni editar operaciones.</p>
          )}
        </div>
        {!isAdmin && (
          <button
            onClick={() => handleOpenModal(null)}
            className='rounded-full bg-main-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90'
          >
            + Nueva cuenta
          </button>
        )}
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center'>
        <input
          type='search'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Buscar por número, tipo o saldo'
          className='w-full max-w-lg rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-main-blue focus:outline-none'
        />
      </div>

      <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
        {filteredAccounts.map((account) => (
          <article
            key={account._id ?? account.accountNumber}
            className={`rounded-3xl border border-gray-200 bg-white p-6 shadow-sm ${isAdmin ? 'cursor-pointer hover:border-main-blue hover:shadow-md' : ''}`}
            onClick={() => isAdmin && handleOpenAccountDetails(account)}
          >
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h2 className='text-xl font-semibold text-slate-900'>{account.accountNumber}</h2>
                <p className='mt-2 text-sm text-gray-500'>{toTitleCase(account.type)}</p>
              </div>
              <span className='rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700'>
                {formatMoney(account.balance)}
              </span>
            </div>
            <p className='mt-4 text-sm text-slate-600'>Creada {formatDateTime(account.createdAt)}</p>
            {isAdmin && (
              <p className='mt-5 text-sm font-medium text-main-blue'>Toca para ver movimientos</p>
            )}
            {!isAdmin && (
              <div className='mt-5 flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={() => openActionModal(account, 'deposit')}
                  className='rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700'
                >
                  Depositar
                </button>
                <button
                  type='button'
                  onClick={() => openActionModal(account, 'withdraw')}
                  className='rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700'
                >
                  Retirar
                </button>
              </div>
            )}
          </article>
        ))}
        {filteredAccounts.length === 0 && (
          <div className='rounded-3xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm col-span-full'>
            No se encontró ninguna cuenta.
          </div>
        )}
      </div>

      {accountDetailsOpen && selectedAccount && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Movimientos de la cuenta</p>
                <h2 className='text-2xl font-semibold text-slate-900'>{selectedAccount.accountNumber}</h2>
              </div>
              <button
                onClick={() => setAccountDetailsOpen(false)}
                className='rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100'
              >
                Cerrar
              </button>
            </div>
            <div className='mt-6 space-y-4'>
              <div className='rounded-3xl border border-gray-200 bg-slate-50 p-4'>
                <p className='text-sm text-gray-500'>Saldo actual</p>
                <p className='text-lg font-semibold text-slate-900'>{formatMoney(selectedAccount.balance)}</p>
              </div>
              <div className='rounded-3xl border border-gray-200 bg-white p-4'>
                <p className='mb-4 text-sm font-medium text-slate-900'>Movimientos</p>
                {accountMovements.length === 0 ? (
                  <p className='text-sm text-gray-500'>No se encontraron movimientos de depósito o retiro para esta cuenta.</p>
                ) : (
                  <div className='space-y-3'>
                    {accountMovements.map((transaction) => (
                      <div key={transaction._id ?? `${transaction.createdAt}-${transaction.amount}`} className='rounded-3xl border border-slate-200 bg-slate-50 p-4'>
                        <div className='flex flex-wrap items-center justify-between gap-3'>
                          <span className='text-sm font-semibold text-slate-900'>{transaction.type ?? 'Movimiento'}</span>
                          <span className='text-sm text-gray-500'>{formatDateTime(transaction.createdAt)}</span>
                        </div>
                        <p className='mt-2 text-sm text-gray-600'>Monto: {formatMoney(transaction.amount)}</p>
                        <p className='text-sm text-gray-600'>Origen: {transaction.originAccount?.accountNumber ?? 'N/A'}</p>
                        <p className='text-sm text-gray-600'>Destino: {transaction.destinationAccount?.accountNumber ?? 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Formulario</p>
                <h2 className='text-2xl font-semibold text-slate-900'>
                  Nueva cuenta bancaria
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className='rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100'
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={handleSubmit} className='mt-6 grid gap-4 sm:grid-cols-2'>
              <label className='block'>
                <span className='text-sm font-medium text-slate-700'>Tipo de cuenta</span>
                <select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                  className='mt-2 w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                >
                  <option value='ahorro'>Ahorro</option>
                  <option value='monetaria'>Monetaria</option>
                  <option value='corriente'>Corriente</option>
                </select>
              </label>
              <label className='block'>
                <span className='text-sm font-medium text-slate-700'>Saldo inicial</span>
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  value={form.initialBalance}
                  onChange={(event) => setForm({ ...form, initialBalance: event.target.value })}
                  className='mt-2 w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                />
              </label>
              <div className='sm:col-span-2 flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setModalOpen(false)}
                  className='rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100'
                >
                  Cancelar
                </button>
                <button type='submit' className='rounded-full bg-main-blue px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90'>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {actionModalOpen && activeAccount && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-gray-500'>{actionType === 'deposit' ? 'Depósito' : 'Retiro'}</p>
                <h2 className='text-2xl font-semibold text-slate-900'>{activeAccount.accountNumber}</h2>
              </div>
              <button
                onClick={() => setActionModalOpen(false)}
                className='rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100'
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={handleActionSubmit} className='mt-6 grid gap-4'>
              <label className='block'>
                <span className='text-sm font-medium text-slate-700'>Monto</span>
                <input
                  type='number'
                  min='0.01'
                  step='0.01'
                  value={form.initialBalance}
                  onChange={(event) => setForm({ ...form, initialBalance: event.target.value })}
                  className='mt-2 w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                />
              </label>
              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setActionModalOpen(false)}
                  className='rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100'
                >
                  Cancelar
                </button>
                <button type='submit' className='rounded-full bg-main-blue px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90'>
                  {actionType === 'deposit' ? 'Depositar' : 'Retirar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};