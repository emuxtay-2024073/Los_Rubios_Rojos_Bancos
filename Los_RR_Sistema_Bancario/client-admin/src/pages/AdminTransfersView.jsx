import { useEffect, useState, useMemo } from 'react';
import { getTransactions } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { formatMoney, formatDateTime } from '../shared/utils/banking.js';
import '../styles/AdminPages.css';

export const AdminTransfersView = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [filterAmount, setFilterAmount] = useState({ min: '', max: '' });

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const data = await getTransactions();
      setTransfers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar transferencias');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      // Filtrar por monto
      if (filterAmount.min || filterAmount.max) {
        const min = filterAmount.min ? parseFloat(filterAmount.min) : 0;
        const max = filterAmount.max ? parseFloat(filterAmount.max) : Infinity;
        if (transfer.amount < min || transfer.amount > max) return false;
      }

      // Filtrar por búsqueda
      if (!searchValue) return true;

      if (searchType === 'origin') {
        return transfer.originAccount?.accountNumber?.includes(searchValue);
      } else if (searchType === 'destination') {
        return transfer.destinationAccount?.accountNumber?.includes(searchValue);
      } else {
        return (
          transfer.originAccount?.accountNumber?.includes(searchValue) ||
          transfer.destinationAccount?.accountNumber?.includes(searchValue)
        );
      }
    });
  }, [transfers, searchValue, searchType, filterAmount]);

  if (loading) return <Spinner />;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Transferencias</h1>
        <p>Visualiza el historial de todas las transferencias realizadas</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-filters">
        <div className="filter-group">
          <label>Tipo de búsqueda:</label>
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
            <option value="all">Todas las Cuentas</option>
            <option value="origin">Cuenta Origen</option>
            <option value="destination">Cuenta Destino</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="text"
            placeholder="Número de cuenta..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <input
            type="number"
            placeholder="Monto mínimo"
            value={filterAmount.min}
            onChange={(e) => setFilterAmount({ ...filterAmount, min: e.target.value })}
          />
          <input
            type="number"
            placeholder="Monto máximo"
            value={filterAmount.max}
            onChange={(e) => setFilterAmount({ ...filterAmount, max: e.target.value })}
          />
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => {
            setSearchValue('');
            setFilterAmount({ min: '', max: '' });
          }}
        >
          Limpiar Filtros
        </button>
      </div>

      <div className="admin-content">
        <h2>Transferencias ({filteredTransfers.length})</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cuenta Origen</th>
              <th>Cuenta Destino</th>
              <th>Monto</th>
              <th>Tipo</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransfers.length > 0 ? (
              filteredTransfers.map((transfer, idx) => (
                <tr key={idx}>
                  <td className="mono">{transfer.originAccount?.accountNumber || 'N/A'}</td>
                  <td className="mono">{transfer.destinationAccount?.accountNumber || 'N/A'}</td>
                  <td className="amount">{formatMoney(transfer.amount)}</td>
                  <td className="badge">{transfer.type}</td>
                  <td>{formatDateTime(transfer.date)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  No se encontraron transferencias
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
