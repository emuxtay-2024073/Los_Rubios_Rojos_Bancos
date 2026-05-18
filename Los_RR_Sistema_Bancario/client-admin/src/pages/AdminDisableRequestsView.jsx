import { useEffect, useState } from 'react';
import {
  approveDisableAccountRequest,
  getDisableAccountRequests,
  rejectDisableAccountRequest,
} from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatDateTime } from '../shared/utils/banking.js';
import '../styles/AdminPages.css';

export const AdminDisableRequestsView = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getDisableAccountRequests(statusFilter);
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      showError('No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleAction = async (request, action) => {
    try {
      const payload = { responseReason: action === 'reject' ? 'Rechazada por administrador' : 'Aprobada por administrador' };
      if (action === 'approve') {
        await approveDisableAccountRequest(request._id, payload);
        showSuccess('Solicitud aprobada y cuenta deshabilitada');
      } else {
        await rejectDisableAccountRequest(request._id, payload);
        showSuccess('Solicitud rechazada');
      }
      loadRequests();
    } catch (error) {
      showError(error?.response?.data?.message || 'No se pudo procesar la acción');
    }
  };

  const filteredRequests = requests.filter((request) => {
    const query = search.toLowerCase();
    return (
      String(request.accountId?.accountNumber ?? request.accountId ?? '')
        .toLowerCase()
        .includes(query) ||
      String(request.reason ?? '').toLowerCase().includes(query) ||
      String(request.status ?? '').toLowerCase().includes(query)
    );
  });

  if (loading) return <Spinner />;

  return (
    <div className='admin-page'>
      <div className='admin-header'>
        <h1>Solicitudes de deshabilitación</h1>
        <p>Revisa las solicitudes de los clientes y aprueba o rechaza según corresponda.</p>
      </div>

      <div className='admin-filters'>
        <div className='filter-group'>
          <label>Estado</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value='PENDING'>Pendientes</option>
            <option value='APPROVED'>Aprobadas</option>
            <option value='REJECTED'>Rechazadas</option>
            <option value='CANCELLED'>Canceladas</option>
          </select>
        </div>
        <div className='filter-group'>
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Buscar cuenta, motivo o estado'
          />
        </div>
        <button className='btn btn-secondary' onClick={() => setSearch('')}>
          Limpiar búsqueda
        </button>
      </div>

      <div className='admin-content'>
        <div className='table-container'>
          <h2>Solicitudes ({filteredRequests.length})</h2>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Cliente</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request._id}>
                    <td>{request.accountId?.accountNumber ?? request.accountId}</td>
                    <td>{request.requestedBy ?? 'N/A'}</td>
                    <td>{request.reason}</td>
                    <td>{request.status}</td>
                    <td>{formatDateTime(request.requestedAt)}</td>
                    <td>
                      {request.status === 'PENDING' ? (
                        <div className='table-actions'>
                          <button
                            className='btn btn-small btn-info'
                            onClick={() => handleAction(request, 'approve')}
                          >
                            Aprobar
                          </button>
                          <button
                            className='btn btn-small btn-accent'
                            onClick={() => handleAction(request, 'reject')}
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className='status'>{request.status}</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan='6' className='no-data'>
                    No se encontraron solicitudes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
