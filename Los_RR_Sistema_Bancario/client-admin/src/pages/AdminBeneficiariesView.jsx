import { useEffect, useState, useMemo } from 'react';
import { getBeneficiaries } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import '../styles/AdminPages.css';

export const AdminBeneficiariesView = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const loadBeneficiaries = async () => {
    try {
      setLoading(true);
      const data = await getBeneficiaries();
      setBeneficiaries(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar beneficiarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) =>
      b.alias?.toLowerCase().includes(searchValue.toLowerCase()) ||
      b.accountNumber?.includes(searchValue) ||
      b.bankName?.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [beneficiaries, searchValue]);

  if (loading) return <Spinner />;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Beneficiarios</h1>
        <p>Visualiza todas las cuentas beneficiarias registradas en el sistema</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar por alias, número de cuenta o banco..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" onClick={() => setSearchValue('')}>
          Limpiar
        </button>
      </div>

      <div className="admin-content">
        <h2>Beneficiarios Registrados ({filteredBeneficiaries.length})</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Alias</th>
              <th>Número de Cuenta</th>
              <th>Banco</th>
              <th>Propietario</th>
              <th>Favorito</th>
              <th>Registrado</th>
            </tr>
          </thead>
          <tbody>
            {filteredBeneficiaries.length > 0 ? (
              filteredBeneficiaries.map((b) => (
                <tr key={b._id}>
                  <td>{b.alias || 'Sin alias'}</td>
                  <td className="mono">{b.accountNumber}</td>
                  <td>{b.bankName || 'N/A'}</td>
                  <td>{b.ownerName || 'N/A'}</td>
                  <td>{b.isFavorite ? '⭐ Sí' : 'No'}</td>
                  <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  No se encontraron beneficiarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
