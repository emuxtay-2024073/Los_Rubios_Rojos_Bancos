import { useEffect, useState } from 'react';
import { depositToAccount, withdrawFromAccount, getAccounts, getAccountHistory, getExchangeRate } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { useAuthStore } from '../features/auth/store/authStore.js';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatMoney, formatDateTime } from '../shared/utils/banking.js';

export const Deposits = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('GTQ');
  const [description, setDescription] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filters, setFilters] = useState({ type: 'ALL', direction: 'ALL', search: '' });
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      const accountList = Array.isArray(data) ? data : [];
      setAccounts(accountList);
      if (!isAdmin && accountList.length > 0) {
        setSelectedAccount((current) => current || accountList[0]);
      }
    } catch (err) {
      showError('No se pudieron cargar las cuentas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadHistory = async (accountId) => {
    try {
      setHistoryLoading(true);
      const params = {};
      if (filters.type && filters.type !== 'ALL') params.type = filters.type;
      if (filters.direction && filters.direction !== 'ALL') params.direction = filters.direction;
      if (filters.search) params.search = filters.search;
      const data = await getAccountHistory(accountId, params);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      showError('No se pudo cargar el historial');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccount) loadHistory(selectedAccount._id);
  }, [selectedAccount]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return showError('Selecciona una cuenta');
    if (!amount || Number(amount) <= 0) return showError('Monto inválido');
    try {
      await depositToAccount({ accountId: selectedAccount._id, amount: Number(amount), currency, description });
      showSuccess('Depósito realizado');
      setAmount('');
      setDescription('');
      loadAccounts();
      loadHistory(selectedAccount._id);
    } catch (err) {
      showError(err?.response?.data?.message || 'Error en depósito');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return showError('Selecciona una cuenta');
    if (!amount || Number(amount) <= 0) return showError('Monto inválido');
    try {
      await withdrawFromAccount({ accountId: selectedAccount._id, amount: Number(amount), currency, description });
      showSuccess('Retiro realizado');
      setAmount('');
      setDescription('');
      loadAccounts();
      loadHistory(selectedAccount._id);
    } catch (err) {
      showError(err?.response?.data?.message || 'Error en retiro');
    }
  };

  const showAccountSelector = isAdmin || accounts.length > 1;

  if (loading) return <Spinner />;

  return (
    <div className='space-y-8'>
      <div>
        <p className='text-sm text-gray-500'>Operaciones de efectivo</p>
        <h1 className='text-3xl font-bold text-main-blue'>Retiros y depósitos</h1>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <p className='text-sm text-gray-500'>Cuenta</p>
          <div className='mt-3'>
            {showAccountSelector ? (
              <select
                value={selectedAccount?._id ?? ''}
                onChange={(e) => {
                  const acc = accounts.find((a) => a._id === e.target.value);
                  setSelectedAccount(acc || null);
                }}
                className='w-full rounded-2xl border px-3 py-2'
              >
                <option value=''>Selecciona cuenta</option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountNumber} - {acc.type} - {formatMoney(acc.balance)}
                  </option>
                ))}
              </select>
            ) : (
              <div className='rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3'>
                <p className='text-sm text-gray-500'>Cuenta asignada</p>
                <p className='mt-2 font-semibold'>{selectedAccount?.accountNumber ?? 'Sin cuenta disponible'}</p>
                <p className='mt-1 text-sm text-gray-500'>{selectedAccount?.type ?? '-'}</p>
              </div>
            )}
          </div>

          {selectedAccount && (
            <div className='mt-4'>
              <p className='text-sm text-gray-500'>Saldo actual</p>
              <p className='text-xl font-semibold'>{formatMoney(selectedAccount.balance)}</p>
              <p className='mt-2 text-sm text-gray-500'>Moneda: {selectedAccount.currency || 'GTQ'}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleDeposit} className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-3'>
          <p className='text-sm text-gray-500'>Depósito</p>
          <div>
            <input type='number' placeholder='Monto' value={amount} onChange={(e) => setAmount(e.target.value)} className='w-full rounded-2xl border px-3 py-2' />
          </div>
          <div>
            <input type='text' placeholder='Moneda (ej: GTQ, USD)' value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className='w-full rounded-2xl border px-3 py-2' />
          </div>
          <div>
            <input type='text' placeholder='Descripción (opcional)' value={description} onChange={(e) => setDescription(e.target.value)} className='w-full rounded-2xl border px-3 py-2' />
          </div>
          <div className='flex justify-end gap-3'>
            <button type='submit' className='rounded-full bg-emerald-600 px-4 py-2 text-white'>Depositar</button>
          </div>
        </form>

        <form onSubmit={handleWithdraw} className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-3'>
          <p className='text-sm text-gray-500'>Retiro</p>
          <div>
            <input type='number' placeholder='Monto' value={amount} onChange={(e) => setAmount(e.target.value)} className='w-full rounded-2xl border px-3 py-2' />
          </div>
          <div>
            <input type='text' placeholder='Moneda (ej: GTQ, USD)' value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className='w-full rounded-2xl border px-3 py-2' />
          </div>
          <div>
            <input type='text' placeholder='Descripción (opcional)' value={description} onChange={(e) => setDescription(e.target.value)} className='w-full rounded-2xl border px-3 py-2' />
          </div>
          <div className='flex justify-end gap-3'>
            <button type='submit' className='rounded-full bg-amber-600 px-4 py-2 text-white'>Retirar</button>
          </div>
        </form>
      </div>

      <div className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <p className='text-sm text-gray-500'>Historial de depósitos y retiros</p>
          <div className='flex gap-2'>
            <select value={filters.type} onChange={(e) => setFilters((s) => ({ ...s, type: e.target.value }))} className='rounded-md border px-3 py-2'>
              <option value='ALL'>Todos</option>
              <option value='DEPOSITO'>Depósitos</option>
              <option value='RETIRO'>Retiros</option>
            </select>
            <input type='text' placeholder='Buscar descripción' value={filters.search} onChange={(e) => setFilters((s) => ({ ...s, search: e.target.value }))} className='rounded-md border px-3 py-2' />
            <button onClick={() => selectedAccount && loadHistory(selectedAccount._id)} className='rounded-full bg-main-blue px-4 py-2 text-white'>Filtrar</button>
          </div>
        </div>

        {historyLoading ? (
          <p className='text-sm text-gray-500'>Cargando historial...</p>
        ) : history.length === 0 ? (
          <p className='text-sm text-gray-500'>No ha habido movimientos en esta cuenta.</p>
        ) : (
          <div className='space-y-3'>
            {history.map((t) => (
              <div key={t._id} className='rounded-2xl bg-slate-50 p-4'>
                <div className='flex items-center justify-between'>
                  <div className='font-semibold'>{t.type}</div>
                  <div className='text-sm text-gray-500'>{formatDateTime(t.createdAt)}</div>
                </div>
                <div className='mt-2 text-sm'>Monto: {formatMoney(t.amount)}</div>
                <div className='text-sm'>Origen: {t.originAccount?.accountNumber ?? '-'}</div>
                <div className='text-sm'>Destino: {t.destinationAccount?.accountNumber ?? '-'}</div>
                <div className='text-sm'>Descripción: {t.description ?? '-'}</div>
                <div className='text-sm'>Tipo detalle: {t.type === 'DEPOSITO' ? 'Depósito propio' : t.type === 'RETIRO' ? 'Retiro' : 'Transferencia'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
