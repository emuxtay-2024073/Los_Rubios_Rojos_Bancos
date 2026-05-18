import { useEffect, useMemo, useState } from 'react';
import { getExchangeRates } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { showError } from '../shared/utils/toast.js';
import { formatDateTime } from '../shared/utils/banking.js';

export const Currency = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const ratesData = await getExchangeRates();
      setRates(Array.isArray(ratesData) ? ratesData : []);
    } catch {
      showError('No se pudieron cargar los datos de divisas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRates = useMemo(
    () =>
      rates.filter((item) => {
        const query = search.toLowerCase();
        return (
          String(item.fromCurrency ?? '').toLowerCase().includes(query) ||
          String(item.toCurrency ?? '').toLowerCase().includes(query)
        );
      }),
    [rates, search],
  );

  if (loading) return <Spinner />;

  return (
    <div className='space-y-8'>
      <div>
        <p className='text-sm text-gray-500'>Mercado de divisas</p>
        <h1 className='text-3xl font-bold text-main-blue'>Divisas</h1>
      </div>

      <div className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-sm text-gray-500'>Tipos de cambio implementados</p>
            <h2 className='text-xl font-semibold text-slate-900'>Monedas actualizadas</h2>
            <p className='mt-2 text-sm text-gray-500'>Consulta las divisas disponibles y sus tasas actualizadas.</p>
          </div>
          <p className='text-sm text-slate-600'>Total de tipos de cambio: <strong>{rates.length}</strong></p>
        </div>
      </div>

      <div className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-sm text-gray-500'>Tipos de cambio registrados</p>
            <p className='mt-2 text-3xl font-semibold text-slate-900'>{filteredRates.length}</p>
          </div>
          <input
            type='search'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Buscar por moneda'
            className='w-full max-w-xs rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
          />
        </div>
        <div className='mt-6 overflow-x-auto'>
          <table className='min-w-full border-collapse text-left'>
            <thead className='bg-slate-50 text-sm text-slate-600'>
              <tr>
                <th className='px-5 py-4'>Origen</th>
                <th className='px-5 py-4'>Destino</th>
                <th className='px-5 py-4'>Tasa</th>
                <th className='px-5 py-4'>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.map((rate) => (
                <tr key={rate._id ?? `${rate.fromCurrency}-${rate.toCurrency}`} className='border-t border-gray-100 hover:bg-slate-50'>
                  <td className='px-5 py-4'>{rate.fromCurrency}</td>
                  <td className='px-5 py-4'>{rate.toCurrency}</td>
                  <td className='px-5 py-4'>{rate.rate}</td>
                  <td className='px-5 py-4'>{formatDateTime(rate.createdAt)}</td>
                </tr>
              ))}
              {filteredRates.length === 0 && (
                <tr>
                  <td colSpan='4' className='px-5 py-8 text-center text-sm text-gray-500'>
                    No hay tipos de cambio registrados.
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
