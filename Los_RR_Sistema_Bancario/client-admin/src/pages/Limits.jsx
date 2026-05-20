import { useEffect, useMemo, useState } from 'react';
import { createDefaultLimit, createUserLimit, deleteLimit, getAllLimits, getCurrentLimits, getUsers } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatMoney, formatDateTime, toTitleCase } from '../shared/utils/banking.js';

const emptyLimit = {
  targetUserId: '',
  accountType: '',
  transactionType: '',
  maxPerTransaction: '',
  maxDailyTotal: '',
  maxMonthlyTotal: '',
  maxDailyCount: '',
};

const accountTypes = ['ahorro', 'monetaria', 'corriente'];
const transactionTypes = ['DEPOSITO', 'RETIRO', 'TRANSFERENCIA'];

export const Limits = () => {
  const [limits, setLimits] = useState([]);
  const [currentLimits, setCurrentLimits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAccountNumber, setFilterAccountNumber] = useState('');
  const [filterAccountType, setFilterAccountType] = useState('');
  const [filterTransactionType, setFilterTransactionType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('default');
  const [form, setForm] = useState(emptyLimit);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allLimitsData, currentLimitsData, usersData] = await Promise.all([
        getAllLimits(),
        getCurrentLimits(),
        getUsers(),
      ]);
      setLimits(Array.isArray(allLimitsData) ? allLimitsData : []);
      setCurrentLimits(Array.isArray(currentLimitsData) ? currentLimitsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch {
      showError('No se pudieron cargar los límites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLimits = useMemo(
    () =>
      limits.filter((limit) => {
        const query = search.toLowerCase();
        const matchesSearch =
          String(limit.accountNumber ?? limit.userId ?? '').toLowerCase().includes(query) ||
          String(limit.accountType ?? '').toLowerCase().includes(query) ||
          String(limit.transactionType ?? '').toLowerCase().includes(query);

        const matchesAccountNumber =
          !filterAccountNumber ||
          String(limit.accountNumber ?? limit.userId ?? '').toLowerCase().includes(filterAccountNumber.toLowerCase());

        const matchesAccountType =
          !filterAccountType || limit.accountType === filterAccountType;

        const matchesTransactionType =
          !filterTransactionType || limit.transactionType === filterTransactionType;

        return matchesSearch && matchesAccountNumber && matchesAccountType && matchesTransactionType;
      }),
    [limits, search, filterAccountNumber, filterAccountType, filterTransactionType],
  );

  const openModal = (nextMode) => {
    setMode(nextMode);
    setForm(emptyLimit);
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        accountType: form.accountType || null,
        transactionType: form.transactionType || null,
        maxPerTransaction: Number(form.maxPerTransaction) || 0,
        maxDailyTotal: Number(form.maxDailyTotal) || 0,
        maxMonthlyTotal: Number(form.maxMonthlyTotal) || 0,
        maxDailyCount: Number(form.maxDailyCount) || 0,
      };

      if (mode === 'user') {
        await createUserLimit({ ...payload, targetUserId: form.targetUserId });
        showSuccess('Límite de usuario guardado');
      } else {
        await createDefaultLimit(payload);
        showSuccess('Límite por defecto guardado');
      }

      setModalOpen(false);
      loadData();
    } catch (error) {
      showError(error?.response?.data?.message || 'No se pudo guardar el límite');
    }
  };

  const handleDelete = async (limit) => {
    const confirmed = window.confirm('¿Eliminar este límite?');
    if (!confirmed) return;

    try {
      await deleteLimit(limit._id);
      showSuccess('Límite eliminado');
      loadData();
    } catch {
      showError('No se pudo eliminar el límite');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:justify-between md:items-end'>
        <div>
          <p className='text-sm text-gray-500'>Control operativo</p>
          <h1 className='text-3xl font-bold text-main-blue'>Límites</h1>
        </div>
        <div className='flex flex-wrap gap-3'>
          <button
            type='button'
            onClick={() => openModal('default')}
            className='rounded-full bg-main-blue px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90'
          >
            + Límite por defecto
          </button>
          <button
            type='button'
            onClick={() => openModal('user')}
            className='rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90'
          >
            + Límite por usuario
          </button>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <article className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <p className='text-sm text-gray-500'>Límites totales</p>
          <p className='mt-2 text-3xl font-semibold text-slate-900'>{limits.length}</p>
        </article>
        <article className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <p className='text-sm text-gray-500'>Límites vigentes</p>
          <p className='mt-2 text-3xl font-semibold text-slate-900'>{currentLimits.length}</p>
        </article>
      </div>

      <div className='grid gap-4 lg:grid-cols-4'>
        <input
          type='search'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Buscar por cuenta, tipo o transacción'
          className='w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-main-blue focus:outline-none'
        />
        <input
          type='text'
          value={filterAccountNumber}
          onChange={(event) => setFilterAccountNumber(event.target.value)}
          placeholder='Filtrar por número de cuenta'
          className='w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-main-blue focus:outline-none'
        />
        <select
          value={filterAccountType}
          onChange={(event) => setFilterAccountType(event.target.value)}
          className='w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-main-blue focus:outline-none'
        >
          <option value=''>Todas las cuentas</option>
          {accountTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          value={filterTransactionType}
          onChange={(event) => setFilterTransactionType(event.target.value)}
          className='w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-main-blue focus:outline-none'
        >
          <option value=''>Todas las transacciones</option>
          {transactionTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='min-w-full border-collapse text-left'>
            <thead className='bg-slate-50 text-sm text-slate-600'>
              <tr>
                <th className='px-5 py-4'>Cuenta</th>
                <th className='px-5 py-4'>Tipo cuenta</th>
                <th className='px-5 py-4'>Transacción</th>
                <th className='px-5 py-4'>Límites</th>
                <th className='px-5 py-4'>Creado</th>
                <th className='px-5 py-4'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredLimits.map((limit) => (
                <tr key={limit._id ?? `${limit.accountType}-${limit.transactionType}`} className='border-t border-gray-100 hover:bg-slate-50'>
                  <td className='px-5 py-4'>{limit.accountNumber ?? 'General'}</td>
                  <td className='px-5 py-4'>{limit.accountType || 'General'}</td>
                  <td className='px-5 py-4'>{limit.transactionType || 'General'}</td>
                  <td className='px-5 py-4'>
                    <div className='text-sm text-slate-700'>
                      <p>{formatMoney(limit.maxPerTransaction)} por operación</p>
                      <p>{formatMoney(limit.maxDailyTotal)} diario</p>
                      <p>{formatMoney(limit.maxMonthlyTotal)} mensual</p>
                      <p>{limit.maxDailyCount} movimientos diarios</p>
                    </div>
                  </td>
                  <td className='px-5 py-4'>{formatDateTime(limit.createdAt)}</td>
                  <td className='px-5 py-4'>
                    <button
                      type='button'
                      onClick={() => handleDelete(limit)}
                      className='rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90'
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLimits.length === 0 && (
                <tr>
                  <td colSpan='6' className='px-5 py-8 text-center text-sm text-gray-500'>
                    No hay límites registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Configuración de límites</p>
                <h2 className='text-2xl font-semibold text-slate-900'>
                  {mode === 'user' ? 'Límite por usuario' : 'Límite por defecto'}
                </h2>
              </div>
              <button
                type='button'
                onClick={() => setModalOpen(false)}
                className='rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100'
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={handleSubmit} className='mt-6 grid gap-4 sm:grid-cols-2'>
              {mode === 'user' && (
                <label className='block sm:col-span-2'>
                  <span className='text-sm font-medium text-slate-700'>Usuario</span>
                  <select
                    value={form.targetUserId}
                    onChange={(event) => setForm({ ...form, targetUserId: event.target.value })}
                    className='mt-2 w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                  >
                    <option value=''>Seleccionar</option>
                    {users.map((user) => (
                      <option key={user._id ?? user.email} value={user._id}>
                        {user.username} · {user.email}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className='block'>
                <span className='text-sm font-medium text-slate-700'>Tipo de cuenta</span>
                <select
                  value={form.accountType}
                  onChange={(event) => setForm({ ...form, accountType: event.target.value })}
                  className='mt-2 w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                >
                  <option value=''>General</option>
                  {accountTypes.map((type) => (
                    <option key={type} value={type}>
                      {toTitleCase(type)}
                    </option>
                  ))}
                </select>
              </label>
              <label className='block'>
                <span className='text-sm font-medium text-slate-700'>Tipo de transacción</span>
                <select
                  value={form.transactionType}
                  onChange={(event) => setForm({ ...form, transactionType: event.target.value })}
                  className='mt-2 w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                >
                  <option value=''>General</option>
                  {transactionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              {['maxPerTransaction', 'maxDailyTotal', 'maxMonthlyTotal', 'maxDailyCount'].map((key) => (
                <label key={key} className='block'>
                  <span className='text-sm font-medium text-slate-700'>
                    {key === 'maxDailyCount' ? 'Máx. movimientos diarios' : key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <input
                    type='number'
                    min='0'
                    step={key === 'maxDailyCount' ? '1' : '0.01'}
                    value={form[key]}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    className='mt-2 w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                  />
                </label>
              ))}
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
    </div>
  );
};
