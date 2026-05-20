import { useEffect, useMemo, useState } from 'react';
import { getAccounts, getAccountByNumber, getTransactions, transferMoney } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { useAuthStore } from '../features/auth/store/authStore.js';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatDateTime, formatMoney } from '../shared/utils/banking.js';

const emptyTransfer = {
  fromAccountNumber: '',
  toAccountNumber: '',
  amount: '',
  description: '',
};

export const Transfers = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyTransfer);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const currentUser = useAuthStore((state) => state.user);

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
    // Prefill origin account with the logged in user's account when available
    const myAccount = accounts.find((acc) => acc.userId === currentUser?.id);
    setForm({ ...emptyTransfer, fromAccountNumber: myAccount?.accountNumber || '' });
    setTransferModalOpen(true);
  };

  const validateTransfer = () => {
    const errors = {};

    // Validar cuenta origen
    if (!form.fromAccountNumber || form.fromAccountNumber.trim() === '') {
      errors.fromAccountNumber = 'La cuenta de origen es requerida';
    }

    // Validar cuenta destino
    if (!form.toAccountNumber || form.toAccountNumber.trim() === '') {
      errors.toAccountNumber = 'La cuenta de destino es requerida';
    }

    // Validar que no sea la misma cuenta
    if (form.fromAccountNumber && form.toAccountNumber && form.fromAccountNumber.trim() === form.toAccountNumber.trim()) {
      errors.toAccountNumber = 'No puedes transferir hacia la misma cuenta';
    }

    // Validar que la cuenta de origen exista en las cuentas del usuario
    const fromAccountExists = accounts.some((acc) => acc.accountNumber === form.fromAccountNumber);

    if (form.fromAccountNumber && !fromAccountExists) {
      errors.fromAccountNumber = 'La cuenta de origen no existe';
    }

    // Para usuarios no administradores, forzar que la cuenta origen sea la de la sesión activa
    if (!isAdmin) {
      const myAccount = accounts.find((acc) => acc.userId === currentUser?.id);
      if (myAccount && form.fromAccountNumber !== myAccount.accountNumber) {
        errors.fromAccountNumber = 'La cuenta de origen debe ser tu cuenta activa';
      }
    }

    // Validar monto
    if (!form.amount || form.amount === '') {
      errors.amount = 'El monto es requerido';
    } else if (Number(form.amount) <= 0) {
      errors.amount = 'El monto debe ser mayor a 0';
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.amount)) {
      errors.amount = 'El monto tiene un formato inválido';
    }

    // Validar que la cuenta origen tenga saldo suficiente
    if (fromAccountExists) {
      const fromAccount = accounts.find((acc) => acc.accountNumber === form.fromAccountNumber);
      if (fromAccount && Number(form.amount) > fromAccount.balance) {
        errors.amount = `Saldo insuficiente. Tu saldo es de ${fromAccount.balance}`;
      }
    }

    // Validar descripción (opcional pero si la incluye, máximo 200 caracteres)
    if (form.description && form.description.length > 200) {
      errors.description = 'La descripción no puede exceder 200 caracteres';
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const errors = validateTransfer();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const fromAccount = accounts.find((acc) => acc.accountNumber === form.fromAccountNumber);
      if (!fromAccount) {
        setValidationErrors({ fromAccountNumber: 'La cuenta de origen no existe' });
        return;
      }

      const toAccounts = await getAccountByNumber(form.toAccountNumber);
      const toAccount = Array.isArray(toAccounts) ? toAccounts[0] : null;
      if (!toAccount) {
        setValidationErrors({ toAccountNumber: 'La cuenta de destino no existe' });
        return;
      }

      await transferMoney({
        fromAccountId: fromAccount._id,
        toAccountId: toAccount._id,
        amount: Number(form.amount),
        description: form.description || '',
      });
      showSuccess('Transferencia realizada exitosamente');
      setTransferModalOpen(false);
      setForm(emptyTransfer);
      setValidationErrors({});
      loadData();
    } catch (error) {
      const responseMessage = error?.response?.data?.error || error?.response?.data?.message;
      showError(responseMessage || 'No se pudo realizar la transferencia');
    }
  };

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
                <span className='text-sm font-medium text-slate-700'>
                  Cuenta origen <span className='text-red-500'>*</span>
                </span>
                <input
                  type='text'
                  placeholder='Tu número de cuenta'
                  value={form.fromAccountNumber}
                  readOnly={!isAdmin}
                  disabled={!isAdmin}
                  onChange={(event) => {
                    if (!isAdmin) return;
                    setForm({ ...form, fromAccountNumber: event.target.value });
                    setValidationErrors({ ...validationErrors, fromAccountNumber: '' });
                  }}
                  className={`mt-2 w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 bg-slate-50 focus:border-main-blue focus:outline-none ${
                    validationErrors.fromAccountNumber ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {validationErrors.fromAccountNumber && (
                  <p className='mt-1 text-xs text-red-500'>{validationErrors.fromAccountNumber}</p>
                )}
              </label>
              <label className='block'>
                <span className='text-sm font-medium text-slate-700'>
                  Cuenta destino <span className='text-red-500'>*</span>
                </span>
                <input
                  type='text'
                  placeholder='Número de cuenta destino'
                  value={form.toAccountNumber}
                  onChange={(event) => {
                    setForm({ ...form, toAccountNumber: event.target.value });
                    setValidationErrors({ ...validationErrors, toAccountNumber: '' });
                  }}
                  className={`mt-2 w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 bg-slate-50 focus:border-main-blue focus:outline-none ${
                    validationErrors.toAccountNumber ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {validationErrors.toAccountNumber && (
                  <p className='mt-1 text-xs text-red-500'>{validationErrors.toAccountNumber}</p>
                )}
              </label>
              <label className='block sm:col-span-2'>
                <span className='text-sm font-medium text-slate-700'>
                  Monto <span className='text-red-500'>*</span>
                </span>
                <input
                  type='number'
                  step='0.01'
                  min='0.01'
                  placeholder='0.00'
                  value={form.amount}
                  onChange={(event) => {
                    setForm({ ...form, amount: event.target.value });
                    setValidationErrors({ ...validationErrors, amount: '' });
                  }}
                  className={`mt-2 w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 bg-slate-50 focus:border-main-blue focus:outline-none ${
                    validationErrors.amount ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {validationErrors.amount && (
                  <p className='mt-1 text-xs text-red-500'>{validationErrors.amount}</p>
                )}
              </label>
              <label className='block sm:col-span-2'>
                <span className='text-sm font-medium text-slate-700'>
                  Descripción <span className='text-gray-400'>(opcional)</span>
                </span>
                <textarea
                  placeholder='Describe el motivo de la transferencia'
                  value={form.description}
                  onChange={(event) => {
                    setForm({ ...form, description: event.target.value });
                    setValidationErrors({ ...validationErrors, description: '' });
                  }}
                  maxLength={200}
                  rows={3}
                  className={`mt-2 w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 bg-slate-50 focus:border-main-blue focus:outline-none resize-none ${
                    validationErrors.description ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                <p className='mt-1 text-xs text-gray-400'>
                  {form.description.length}/200
                </p>
                {validationErrors.description && (
                  <p className='mt-1 text-xs text-red-500'>{validationErrors.description}</p>
                )}
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
