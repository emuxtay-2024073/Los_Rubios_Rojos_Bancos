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
          <p className='text-sm text-[#64748B]'>Solicitudes de reversión</p>
          <h1 className='text-3xl font-bold text-[#2563EB]'>Reversiones</h1>
          <p className='mt-2 text-sm text-[#64748B]'>Envía solicitudes de reversión de transferencias realizadas en las últimas 24 horas.</p>
        </div>
        <button
          type='button'
          onClick={() => setModalOpen(true)}
          className='rounded-full bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90'
        >
          Nueva solicitud
        </button>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <article className='rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm'>
          <p className='text-sm text-[#64748B]'>Mis solicitudes</p>
          <p className='mt-2 text-3xl font-semibold text-[#1E293B]'>{reversals.length}</p>
        </article>
        <article className='rounded-3xl border border-[#06B6D4] bg-[rgba(6,182,212,0.08)] p-6 shadow-sm'>
          <p className='text-sm text-[#F59E0B]'>Pendientes</p>
          <p className='mt-2 text-3xl font-semibold text-[#B45309]'>{pendingCount}</p>
        </article>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <input
          type='search'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Buscar por transacción, motivo o estado'
          className='w-full max-w-lg rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#1E293B] shadow-sm focus:border-[#2563EB] focus:outline-none'
        />
      </div>

      <div className='rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='min-w-full border-collapse text-left'>
            <thead className='bg-[#0F172A] text-sm text-white'>
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
                <tr key={reversal._id ?? reversal.transactionId} className='border-t border-[rgba(226,232,240,0.6)] hover:bg-[rgba(37,99,235,0.04)]'>
                  <td className='px-5 py-4 text-[#1E293B]'>{String(reversal.transactionId?._id ?? reversal.transactionId ?? '').slice(-8)}</td>
                  <td className='px-5 py-4 text-[#1E293B]'>{formatMoney(reversal.transactionId?.amount)}</td>
                  <td className='px-5 py-4 text-[#1E293B]'>{reversal.reason || 'Sin motivo'}</td>
                  <td className='px-5 py-4'>
                    <span className='rounded-full bg-[rgba(226,232,240,0.5)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1E293B]'>
                      {reversal.status}
                    </span>
                  </td>
                  <td className='px-5 py-4 text-[#64748B]'>{formatDateTime(reversal.createdAt)}</td>
                  <td className='px-5 py-4'>
                    <div className='flex flex-wrap gap-2'>
                      {reversal.status === 'PENDING' && (
                        <button
                          type='button'
                          onClick={() => handleAction(reversal, 'cancel')}
                          className='rounded-full border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#1E293B] hover:bg-[rgba(226,232,240,0.5)]'
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
                  <td colSpan='6' className='px-5 py-8 text-center text-sm text-[#64748B]'>
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
                <p className='text-sm text-[#64748B]'>Nueva solicitud</p>
                <h2 className='text-2xl font-semibold text-[#1E293B]'>Solicitar reversión</h2>
              </div>
              <button
                type='button'
                onClick={() => setModalOpen(false)}
                className='rounded-full border border-[#E2E8F0] px-4 py-2 text-sm text-[#1E293B] hover:bg-[rgba(226,232,240,0.5)]'
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleRequest} className='mt-6 space-y-4'>
              <label className='block'>
                <span className='text-sm font-medium text-[#1E293B]'>ID de transacción</span>
                <input
                  type='text'
                  value={form.transactionId}
                  onChange={(event) => setForm((current) => ({ ...current, transactionId: event.target.value }))}
                  className='mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
                  required
                />
              </label>

              <label className='block'>
                <span className='text-sm font-medium text-[#1E293B]'>Motivo</span>
                <textarea
                  value={form.reason}
                  onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                  rows='4'
                  className='mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
                  required
                />
              </label>

              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setModalOpen(false)}
                  className='rounded-full border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#1E293B] transition hover:bg-[rgba(226,232,240,0.5)]'
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  className='rounded-full bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90'
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
