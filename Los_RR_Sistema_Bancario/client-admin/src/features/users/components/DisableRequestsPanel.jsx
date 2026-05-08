import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export const DisableRequestsPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisableRequests();
  }, []);

  const fetchDisableRequests = async () => {
    try {
      const response = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const users = await response.json();
        // Filtrar solo usuarios con solicitudes de deshabilitación pendientes
        const pendingRequests = users.filter((user) => user.hasDisableRequest);
        setRequests(pendingRequests);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    const reason = prompt('Motivo de aprobación (opcional):');
    
    try {
      const response = await fetch(`/api/auth/users/${userId}/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason: reason || 'Cuenta deshabilitada por solicitud del usuario' }),
      });

      if (response.ok) {
        toast.success('Cuenta deshabilitada exitosamente');
        fetchDisableRequests();
      } else {
        toast.error('Error al deshabilitarla cuenta');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const handleReject = async (userId) => {
    try {
      const response = await fetch(`/api/auth/users/${userId}/reject-disable-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success('Solicitud rechazada');
        fetchDisableRequests();
      } else {
        toast.error('Error al rechazar solicitud');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando solicitudes...</div>;
  }

  if (requests.length === 0) {
    return <div className="text-center py-8 text-gray-500">No hay solicitudes de deshabilitación pendientes</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-6">Solicitudes de Deshabilitación Pendientes</h2>
      
      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-medium text-gray-800">{request.username}</p>
                <p className="text-sm text-gray-600">{request.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Solicitado el: {new Date(request.disableRequestedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {request.disableRequestReason && (
              <div className="mb-3 p-2 bg-white rounded border border-gray-200">
                <p className="text-xs font-medium text-gray-600">Razón:</p>
                <p className="text-sm text-gray-700">{request.disableRequestReason}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(request.id)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors"
              >
                Aprobar deshabilitación
              </button>
              <button
                onClick={() => handleReject(request.id)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors"
              >
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
