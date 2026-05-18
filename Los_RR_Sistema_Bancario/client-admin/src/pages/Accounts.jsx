import { useEffect, useMemo, useState } from 'react';
import { depositToAccount, getAccountHistory, getAccounts, getTransactions, withdrawFromAccount } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { useAuthStore } from '../features/auth/store/authStore.js';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatMoney, formatDateTime, toTitleCase } from '../shared/utils/banking.js';

export const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('deposit');
  const [activeAccount, setActiveAccount] = useState(null);
  const [form, setForm] = useState({ amount: '' });
  const [historyFilters, setHistoryFilters] = useState({ type: 'ALL', direction: 'ALL', minAmount: '', maxAmount: '', search: '' });

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

  const buildHistoryParams = () => {
    const params = {};
    if (historyFilters.type && historyFilters.type !== 'ALL') params.type = historyFilters.type;
    if (historyFilters.direction && historyFilters.direction !== 'ALL') params.direction = historyFilters.direction;
    if (historyFilters.minAmount) params.minAmount = historyFilters.minAmount;
    if (historyFilters.maxAmount) params.maxAmount = historyFilters.maxAmount;
    if (historyFilters.search) params.search = historyFilters.search;
    return params;
  };

  const loadAccountHistory = async (accountId) => {
    if (!accountId) return;
    try {
      setHistoryLoading(true);
      const data = await getAccountHistory(accountId, buildHistoryParams());
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      showError('No se pudo cargar el historial de la cuenta');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (!isAdmin && accounts.length > 0 && !selectedAccount) {
      const acct = accounts[0];
      setSelectedAccount(acct);
      loadAccountHistory(acct._id);
    }
  }, [accounts, isAdmin]);

  useEffect(() => {
    if (selectedAccount && !isAdmin) {
      loadAccountHistory(selectedAccount._id);
    }
  }, [selectedAccount, historyFilters, isAdmin]);

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        account.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
        account.type?.toLowerCase().includes(search.toLowerCase()) ||
        String(account.balance ?? '').includes(search),
      ),
    [accounts, search],
  );

  const handleOpenAccountDetails = (account) => {
    setSelectedAccount(account);
    setAccountDetailsOpen(true);
    loadAccountHistory(account._id);
  };

  const openActionModal = (account, type) => {
    setActiveAccount(account);
    setActionType(type);
    setForm({ amount: '' });
    setActionModalOpen(true);
  };

  const handleActionSubmit = async (event) => {
    event.preventDefault();
    if (!activeAccount) return showError('Seleccione una cuenta');

    try {
      const payload = {
        accountId: activeAccount._id,
        amount: Number(form.amount) || 0,
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
      if (activeAccount?._id) loadAccountHistory(activeAccount._id);
    } catch (error) {
      showError(error?.response?.data?.message || 'No se pudo procesar la operación');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:justify-between md:items-end'>
        <div>
          <p className='text-sm text-gray-500'>{isAdmin ? 'Gestión de cuentas' : 'Resumen de tu cuenta'}</p>
          <h1 className='text-3xl font-bold text-main-blue'>{isAdmin ? 'Cuentas' : 'Cuenta'}</h1>
          {isAdmin ? (
            <p className='mt-2 text-sm text-gray-500'>Vista de sólo lectura para administradores. Aquí puedes ver datos y filtrar cuentas.</p>
          ) : (
            <p className='mt-2 text-sm text-gray-500'>Aquí puedes ver tu cuenta, saldo e historial.</p>
          )}
        </div>
      </div>

      {isAdmin ? (
        <>
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
                className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm cursor-pointer hover:border-main-blue hover:shadow-md'
                onClick={() => handleOpenAccountDetails(account)}
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
                <p className='mt-5 text-sm font-medium text-main-blue'>Toca para ver movimientos</p>
              </article>
            ))}
            {filteredAccounts.length === 0 && (
              <div className='rounded-3xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm col-span-full'>
                No se encontró ninguna cuenta.
              </div>
            )}
          </div>
        </>
      ) : selectedAccount ? (
        <>
          <div className='rounded-3xl border border-gray-200 bg-white p-8 shadow-sm'>
            <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Tu cuenta</p>
                <h2 className='text-4xl font-semibold text-slate-900'>{selectedAccount.accountNumber}</h2>
                <p className='mt-3 text-base uppercase tracking-[0.16em] text-main-blue'>{toTitleCase(selectedAccount.type)}</p>
              </div>
              <div className='rounded-3xl bg-slate-50 p-6 text-center'>
                <p className='text-sm text-gray-500'>Saldo disponible</p>
                <p className='mt-3 text-5xl font-bold text-slate-900'>{formatMoney(selectedAccount.balance)}</p>
                <p className='mt-1 text-sm text-gray-500'>{selectedAccount.currency || 'GTQ'}</p>
              </div>
            </div>

            <div className='mt-8 grid gap-4 sm:grid-cols-2'>
              <div className='rounded-3xl border border-gray-100 bg-slate-50 p-5'>
                <p className='text-sm text-gray-500'>Creada</p>
                <p className='mt-2 text-lg font-semibold text-slate-900'>{formatDateTime(selectedAccount.createdAt)}</p>
              </div>
              <div className='rounded-3xl border border-gray-100 bg-slate-50 p-5'>
                <p className='text-sm text-gray-500'>Estado</p>
                <p className='mt-2 text-lg font-semibold text-slate-900'>{selectedAccount.isActive ? 'Activa' : 'Suspendida'}</p>
              </div>
            </div>

          </div>

          <div className='mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Movimientos de la cuenta</p>
                <h2 className='text-xl font-semibold text-slate-900'>{selectedAccount.accountNumber}</h2>
              </div>
            </div>

            <div className='mt-6 space-y-4'>
              <div className='rounded-3xl border border-gray-200 bg-slate-50 p-4'>
                <p className='text-sm text-gray-500'>Saldo actual</p>
                <p className='text-lg font-semibold text-slate-900'>{formatMoney(selectedAccount.balance)}</p>
              </div>

              <div className='rounded-3xl border border-gray-200 bg-white p-4'>
                <p className='mb-4 text-sm font-medium text-slate-900'>Movimientos</p>

                {historyLoading ? (
                  <p className='text-sm text-gray-500'>Cargando movimientos...</p>
                ) : history.length === 0 ? (
                  <p className='text-sm text-gray-500'>No ha habido movimientos en esta cuenta.</p>
                ) : (
                  <div className='space-y-3'>
                    {history.map((transaction) => (
                      <div key={transaction._id ?? `${transaction.createdAt}-${transaction.amount}`} className='rounded-3xl border border-slate-200 bg-slate-50 p-4'>
                        <div className='flex flex-wrap items-center justify-between gap-3'>
                          <span className='text-sm font-semibold text-slate-900'>{transaction.type ?? 'Movimiento'}</span>
                          <span className='text-sm text-gray-500'>{formatDateTime(transaction.createdAt)}</span>
                        </div>
                        <p className='mt-2 text-sm text-gray-600'>Monto: {formatMoney(transaction.amount)}</p>
                        <p className='text-sm text-gray-600'>Origen: {transaction.originAccount?.accountNumber ?? 'N/A'}</p>
                        <p className='text-sm text-gray-600'>Destino: {transaction.destinationAccount?.accountNumber ?? 'N/A'}</p>
                        <p className='text-sm text-gray-600'>Descripción: {transaction.description ?? '-'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className='rounded-3xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm'>
          No se encontró ninguna cuenta.
        </div>
      )}

      {accountDetailsOpen && selectedAccount && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Movimientos de la cuenta</p>
                <h2 className='text-2xl font-semibold text-slate-900'>{selectedAccount.accountNumber}</h2>
              </div>
              <button
                type='button'
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
                <div className='space-y-3'>
                  {historyLoading ? (
                    <p className='text-sm text-gray-500'>Cargando movimientos...</p>
                  ) : history.length === 0 ? (
                    <p className='text-sm text-gray-500'>No ha habido movimientos en esta cuenta.</p>
                  ) : (
                    history.map((transaction) => (
                      <div key={transaction._id ?? `${transaction.createdAt}-${transaction.amount}`} className='rounded-3xl border border-slate-200 bg-slate-50 p-4'>
                        <div className='flex flex-wrap items-center justify-between gap-3'>
                          <span className='text-sm font-semibold text-slate-900'>{transaction.type ?? 'Movimiento'}</span>
                          <span className='text-sm text-gray-500'>{formatDateTime(transaction.createdAt)}</span>
                        </div>
                        <p className='mt-2 text-sm text-gray-600'>Monto: {formatMoney(transaction.amount)}</p>
                        <p className='text-sm text-gray-600'>Origen: {transaction.originAccount?.accountNumber ?? 'N/A'}</p>
                        <p className='text-sm text-gray-600'>Destino: {transaction.destinationAccount?.accountNumber ?? 'N/A'}</p>
                        <p className='text-sm text-gray-600'>Descripción: {transaction.description ?? '-'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
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
                type='button'
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
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
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
