import { useEffect, useState, useMemo } from 'react';
import { getAccounts, getTransactions } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { formatMoney, formatDateTime } from '../shared/utils/banking.js';
import '../styles/AdminPages.css';

export const AdminAccountsView = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState('number');
  const [searchValue, setSearchValue] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [filterAmount, setFilterAmount] = useState({ min: '', max: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, transactionsData] = await Promise.all([
        getAccounts(),
        getTransactions(),
      ]);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar cuentas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      if (!searchValue) return true;
      
      if (searchType === 'number') {
        return account.accountNumber?.includes(searchValue);
      } else if (searchType === 'type') {
        return account.type?.toLowerCase().includes(searchValue.toLowerCase());
      } else if (searchType === 'balance') {
        const balance = account.balance;
        const min = filterAmount.min ? parseFloat(filterAmount.min) : 0;
        const max = filterAmount.max ? parseFloat(filterAmount.max) : Infinity;
        return balance >= min && balance <= max;
      }
      return true;
    });
  }, [accounts, searchValue, searchType, filterAmount]);

  const accountTransactions = useMemo(() => {
    if (!selectedAccount) return [];
    return transactions.filter(
      (t) =>
        t.originAccount?._id === selectedAccount._id ||
        t.destinationAccount?._id === selectedAccount._id
    );
  }, [transactions, selectedAccount]);

  if (loading) return <Spinner />;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Gestión de Cuentas</h1>
        <p>Visualiza y monitorea todas las cuentas bancarias del sistema</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filtros */}
      <div className="admin-filters">
        <div className="filter-group">
          <label>Filtrar por:</label>
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
            <option value="number">Número de Cuenta</option>
            <option value="type">Tipo de Cuenta</option>
            <option value="balance">Saldo</option>
          </select>
        </div>

        {searchType === 'balance' ? (
          <div className="filter-group">
            <input
              type="number"
              placeholder="Saldo mínimo"
              value={filterAmount.min}
              onChange={(e) => setFilterAmount({ ...filterAmount, min: e.target.value })}
            />
            <input
              type="number"
              placeholder="Saldo máximo"
              value={filterAmount.max}
              onChange={(e) => setFilterAmount({ ...filterAmount, max: e.target.value })}
            />
          </div>
        ) : (
          <div className="filter-group">
            <input
              type="text"
              placeholder={`Buscar por ${searchType === 'number' ? 'número' : 'tipo'}...`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        )}

        <button className="btn btn-secondary" onClick={() => {
          setSearchValue('');
          setFilterAmount({ min: '', max: '' });
          setSelectedAccount(null);
        }}>
          Limpiar Filtros
        </button>
      </div>

      {/* Tabla de Cuentas */}
      <div className="admin-content">
        <div className="table-container">
          <h2>Cuentas Registradas ({filteredAccounts.length})</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Número de Cuenta</th>
                <th>Tipo</th>
                <th>Saldo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <tr
                    key={account._id}
                    onClick={() => setSelectedAccount(account)}
                    className={selectedAccount?._id === account._id ? 'active' : ''}
                  >
                    <td>{account.accountNumber}</td>
                    <td className="badge">{account.type}</td>
                    <td className="amount">{formatMoney(account.balance)}</td>
                    <td>
                      <span className="status active">Activa</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-small btn-info"
                        onClick={() => setSelectedAccount(account)}
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">
                    No se encontraron cuentas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detalles de Cuenta Seleccionada */}
        {selectedAccount && (
          <div className="details-container">
            <h2>Detalles de Cuenta</h2>
            <div className="account-details">
              <div className="detail-row">
                <span>Número de Cuenta:</span>
                <strong>{selectedAccount.accountNumber}</strong>
              </div>
              <div className="detail-row">
                <span>Tipo:</span>
                <strong className="badge">{selectedAccount.type}</strong>
              </div>
              <div className="detail-row">
                <span>Saldo Actual:</span>
                <strong className="amount">{formatMoney(selectedAccount.balance)}</strong>
              </div>
              <div className="detail-row">
                <span>Creada:</span>
                <strong>{formatDateTime(selectedAccount.createdAt)}</strong>
              </div>
            </div>

            {/* Movimientos de la Cuenta */}
            <div className="movements-section">
              <h3>Movimientos de la Cuenta</h3>
              {accountTransactions.length > 0 ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Monto</th>
                      <th>Cuenta Origen/Destino</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountTransactions.map((transaction, idx) => (
                      <tr key={idx}>
                        <td className="badge">{transaction.type}</td>
                        <td className="amount">{formatMoney(transaction.amount)}</td>
                        <td>
                          {transaction.originAccount?._id === selectedAccount._id
                            ? `→ ${transaction.destinationAccount?.accountNumber}`
                            : `← ${transaction.originAccount?.accountNumber}`}
                        </td>
                        <td>{formatDateTime(transaction.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No hay movimientos para esta cuenta</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
