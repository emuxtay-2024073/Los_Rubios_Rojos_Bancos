import { useEffect, useState, useMemo } from 'react';
import { getExchangeRates, getConversionHistory, addExchangeRate, deleteExchangeRate } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { formatMoney, formatDateTime } from '../shared/utils/banking.js';
import { showSuccess, showError } from '../shared/utils/toast.js';
import '../styles/AdminPages.css';

const CURRENCIES = ['USD', 'EUR', 'MXN', 'COP', 'BRL', 'GTQ', 'HNL'];

export const AdminCurrencyView = () => {
  const [rates, setRates] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('rates');
  const [newRate, setNewRate] = useState({
    fromCurrency: 'USD',
    toCurrency: 'GTQ',
    rate: '',
  });
  const [searchHistory, setSearchHistory] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ratesData, historyData] = await Promise.all([
        getExchangeRates(),
        getConversionHistory(),
      ]);
      setRates(Array.isArray(ratesData) ? ratesData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar divisas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRate = async (e) => {
    e.preventDefault();
    if (!newRate.rate || parseFloat(newRate.rate) <= 0) {
      showError('La tasa debe ser mayor a 0');
      return;
    }
    try {
      await addExchangeRate({
        fromCurrency: newRate.fromCurrency,
        toCurrency: newRate.toCurrency,
        rate: parseFloat(newRate.rate),
      });
      showSuccess('Tasa de cambio agregada');
      setNewRate({ fromCurrency: 'USD', toCurrency: 'GTQ', rate: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      showError('Error al agregar tasa');
      console.error(err);
    }
  };

  const handleDeleteRate = async (rateId) => {
    if (window.confirm('¿Seguro que deseas eliminar esta tasa?')) {
      try {
        await deleteExchangeRate(rateId);
        showSuccess('Tasa eliminada');
        loadData();
      } catch (err) {
        showError('Error al eliminar tasa');
        console.error(err);
      }
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(
      (h) =>
        h.fromCurrency?.includes(searchHistory.toUpperCase()) ||
        h.toCurrency?.includes(searchHistory.toUpperCase())
    );
  }, [history, searchHistory]);

  if (loading) return <Spinner />;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Gestión de Divisas</h1>
        <p>Actualiza tasas de cambio y monitorea conversiones de divisas</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'rates' ? 'active' : ''}`}
          onClick={() => setActiveTab('rates')}
        >
          Tasas de Cambio
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Historial de Conversiones
        </button>
      </div>

      {activeTab === 'rates' && (
        <>
          <div className="admin-actions">
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Cancelar' : '+ Nueva Tasa de Cambio'}
            </button>
          </div>

          {showForm && (
            <div className="form-container">
              <h2>Agregar Nueva Tasa de Cambio</h2>
              <form onSubmit={handleAddRate}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Moneda Origen:</label>
                    <select
                      value={newRate.fromCurrency}
                      onChange={(e) => setNewRate({ ...newRate, fromCurrency: e.target.value })}
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Moneda Destino:</label>
                    <select
                      value={newRate.toCurrency}
                      onChange={(e) => setNewRate({ ...newRate, toCurrency: e.target.value })}
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tasa de Cambio:</label>
                    <input
                      type="number"
                      placeholder="Ej: 7.85"
                      step="0.01"
                      value={newRate.rate}
                      onChange={(e) => setNewRate({ ...newRate, rate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-success">
                  Agregar Tasa
                </button>
              </form>
            </div>
          )}

          <div className="admin-content">
            <h2>Tasas de Cambio Actuales ({rates.length})</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>De</th>
                  <th>A</th>
                  <th>Tasa</th>
                  <th>Actualizado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rates.length > 0 ? (
                  rates.map((rate) => (
                    <tr key={rate._id}>
                      <td className="badge">{rate.fromCurrency}</td>
                      <td className="badge">{rate.toCurrency}</td>
                      <td className="amount">{rate.rate.toFixed(4)}</td>
                      <td>{formatDateTime(rate.updatedAt)}</td>
                      <td>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => handleDeleteRate(rate._id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">
                      No hay tasas de cambio configuradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <>
          <div className="admin-filters">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Buscar por monedas (USD, GTQ, etc)..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary" onClick={() => setSearchHistory('')}>
              Limpiar
            </button>
          </div>

          <div className="admin-content">
            <h2>Historial de Conversiones ({filteredHistory.length})</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>De</th>
                  <th>A</th>
                  <th>Monto Original</th>
                  <th>Monto Convertido</th>
                  <th>Tasa Aplicada</th>
                  <th>Usuario</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((conv, idx) => (
                    <tr key={idx}>
                      <td className="badge">{conv.fromCurrency}</td>
                      <td className="badge">{conv.toCurrency}</td>
                      <td className="amount">{formatMoney(conv.amountFrom)}</td>
                      <td className="amount">{formatMoney(conv.amountTo)}</td>
                      <td>{conv.rate?.toFixed(4)}</td>
                      <td className="mono">{conv.userId?.substring(0, 8) || 'N/A'}...</td>
                      <td>{formatDateTime(conv.date)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No hay conversiones registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
