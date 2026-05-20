import { useEffect, useState, useMemo } from 'react';
import { getUsers, deactivateUser, reactivateUser } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { formatDateTime } from '../shared/utils/banking.js';
import { showSuccess, showError } from '../shared/utils/toast.js';
import '../styles/AdminPages.css';

export const AdminUsersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filtrar por estado activo/inactivo
    if (activeTab === 'active') {
      filtered = filtered.filter((u) => u.isActive !== false);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter((u) => u.isActive === false);
    }

    // Filtrar por búsqueda
    if (searchValue) {
      filtered = filtered.filter(
        (u) =>
          u.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
          u.username?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    return filtered;
  }, [users, searchValue, activeTab]);



  const handleDeactivate = async (userId) => {
    if (!deactivatePassword) {
      showError('Debes ingresar la contraseña para desactivar la cuenta');
      return;
    }
    if (window.confirm('¿Seguro que deseas desactivar esta cuenta? Esta acción requiere confirmación.')) {
      try {
        setProcessingId(userId);
        await deactivateUser(userId, deactivatePassword);
        showSuccess('Cuenta desactivada');
        loadUsers();
        setSelectedUser(null);
        setDeactivatePassword('');
      } catch (err) {
        showError(err?.response?.data?.message || 'Error al desactivar cuenta');
        console.error(err);
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleReactivate = async (userId) => {
    try {
      setProcessingId(userId);
      await reactivateUser(userId);
      showSuccess('Cuenta reactivada');
      loadUsers();
    } catch (err) {
      showError('Error al reactivar cuenta');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <Spinner />;

  const activeUsersCount = users.filter((u) => u.isActive !== false).length;
  const inactiveUsersCount = users.filter((u) => u.isActive === false).length;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Gestión de Usuarios</h1>
        <p>Administra usuarios, roles y permisos del sistema</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Usuarios Activos</h3>
          <p className="stat-value">{activeUsersCount}</p>
        </div>
        <div className="stat-card">
          <h3>Usuarios Inactivos</h3>
          <p className="stat-value">{inactiveUsersCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total Usuarios</h3>
          <p className="stat-value">{users.length}</p>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Usuarios Activos
        </button>
        <button
          className={`tab-btn ${activeTab === 'inactive' ? 'active' : ''}`}
          onClick={() => setActiveTab('inactive')}
        >
          Solicitudes de Desactivación
        </button>
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Todos
        </button>
      </div>

      <div className="admin-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar por email o usuario..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" onClick={() => setSearchValue('')}>
          Limpiar
        </button>
      </div>

      <div className="admin-content">
        <h2>
          {activeTab === 'active' && 'Usuarios Activos'}
          {activeTab === 'inactive' && 'Solicitudes de Desactivación'}
          {activeTab === 'all' && 'Todos los Usuarios'} ({filteredUsers.length})
        </h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Registrado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user._id || user.id}>
                  <td>{user.username || 'N/A'}</td>
                  <td>{user.email}</td>
                  <td className="badge">{user.role || 'CLIENTE'}</td>
                  <td>
                    <span className={`status ${user.isActive !== false ? 'active' : 'inactive'}`}>
                      {user.isActive !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{formatDateTime(user.createdAt)}</td>
                  <td>
                    <button
                      className="btn btn-small btn-info"
                      onClick={() => {
                        setSelectedUser(user);
                        setDeactivatePassword('');
                      }}
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Gestión */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gestionar Usuario</h2>
              <button className="btn btn-close" onClick={() => setSelectedUser(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span>ID del Usuario:</span>
                <strong className="mono">{selectedUser._id || selectedUser.id}</strong>
              </div>
              <div className="detail-row">
                <span>Usuario:</span>
                <strong>{selectedUser.username}</strong>
              </div>
              <div className="detail-row">
                <span>Email:</span>
                <strong>{selectedUser.email}</strong>
              </div>
              <div className="detail-row">
                <span>Rol Actual:</span>
                <strong className="badge">{selectedUser.role || 'CLIENTE'}</strong>
              </div>
              <div className="detail-row">
                <span>Estado:</span>
                <strong className={`status ${selectedUser.isActive !== false ? 'active' : 'inactive'}`}>
                  {selectedUser.isActive !== false ? 'Activo' : 'Inactivo'}
                </strong>
              </div>
              <div className="detail-row">
                <span>Registrado:</span>
                <strong>{formatDateTime(selectedUser.createdAt)}</strong>
              </div>

              <div className="modal-actions">
                {selectedUser.isActive !== false ? (
                  <>
                    <div className="form-group">
                      <label>Contraseña (requerida para desactivar):</label>
                      <input
                        type="password"
                        placeholder="Ingrese la contraseña..."
                        value={deactivatePassword}
                        onChange={(e) => setDeactivatePassword(e.target.value)}
                        disabled={processingId === selectedUser._id}
                      />
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeactivate(selectedUser._id)}
                      disabled={processingId === selectedUser._id || !deactivatePassword}
                    >
                      {processingId === selectedUser._id ? 'Procesando...' : 'Desactivar Cuenta'}
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={() => handleReactivate(selectedUser._id)}
                    disabled={processingId === selectedUser._id}
                  >
                    {processingId === selectedUser._id ? 'Procesando...' : 'Reactivar Cuenta'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
