import { useEffect, useMemo, useState } from 'react';
import { cancelReversal, getReversals, requestReversal } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatDateTime, formatMoney } from '../shared/utils/banking.js';

const emptyForm = {
  transactionId: '',
  reason: '',
};

export const Reversals = () => {
  const [reversals, setReversals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getReversals();
      setReversals(Array.isArray(data) ? data : []);
    } catch {
      showError('No se pudieron cargar las reversiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredReversals = useMemo(
    () =>
      reversals.filter((item) => {
        const query = search.toLowerCase();
        return (
          String(item.status ?? '').toLowerCase().includes(query) ||
          String(item.reason ?? '').toLowerCase().includes(query) ||
          String(item.transactionId?._id ?? item.transactionId ?? '').toLowerCase().includes(query)
        );
      }),
    [reversals, search],
  );

  const pendingCount = useMemo(
    () => reversals.filter((item) => item.status === 'PENDING').length,
    [reversals],
  );

  const handleRequest = async (event) => {
    event.preventDefault();
    try {
      await requestReversal(form);
      showSuccess('Solicitud de reversión enviada');
      setForm(emptyForm);
      setModalOpen(false);
      loadData();
    } catch (error) {
      const responseData = error?.response?.data;
      const message = responseData?.waitMessage || responseData?.message || 'No se pudo crear la solicitud';
      showError(message);
    }
  };

  const handleAction = async (reversal, action) => {
    try {
      if (action === 'cancel') await cancelReversal(reversal._id);
      showSuccess('Acción aplicada correctamente');
      loadData();
    } catch (error) {
      showError(error?.response?.data?.message || 'No se pudo aplicar la acción');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:justify-between md:items-end'>
        <div>
          <p className='text-sm text-gray-500'>Solicitudes de reversión</p>
          <h1 className='text-3xl font-bold text-main-blue'>Reversiones</h1>
          <p className='mt-2 text-sm text-gray-500'>Envía solicitudes de reversión de transferencias realizadas en las últimas 24 horas.</p>
        </div>
        <button
          type='button'
          onClick={() => setModalOpen(true)}
          className='rounded-full bg-main-blue px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90'
        >
          Nueva solicitud
        </button>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <article className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <p className='text-sm text-gray-500'>Mis solicitudes</p>
          <p className='mt-2 text-3xl font-semibold text-slate-900'>{reversals.length}</p>
        </article>
        <article className='rounded-3xl border border-accent bg-surface-soft p-6 shadow-sm'>
          <p className='text-sm text-amber-700'>Pendientes</p>
          <p className='mt-2 text-3xl font-semibold text-amber-800'>{pendingCount}</p>
        </article>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <input
          type='search'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Buscar por transacción, motivo o estado'
          className='w-full max-w-lg rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-main-blue focus:outline-none'
        />
      </div>

      <div className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='min-w-full border-collapse text-left'>
            <thead className='bg-slate-50 text-sm text-slate-600'>
              <tr>
                <th className='px-5 py-4'>Transacción</th>
                <th className='px-5 py-4'>Monto</th>
                <th className='px-5 py-4'>Motivo</th>
                <th className='px-5 py-4'>Estado</th>
                <th className='px-5 py-4'>Fecha</th>
                <th className='px-5 py-4'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReversals.map((reversal) => (
                <tr key={reversal._id ?? reversal.transactionId} className='border-t border-gray-100 hover:bg-slate-50'>
                  <td className='px-5 py-4'>{String(reversal.transactionId?._id ?? reversal.transactionId ?? '').slice(-8)}</td>
                  <td className='px-5 py-4'>{formatMoney(reversal.transactionId?.amount)}</td>
                  <td className='px-5 py-4'>{reversal.reason || 'Sin motivo'}</td>
                  <td className='px-5 py-4'>
                    <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700'>
                      {reversal.status}
                    </span>
                  </td>
                  <td className='px-5 py-4'>{formatDateTime(reversal.createdAt)}</td>
                  <td className='px-5 py-4'>
                    <div className='flex flex-wrap gap-2'>
                      {reversal.status === 'PENDING' && (
                        <button
                          type='button'
                          onClick={() => handleAction(reversal, 'cancel')}
                          className='rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100'
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReversals.length === 0 && (
                <tr>
                  <td colSpan='6' className='px-5 py-8 text-center text-sm text-gray-500'>
                    No hay solicitudes de reversión.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Nueva solicitud</p>
                <h2 className='text-2xl font-semibold text-slate-900'>Solicitar reversión</h2>
              </div>
              <button
                type='button'
                onClick={() => setModalOpen(false)}
                className='rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100'
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleRequest} className='mt-6 space-y-4'>
              <label className='block'>
                <span className='text-sm font-medium text-slate-700'>ID de transacción</span>
                <input
                  type='text'
                  value={form.transactionId}
                  onChange={(event) => setForm((current) => ({ ...current, transactionId: event.target.value }))}
                  className='mt-2 w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                  required
                />
              </label>

              <label className='block'>
                <span className='text-sm font-medium text-slate-700'>Motivo</span>
                <textarea
                  value={form.reason}
                  onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                  rows='4'
                  className='mt-2 w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                  required
                />
              </label>

              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setModalOpen(false)}
                  className='rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100'
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  className='rounded-full bg-main-blue px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90'
                >
                  Enviar solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
