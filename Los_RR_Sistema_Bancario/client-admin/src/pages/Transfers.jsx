import { useEffect, useMemo, useState } from 'react';
import { getAccounts, getTransactions, transferMoney } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { useAuthStore } from '../features/auth/store/authStore.js';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatDateTime, formatMoney } from '../shared/utils/banking.js';

const emptyTransfer = {
  fromAccountId: '',
  toAccountId: '',
  amount: '',
};

export const Transfers = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyTransfer);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, transactionsData] = await Promise.all([getAccounts(), getTransactions()]);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch {
      showError('No se pudieron cargar las transferencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const transferTransactions = useMemo(
    () =>
      transactions.filter((transaction) => transaction.type === 'TRANSFERENCIA'),
    [transactions],
  );

  const filteredTransactions = useMemo(
    () =>
      transferTransactions.filter((transaction) =>
        transaction.type?.toLowerCase().includes(search.toLowerCase()) ||
        transaction.originAccount?.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
        transaction.destinationAccount?.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
        String(transaction.amount ?? '').includes(search),
      ),
    [search, transferTransactions],
  );

  const openTransferForm = () => {
    setForm(emptyTransfer);
    setTransferModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await transferMoney({
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount: Number(form.amount) || 0,
      });
      showSuccess('Transferencia realizada');
      setTransferModalOpen(false);
      loadData();
    } catch (error) {
      showError(error?.response?.data?.message || 'No se pudo realizar la transferencia');
    }
  };

  const accountsOptions = accounts.map((account) => ({
    value: account._id,
    label: `${account.accountNumber} · ${account.type}`,
  }));

  if (loading) return <Spinner />;

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:justify-between md:items-end'>
        <div>
          <p className='text-sm text-gray-500'>Movimientos entre cuentas</p>
          <h1 className='text-3xl font-bold text-main-blue'>Transferencias</h1>
          {isAdmin && (
            <p className='mt-2 text-sm text-gray-500'>Vista de sólo lectura para administradores. Puedes filtrar y revisar transferencias, pero no crear nuevas desde aquí.</p>
          )}
        </div>
        {!isAdmin && (
          <button
            type='button'
            onClick={openTransferForm}
            className='rounded-full bg-main-blue px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90'
          >
            + Nueva transferencia
          </button>
        )}
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <article className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <p className='text-sm text-gray-500'>Transferencias totales</p>
          <p className='mt-2 text-3xl font-semibold text-slate-900'>{transferTransactions.length}</p>
        </article>
        <article className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <p className='text-sm text-gray-500'>Cuentas disponibles</p>
          <p className='mt-2 text-3xl font-semibold text-slate-900'>{accounts.length}</p>
        </article>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <input
          type='search'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Buscar por cuenta, tipo o monto'
          className='w-full max-w-lg rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-main-blue focus:outline-none'
        />
      </div>

      <div className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='min-w-full border-collapse text-left'>
            <thead className='bg-slate-50 text-sm text-slate-600'>
              <tr>
                <th className='px-5 py-4'>Tipo</th>
                <th className='px-5 py-4'>Origen</th>
                <th className='px-5 py-4'>Destino</th>
                <th className='px-5 py-4'>Monto</th>
                <th className='px-5 py-4'>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction._id ?? `${transaction.date}-${transaction.amount}`} className='border-t border-gray-100 hover:bg-slate-50'>
                  <td className='px-5 py-4'>{transaction.type}</td>
                  <td className='px-5 py-4'>{transaction.originAccount?.accountNumber ?? '—'}</td>
                  <td className='px-5 py-4'>{transaction.destinationAccount?.accountNumber ?? '—'}</td>
                  <td className='px-5 py-4'>{formatMoney(transaction.amount)}</td>
                  <td className='px-5 py-4'>{formatDateTime(transaction.date)}</td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan='5' className='px-5 py-8 text-center text-sm text-gray-500'>
                    No hay transferencias registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {transferModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Formulario de transferencia</p>
                <h2 className='text-2xl font-semibold text-slate-900'>Nueva transferencia</h2>
              </div>
              <button
                type='button'
                onClick={() => setTransferModalOpen(false)}
                className='rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100'
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={handleSubmit} className='mt-6 grid gap-4 sm:grid-cols-2'>
              <label className='block'>
                <span className='text-sm font-medium text-slate-700'>Cuenta origen</span>
                <select
                  value={form.fromAccountId}
                  onChange={(event) => setForm({ ...form, fromAccountId: event.target.value })}
                  className='mt-2 w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                >
                  <option value=''>Seleccionar</option>
                  {accountsOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className='block'>
                <span className='text-sm font-medium text-slate-700'>Cuenta destino</span>
                <select
                  value={form.toAccountId}
                  onChange={(event) => setForm({ ...form, toAccountId: event.target.value })}
                  className='mt-2 w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                >
                  <option value=''>Seleccionar</option>
                  {accountsOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className='block sm:col-span-2'>
                <span className='text-sm font-medium text-slate-700'>Monto</span>
                <input
                  type='number'
                  step='0.01'
                  min='0.01'
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  className='mt-2 w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                />
              </label>
              <div className='sm:col-span-2 flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setTransferModalOpen(false)}
                  className='rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100'
                >
                  Cancelar
                </button>
                <button type='submit' className='rounded-full bg-main-blue px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90'>
                  Transferir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
