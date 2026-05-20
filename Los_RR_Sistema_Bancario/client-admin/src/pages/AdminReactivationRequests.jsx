import { useEffect, useState } from 'react';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { getReactivateAccountRequests, approveReactivateAccountRequest, rejectReactivateAccountRequest } from '../services/adminApi.js';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatDateTime } from '../shared/utils/banking.js';

export const AdminReactivationRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('PENDING');
  const [processingId, setProcessingId] = useState(null);
  const [modal, setModal] = useState({ open: false, id: null, action: null, reason: '' });

  const load = async () => {
    try {
      setLoading(true);
      const data = await getReactivateAccountRequests(filter);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showError('No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async () => {
    if (!modal.id) return;
    try {
      setProcessingId(modal.id);
      await approveReactivateAccountRequest(modal.id, { responseReason: modal.reason });
      showSuccess('Solicitud aprobada y cuenta reactivada');
      setModal({ open: false, id: null, action: null, reason: '' });
      await load();
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || 'No se pudo aprobar la solicitud');
    } finally { setProcessingId(null); }
  };

  const handleReject = async () => {
    if (!modal.id) return;
    try {
      setProcessingId(modal.id);
      await rejectReactivateAccountRequest(modal.id, { responseReason: modal.reason });
      showSuccess('Solicitud rechazada');
      setModal({ open: false, id: null, action: null, reason: '' });
      await load();
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || 'No se pudo rechazar la solicitud');
    } finally { setProcessingId(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm text-gray-500'>Gestión</p>
          <h1 className='text-2xl font-bold text-main-blue'>Solicitudes de habilitación</h1>
        </div>
        <div className='flex items-center gap-2'>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className='rounded-xl border px-3 py-2'>
            <option value='PENDING'>Pendientes</option>
            <option value='APPROVED'>Aprobadas</option>
            <option value='REJECTED'>Rechazadas</option>
            <option value='ALL'>Todas</option>
          </select>
          <button onClick={load} className='rounded-xl bg-main-blue px-4 py-2 text-white'>Actualizar</button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className='rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500'>No hay solicitudes.</div>
      ) : (
        <div className='grid gap-4'>
          {requests.map((r) => (
            <div key={r._id} className='rounded-2xl border border-gray-200 bg-white p-4 flex justify-between items-start'>
              <div>
                <p className='text-sm text-gray-500'>Cuenta</p>
                <p className='font-semibold text-slate-900'>{r.accountId}</p>
                <p className='mt-2 text-sm text-gray-600'>DPI: {r.dpi}</p>
                <p className='mt-1 text-sm text-gray-600'>Descripción: {r.description}</p>
                <p className='mt-2 text-xs text-gray-400'>Solicitada: {formatDateTime(r.requestedAt)}</p>
              </div>
              <div className='flex flex-col items-end gap-3'>
                <p className='text-sm font-medium'>{r.status}</p>
                {r.status === 'PENDING' && (
                  <div className='flex gap-2'>
                    <button onClick={() => setModal({ open: true, id: r._id, action: 'approve', reason: '' })} className='rounded-xl bg-green-600 px-4 py-2 text-white'>Aprobar</button>
                    <button onClick={() => setModal({ open: true, id: r._id, action: 'reject', reason: '' })} className='rounded-xl bg-red-600 px-4 py-2 text-white'>Rechazar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6'>
            <h3 className='text-lg font-semibold text-slate-900'>{modal.action === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}</h3>
            <label className='block mt-4'>
              <span className='text-sm text-gray-600'>Motivo / respuesta (opcional)</span>
              <textarea value={modal.reason} onChange={(e) => setModal({ ...modal, reason: e.target.value })} className='mt-2 w-full rounded-xl border px-3 py-2' rows={4} />
            </label>
            <div className='mt-4 flex justify-end gap-3'>
              <button onClick={() => setModal({ open: false, id: null, action: null, reason: '' })} className='rounded-xl border px-4 py-2'>Cancelar</button>
              <button onClick={modal.action === 'approve' ? handleApprove : handleReject} disabled={processingId === modal.id} className='rounded-xl bg-main-blue px-4 py-2 text-white'>
                {processingId === modal.id ? 'Procesando...' : modal.action === 'approve' ? 'Aprobar' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
