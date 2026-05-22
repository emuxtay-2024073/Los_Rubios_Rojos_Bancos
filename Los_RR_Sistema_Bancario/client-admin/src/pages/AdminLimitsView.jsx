import { useEffect, useState } from 'react';
import {
  getCurrentLimits,
  createDefaultLimit,
  createUserLimit,
  deleteLimit,
  getAccounts,
} from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { formatMoney } from '../shared/utils/banking.js';
import { showSuccess, showError } from '../shared/utils/toast.js';
import '../styles/AdminPages.css';

export const AdminLimitsView = () => {
  const [limits, setLimits] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDefaultForm, setShowDefaultForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [defaultForm, setDefaultForm] = useState({
    maxPerTransaction: '',
    maxDailyTotal: '',
    maxMonthlyTotal: '',
    maxDailyCount: '',
  });
  const [userForm, setUserForm] = useState({
    accountNumber: '',
    maxPerTransaction: '',
    maxDailyTotal: '',
    maxMonthlyTotal: '',
    maxDailyCount: '',
  });

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      setLoading(true);
      const [data, accountsData] = await Promise.all([getCurrentLimits(), getAccounts()]);
      setLimits(Array.isArray(data) ? data : []);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar límites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultLimit = async (e) => {
    e.preventDefault();
    try {
      await createDefaultLimit({
        maxPerTransaction: parseFloat(defaultForm.maxPerTransaction),
        maxDailyTotal: parseFloat(defaultForm.maxDailyTotal),
        maxMonthlyTotal: parseFloat(defaultForm.maxMonthlyTotal),
        maxDailyCount: parseInt(defaultForm.maxDailyCount),
      });
      showSuccess('Límites por defecto establecidos');
      setDefaultForm({
        maxPerTransaction: '',
        maxDailyTotal: '',
        maxMonthlyTotal: '',
        maxDailyCount: '',
      });
      setShowDefaultForm(false);
      loadLimits();
    } catch (err) {
      showError('Error al establecer límites por defecto');
      console.error(err);
    }
  };

  const handleSetUserLimit = async (e) => {
    e.preventDefault();
    try {
      const selectedAccount = accounts.find((account) => account.accountNumber === userForm.accountNumber);
      if (!selectedAccount) {
        showError('Cuenta no encontrada. Por favor ingresa un número de cuenta válido.');
        return;
      }

      await createUserLimit({
        targetUserId: selectedAccount.userId,
        maxPerTransaction: parseFloat(userForm.maxPerTransaction),
        maxDailyTotal: parseFloat(userForm.maxDailyTotal),
        maxMonthlyTotal: parseFloat(userForm.maxMonthlyTotal),
        maxDailyCount: parseInt(userForm.maxDailyCount),
      });
      showSuccess('Límite personalizado establecido');
      setUserForm({
        accountNumber: '',
        maxPerTransaction: '',
        maxDailyTotal: '',
        maxMonthlyTotal: '',
        maxDailyCount: '',
      });
      setShowUserForm(false);
      loadLimits();
    } catch (err) {
      showError('Error al establecer límite personalizado');
      console.error(err);
    }
  };

  const handleDeleteLimit = async (limitId) => {
    if (window.confirm('¿Seguro que deseas eliminar este límite?')) {
      try {
        await deleteLimit(limitId);
        showSuccess('Límite eliminado');
        loadLimits();
      } catch (err) {
        showError('Error al eliminar límite');
        console.error(err);
      }
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className='admin-page'>
      <div className='admin-header'>
        <h1>Gestión de Límites de Transacciones</h1>
        <p>Configura límites de retiro y transferencia para el sistema</p>
      </div>

      {error && <div className='alert alert-error'>{error}</div>}

      <div className='admin-actions'>
        <button className='btn btn-primary' onClick={() => setShowDefaultForm(!showDefaultForm)}>
          {showDefaultForm ? '✕ Cancelar' : '+ Límites por Defecto'}
        </button>
        <button className='btn btn-primary' onClick={() => setShowUserForm(!showUserForm)}>
          {showUserForm ? '✕ Cancelar' : '+ Límite Personalizado'}
        </button>
      </div>

      {/* Formulario Límites por Defecto */}
      {showDefaultForm && (
        <div className='form-container'>
          <h2>Establecer Límites por Defecto</h2>
          <form onSubmit={handleSetDefaultLimit}>
            <div className='form-group'>
              <label>Máximo por Transacción:</label>
              <input
                type='number'
                placeholder='Ej: 10000'
                value={defaultForm.maxPerTransaction}
                onChange={(e) =>
                  setDefaultForm({ ...defaultForm, maxPerTransaction: e.target.value })
                }
                required
              />
            </div>
            <div className='form-group'>
              <label>Máximo Diario Total:</label>
              <input
                type='number'
                placeholder='Ej: 50000'
                value={defaultForm.maxDailyTotal}
                onChange={(e) => setDefaultForm({ ...defaultForm, maxDailyTotal: e.target.value })}
                required
              />
            </div>
            <div className='form-group'>
              <label>Máximo Mensual Total:</label>
              <input
                type='number'
                placeholder='Ej: 500000'
                value={defaultForm.maxMonthlyTotal}
                onChange={(e) =>
                  setDefaultForm({ ...defaultForm, maxMonthlyTotal: e.target.value })
                }
                required
              />
            </div>
            <div className='form-group'>
              <label>Máximo Conteo Diario:</label>
              <input
                type='number'
                placeholder='Ej: 20'
                value={defaultForm.maxDailyCount}
                onChange={(e) => setDefaultForm({ ...defaultForm, maxDailyCount: e.target.value })}
                required
              />
            </div>
            <button type='submit' className='btn btn-success'>
              Guardar Límites por Defecto
            </button>
          </form>
        </div>
      )}

      {/* Formulario Límite Personalizado */}
      {showUserForm && (
        <div className='form-container'>
          <h2>Establecer Límite Personalizado para Cuenta</h2>
          <form onSubmit={handleSetUserLimit}>
            <div className='form-group'>
              <label>Número de cuenta:</label>
              <select
                value={userForm.accountNumber}
                onChange={(e) => setUserForm({ ...userForm, accountNumber: e.target.value })}
                required
              >
                <option value=''>Seleccionar cuenta</option>
                {accounts.map((account) => (
                  <option key={account._id} value={account.accountNumber}>
                    {account.accountNumber} ({account.type})
                  </option>
                ))}
              </select>
            </div>
            <div className='form-group'>
              <label>Máximo por Transacción:</label>
              <input
                type='number'
                placeholder='Ej: 10000'
                value={userForm.maxPerTransaction}
                onChange={(e) => setUserForm({ ...userForm, maxPerTransaction: e.target.value })}
                required
              />
            </div>
            <div className='form-group'>
              <label>Máximo Diario Total:</label>
              <input
                type='number'
                placeholder='Ej: 50000'
                value={userForm.maxDailyTotal}
                onChange={(e) => setUserForm({ ...userForm, maxDailyTotal: e.target.value })}
                required
              />
            </div>
            <div className='form-group'>
              <label>Máximo Mensual Total:</label>
              <input
                type='number'
                placeholder='Ej: 500000'
                value={userForm.maxMonthlyTotal}
                onChange={(e) => setUserForm({ ...userForm, maxMonthlyTotal: e.target.value })}
                required
              />
            </div>
            <div className='form-group'>
              <label>Máximo Conteo Diario:</label>
              <input
                type='number'
                placeholder='Ej: 20'
                value={userForm.maxDailyCount}
                onChange={(e) => setUserForm({ ...userForm, maxDailyCount: e.target.value })}
                required
              />
            </div>
            <button type='submit' className='btn btn-success'>
              Guardar Límite Personalizado
            </button>
          </form>
        </div>
      )}

      {/* Tabla de Límites */}
      <div className='admin-content'>
        <h2>Límites Configurados ({limits.length})</h2>
        <table className='admin-table'>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Máx por Transacción</th>
              <th>Máx Diario Total</th>
              <th>Máx Mensual Total</th>
              <th>Máx Conteo Diario</th>
              <th>Cuenta/Sistema</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {limits.length > 0 ? (
              limits.map((limit, index) => (
                <tr key={limit._id || index}>
                  <td className='badge'>{limit.isDefault ? 'Por Defecto' : 'Personalizado'}</td>
                  <td className='amount'>{formatMoney(limit.maxPerTransaction)}</td>
                  <td className='amount'>{formatMoney(limit.maxDailyTotal)}</td>
                  <td className='amount'>{formatMoney(limit.maxMonthlyTotal)}</td>
                  <td>{limit.maxDailyCount}</td>
                  <td>
                    {limit.userId ? (
                      (() => {
                        const account = accounts.find((acc) => String(acc.userId) === String(limit.userId));
                        return account ? account.accountNumber : String(limit.userId).substring(0, 8) + '...';
                      })()
                    ) : (
                      'Sistema'
                    )}
                  </td>
                  <td>
                    <button
                      className='btn btn-small btn-danger'
                      onClick={() => handleDeleteLimit(limit._id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='7' className='no-data'>
                  No hay límites configurados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
