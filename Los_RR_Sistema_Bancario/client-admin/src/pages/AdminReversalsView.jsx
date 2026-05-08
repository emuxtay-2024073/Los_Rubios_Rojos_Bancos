import { useEffect, useState } from 'react';
import { getPendingReversals, approveReversal, rejectReversal } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { formatMoney, formatDateTime } from '../shared/utils/banking.js';
import { showSuccess, showError } from '../shared/utils/toast.js';
import '../styles/AdminPages.css';

export const AdminReversalsView = () => {
  const [reversals, setReversals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReversal, setSelectedReversal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadReversals();
  }, []);

  const loadReversals = async () => {
    try {
      setLoading(true);
      const data = await getPendingReversals();
      setReversals(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar reversiones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reversalId) => {
    try {
      setProcessingId(reversalId);
      await approveReversal(reversalId);
      showSuccess('Reversión aprobada');
      loadReversals();
      setSelectedReversal(null);
    } catch (err) {
      showError('Error al aprobar reversión');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reversalId) => {
    if (!rejectionReason.trim()) {
      showError('Debes proporcionar una razón para rechazar');
      return;
    }
    try {
      setProcessingId(reversalId);
      await rejectReversal(reversalId, { reason: rejectionReason });
      showSuccess('Reversión rechazada');
      loadReversals();
      setSelectedReversal(null);
      setRejectionReason('');
    } catch (err) {
      showError('Error al rechazar reversión');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <Spinner />;

  const pendingCount = reversals.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Solicitudes de Reversión</h1>
        <p>Gestiona las solicitudes de reversión de transferencias de los usuarios</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Solicitudes Pendientes</h3>
          <p className="stat-value">{pendingCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total Solicitudes</h3>
          <p className="stat-value">{reversals.length}</p>
        </div>
      </div>

      <div className="admin-content">
        <h2>Reversiones Pendientes</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Transacción</th>
              <th>Cuenta</th>
              <th>Monto</th>
              <th>Motivo</th>
              <th>Fecha de Solicitud</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reversals.length > 0 ? (
              reversals.map((reversal) => (
                <tr key={reversal._id}>
                  <td className="mono">{reversal.transactionId?.substring(0, 8) || 'N/A'}...</td>
                  <td className="mono">{reversal.accountNumber || 'N/A'}</td>
                  <td className="amount">{formatMoney(reversal.amount)}</td>
                  <td title={reversal.reason}>{reversal.reason?.substring(0, 30)}...</td>
                  <td>{formatDateTime(reversal.requestDate)}</td>
                  <td>
                    <span className={`badge status-${reversal.status?.toLowerCase()}`}>
                      {reversal.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-small btn-info"
                      onClick={() => setSelectedReversal(reversal)}
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  No hay solicitudes de reversión
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalles */}
      {selectedReversal && (
        <div className="modal-overlay" onClick={() => setSelectedReversal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles de Reversión</h2>
              <button className="btn btn-close" onClick={() => setSelectedReversal(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span>ID de Transacción:</span>
                <strong>{selectedReversal.transactionId}</strong>
              </div>
              <div className="detail-row">
                <span>Número de Cuenta:</span>
                <strong>{selectedReversal.accountNumber}</strong>
              </div>
              <div className="detail-row">
                <span>Monto:</span>
                <strong className="amount">{formatMoney(selectedReversal.amount)}</strong>
              </div>
              <div className="detail-row">
                <span>Motivo de la Solicitud:</span>
                <p>{selectedReversal.reason}</p>
              </div>
              <div className="detail-row">
                <span>Fecha de Solicitud:</span>
                <strong>{formatDateTime(selectedReversal.requestDate)}</strong>
              </div>
              <div className="detail-row">
                <span>Estado:</span>
                <strong className={`badge status-${selectedReversal.status?.toLowerCase()}`}>
                  {selectedReversal.status}
                </strong>
              </div>

              {selectedReversal.status === 'PENDING' && (
                <div className="modal-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleApprove(selectedReversal._id)}
                    disabled={processingId === selectedReversal._id}
                  >
                    {processingId === selectedReversal._id ? 'Procesando...' : 'Aprobar Reversión'}
                  </button>

                  <div className="rejection-section">
                    <textarea
                      placeholder="Motivo del rechazo (requerido)..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows="3"
                    />
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(selectedReversal._id)}
                      disabled={processingId === selectedReversal._id || !rejectionReason.trim()}
                    >
                      {processingId === selectedReversal._id ? 'Procesando...' : 'Rechazar Reversión'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
