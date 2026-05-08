import { useEffect, useMemo, useState } from 'react';
import {
  addExchangeRate,
  convertCurrency,
  deleteExchangeRate,
  getConversionHistory,
  getExchangeRate,
  getExchangeRates,
} from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { useAuthStore } from '../features/auth/store/authStore.js';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatDateTime, formatMoney } from '../shared/utils/banking.js';

const emptyRateForm = {
  fromCurrency: 'USD',
  toCurrency: 'GTQ',
  rate: '',
};

const emptyConvertForm = {
  amount: '',
  fromCurrency: 'USD',
  toCurrency: 'GTQ',
};

export const Currency = () => {
  const [rates, setRates] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rateForm, setRateForm] = useState(emptyRateForm);
  const [convertForm, setConvertForm] = useState(emptyConvertForm);
  const [conversionResult, setConversionResult] = useState(null);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ratesData, historyData] = await Promise.all([getExchangeRates(), getConversionHistory()]);
      setRates(Array.isArray(ratesData) ? ratesData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
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

  const handleCreateRate = async (event) => {
    event.preventDefault();
    try {
      await addExchangeRate({
        fromCurrency: rateForm.fromCurrency,
        toCurrency: rateForm.toCurrency,
        rate: Number(rateForm.rate),
      });
      showSuccess('Tipo de cambio agregado');
      setRateForm(emptyRateForm);
      loadData();
    } catch (error) {
      showError(error?.response?.data?.message || 'No se pudo guardar el tipo de cambio');
    }
  };

  const handleDeleteRate = async (rateId) => {
    const confirmed = window.confirm('¿Eliminar tipo de cambio?');
    if (!confirmed) return;

    try {
      await deleteExchangeRate(rateId);
      showSuccess('Tipo de cambio eliminado');
      loadData();
    } catch {
      showError('No se pudo eliminar el tipo de cambio');
    }
  };

  const handleConvert = async (event) => {
    event.preventDefault();
    try {
      const response = await convertCurrency({
        amount: Number(convertForm.amount),
        fromCurrency: convertForm.fromCurrency,
        toCurrency: convertForm.toCurrency,
      });
      setConversionResult(response);
      showSuccess('Conversión realizada');
      loadData();
    } catch (error) {
      showError(error?.response?.data?.message || 'No se pudo convertir la moneda');
    }
  };

  const handleGetRate = async () => {
    try {
      const response = await getExchangeRate(convertForm.fromCurrency, convertForm.toCurrency);
      setConversionResult(response);
    } catch (error) {
      showError(error?.response?.data?.message || 'No se pudo consultar el tipo de cambio');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className='space-y-8'>
      <div>
        <p className='text-sm text-gray-500'>Mercado de divisas</p>
        <h1 className='text-3xl font-bold text-main-blue'>Divisas</h1>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <form onSubmit={handleCreateRate} className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-4'>
          <div>
            <p className='text-sm text-gray-500'>Registro</p>
            <h2 className='text-xl font-semibold text-slate-900'>Nuevo tipo de cambio</h2>
          </div>
          <div className='grid gap-4 sm:grid-cols-3'>
            <input
              type='text'
              placeholder='Origen'
              value={rateForm.fromCurrency}
              onChange={(event) => setRateForm({ ...rateForm, fromCurrency: event.target.value.toUpperCase() })}
              className='rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
              required
            />
            <input
              type='text'
              placeholder='Destino'
              value={rateForm.toCurrency}
              onChange={(event) => setRateForm({ ...rateForm, toCurrency: event.target.value.toUpperCase() })}
              className='rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
              required
            />
            <input
              type='number'
              min='0'
              step='0.0001'
              placeholder='Tasa'
              value={rateForm.rate}
              onChange={(event) => setRateForm({ ...rateForm, rate: event.target.value })}
              className='rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
              required
            />
          </div>
          <button type='submit' className='rounded-full bg-main-blue px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90'>
            Guardar tipo de cambio
          </button>
        </form>

        {!isAdmin && (
          <form onSubmit={handleConvert} className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-4'>
            <div>
              <p className='text-sm text-gray-500'>Conversión</p>
              <h2 className='text-xl font-semibold text-slate-900'>Convertir moneda</h2>
            </div>
            <div className='grid gap-4 sm:grid-cols-3'>
              <input
                type='number'
                min='0'
                step='0.01'
                placeholder='Monto'
                value={convertForm.amount}
                onChange={(event) => setConvertForm({ ...convertForm, amount: event.target.value })}
                className='rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                required
              />
              <input
                type='text'
                placeholder='Origen'
                value={convertForm.fromCurrency}
                onChange={(event) => setConvertForm({ ...convertForm, fromCurrency: event.target.value.toUpperCase() })}
                className='rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                required
              />
              <input
                type='text'
                placeholder='Destino'
                value={convertForm.toCurrency}
                onChange={(event) => setConvertForm({ ...convertForm, toCurrency: event.target.value.toUpperCase() })}
                className='rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                required
              />
            </div>
            <div className='flex flex-wrap gap-3'>
              <button type='submit' className='rounded-full bg-main-blue px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90'>
                Convertir
              </button>
              <button
                type='button'
                onClick={handleGetRate}
                className='rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100'
              >
                Consultar tasa
              </button>
            </div>
            {conversionResult && (
              <div className='rounded-2xl bg-slate-50 p-4 text-sm text-slate-700'>
                <p>
                  Tasa: <strong>{conversionResult.rate ?? conversionResult.exchangeRate ?? 0}</strong>
                </p>
                {'convertedAmount' in conversionResult && (
                  <p>
                    Monto convertido: <strong>{formatMoney(conversionResult.convertedAmount)}</strong>
                  </p>
                )}
              </div>
            )}
          </form>
        )}
        {isAdmin && (
          <div className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
            <p className='text-sm text-gray-500'>Configuración de divisas</p>
            <p className='mt-2 text-slate-700'>El administrador puede gestionar tipos de cambio y ver el historial de uso. Las conversiones de usuarios se aplican en las transacciones.</p>
          </div>
        )}
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
                <th className='px-5 py-4'>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.map((rate) => (
                <tr key={rate._id ?? `${rate.fromCurrency}-${rate.toCurrency}`} className='border-t border-gray-100 hover:bg-slate-50'>
                  <td className='px-5 py-4'>{rate.fromCurrency}</td>
                  <td className='px-5 py-4'>{rate.toCurrency}</td>
                  <td className='px-5 py-4'>{rate.rate}</td>
                  <td className='px-5 py-4'>{formatDateTime(rate.createdAt)}</td>
                  <td className='px-5 py-4'>
                    <button
                      type='button'
                      onClick={() => handleDeleteRate(rate._id)}
                      className='rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50'
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRates.length === 0 && (
                <tr>
                  <td colSpan='5' className='px-5 py-8 text-center text-sm text-gray-500'>
                    No hay tipos de cambio registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
        <p className='text-sm text-gray-500'>Historial de conversiones</p>
        <div className='mt-4 overflow-x-auto'>
          <table className='min-w-full border-collapse text-left'>
            <thead className='bg-slate-50 text-sm text-slate-600'>
              <tr>
                <th className='px-5 py-4'>Monto</th>
                <th className='px-5 py-4'>Origen</th>
                <th className='px-5 py-4'>Destino</th>
                <th className='px-5 py-4'>Convertido</th>
                <th className='px-5 py-4'>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => (
                <tr key={entry._id ?? `${entry.fromCurrency}-${entry.toCurrency}-${index}`} className='border-t border-gray-100 hover:bg-slate-50'>
                  <td className='px-5 py-4'>{formatMoney(entry.amount)}</td>
                  <td className='px-5 py-4'>{entry.fromCurrency}</td>
                  <td className='px-5 py-4'>{entry.toCurrency}</td>
                  <td className='px-5 py-4'>{formatMoney(entry.convertedAmount)}</td>
                  <td className='px-5 py-4'>{formatDateTime(entry.createdAt)}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan='5' className='px-5 py-8 text-center text-sm text-gray-500'>
                    No hay historial de conversiones.
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
