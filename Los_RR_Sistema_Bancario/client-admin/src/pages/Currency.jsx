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
        <p className='text-sm text-[#64748B]'>Mercado de divisas</p>
        <h1 className='text-3xl font-bold text-[#2563EB]'>Divisas</h1>
      </div>

      <div className='rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-sm text-[#64748B]'>Tipos de cambio implementados</p>
            <h2 className='text-xl font-semibold text-[#1E293B]'>Monedas actualizadas</h2>
            <p className='mt-2 text-sm text-[#64748B]'>Consulta las divisas disponibles y sus tasas actualizadas.</p>
          </div>
          <p className='text-sm text-[#64748B]'>Total de tipos de cambio: <strong>{rates.length}</strong></p>
        </div>
      </div>

      <div className='rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-sm text-[#64748B]'>Tipos de cambio registrados</p>
            <p className='mt-2 text-3xl font-semibold text-[#1E293B]'>{filteredRates.length}</p>
          </div>
          <input
            type='search'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Buscar por moneda'
            className='w-full max-w-xs rounded-3xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
          />
        </div>
        <div className='mt-6 overflow-x-auto'>
          <table className='min-w-full border-collapse text-left'>
            <thead className='bg-[#0F172A] text-sm text-white'>
              <tr>
                <th className='px-5 py-4'>Origen</th>
                <th className='px-5 py-4'>Destino</th>
                <th className='px-5 py-4'>Tasa</th>
                <th className='px-5 py-4'>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.map((rate) => (
                <tr key={rate._id ?? `${rate.fromCurrency}-${rate.toCurrency}`} className='border-t border-[rgba(226,232,240,0.6)] hover:bg-[rgba(37,99,235,0.04)]'>
                  <td className='px-5 py-4 text-[#1E293B]'>{rate.fromCurrency}</td>
                  <td className='px-5 py-4 text-[#1E293B]'>{rate.toCurrency}</td>
                  <td className='px-5 py-4 text-[#1E293B]'>{rate.rate}</td>
                  <td className='px-5 py-4 text-[#64748B]'>{formatDateTime(rate.createdAt)}</td>
                </tr>
              ))}
              {filteredRates.length === 0 && (
                <tr>
                  <td colSpan='4' className='px-5 py-8 text-center text-sm text-[#64748B]'>
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
