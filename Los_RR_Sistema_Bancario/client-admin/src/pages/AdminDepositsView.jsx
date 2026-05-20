import { useEffect, useState, useMemo } from 'react';
import { getTransactions } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { formatMoney, formatDateTime } from '../shared/utils/banking.js';
import '../styles/AdminPages.css';

export const AdminDepositsView = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState('account');
  const [searchValue, setSearchValue] = useState('');
  const [filterAmount, setFilterAmount] = useState({ min: '', max: '' });
  const [filterTransactionType, setFilterTransactionType] = useState('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions();
      setTransactions(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar depósitos y retiros');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Filtrar solo depósitos y retiros
      const isDepositOrWithdraw = transaction.type === 'DEPOSITO' || transaction.type === 'RETIRO';
      if (!isDepositOrWithdraw) return false;

      // Filtrar por tipo de transacción (DEPOSITO/RETIRO/TODAS)
      if (filterTransactionType !== 'all' && transaction.type !== filterTransactionType) return false;

      // Filtrar por monto
      if (filterAmount.min || filterAmount.max) {
        const min = filterAmount.min ? parseFloat(filterAmount.min) : 0;
        const max = filterAmount.max ? parseFloat(filterAmount.max) : Infinity;
        if (transaction.amount < min || transaction.amount > max) return false;
      }

      // Filtrar por búsqueda
      if (!searchValue) return true;

      if (searchType === 'account') {
        // Para depósitos/retiros, la cuenta relevante es originAccount para retiros y destinationAccount para depósitos
        return (
          transaction.originAccount?.accountNumber?.includes(searchValue) ||
          transaction.destinationAccount?.accountNumber?.includes(searchValue)
        );
      } else {
        return String(transaction.description || '').toLowerCase().includes(searchValue.toLowerCase());
      }
    });
  }, [transactions, searchValue, searchType, filterAmount, filterTransactionType]);

  if (loading) return <Spinner />;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Retiros y Depósitos</h1>
        <p>Visualiza el historial de todos los depósitos y retiros realizados</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-filters">
        <div className="filter-group">
          <label>Tipo de operación:</label>
          <select value={filterTransactionType} onChange={(e) => setFilterTransactionType(e.target.value)}>
            <option value="all">Todas</option>
            <option value="DEPOSITO">Depósitos</option>
            <option value="RETIRO">Retiros</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Tipo de búsqueda:</label>
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
            <option value="account">Número de Cuenta</option>
            <option value="description">Descripción</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="text"
            placeholder={searchType === 'account' ? 'Número de cuenta...' : 'Buscar descripción...'}
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
            setFilterTransactionType('all');
          }}
        >
          Limpiar Filtros
        </button>
      </div>

      <div className="admin-content">
        <h2>Depósitos y Retiros ({filteredTransactions.length})</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Monto</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction, idx) => (
                <tr key={idx}>
                  <td className="mono">
                    {transaction.type === 'DEPOSITO'
                      ? transaction.destinationAccount?.accountNumber || 'N/A'
                      : transaction.originAccount?.accountNumber || 'N/A'}
                  </td>
                  <td className="amount">{formatMoney(transaction.amount)}</td>
                  <td className="badge">
                    <span className={transaction.type === 'DEPOSITO' ? 'badge-success' : 'badge-warning'}>
                      {transaction.type}
                    </span>
                  </td>
                  <td>{transaction.description || '-'}</td>
                  <td>{formatDateTime(transaction.date)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  No se encontraron depósitos o retiros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
