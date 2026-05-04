import { useEffect, useState } from 'react';
import {
  getAccounts,
  getBeneficiaries,
  getCurrentLimits,
  getExchangeRates,
  getPendingReversals,
  getTransactions,
  getUsers,
} from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { formatDateTime, formatMoney, toTitleCase } from '../shared/utils/banking.js';

export const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [limits, setLimits] = useState([]);
  const [rates, setRates] = useState([]);
  const [users, setUsers] = useState([]);
  const [reversals, setReversals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [accountsData, beneficiariesData, transactionsData, limitsData, ratesData, usersData, reversalsData] =
          await Promise.all([
            getAccounts(),
            getBeneficiaries(),
            getTransactions(),
            getCurrentLimits(),
            getExchangeRates(),
            getUsers(),
            getPendingReversals(),
          ]);

        setAccounts(Array.isArray(accountsData) ? accountsData : []);
        setBeneficiaries(Array.isArray(beneficiariesData) ? beneficiariesData : []);
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
        setLimits(Array.isArray(limitsData) ? limitsData : []);
        setRates(Array.isArray(ratesData) ? ratesData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setReversals(Array.isArray(reversalsData) ? reversalsData : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  const recentAccounts = accounts.slice(0, 4);
  const recentTransactions = transactions.slice(0, 4);
  const recentReversals = reversals.slice(0, 4);

  return (
    <div className='space-y-8'>
      <div className='flex flex-col md:flex-row md:justify-between md:items-end gap-4'>
        <div>
          <p className='text-sm text-gray-500'>Panel de administración bancaria</p>
          <h1 className='text-3xl font-bold text-main-blue'>Resumen general</h1>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <article className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <p className='text-sm text-gray-500'>Cuentas activas</p>
          <p className='mt-5 text-4xl font-semibold text-slate-900'>{accounts.length}</p>
        </article>
        <article className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <p className='text-sm text-gray-500'>Transferencias</p>
          <p className='mt-5 text-4xl font-semibold text-slate-900'>{transactions.length}</p>
        </article>
        <article className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <p className='text-sm text-gray-500'>Beneficiarios</p>
          <p className='mt-5 text-4xl font-semibold text-slate-900'>{beneficiaries.length}</p>
        </article>
        <article className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <p className='text-sm text-gray-500'>Usuarios y tasas</p>
          <p className='mt-5 text-4xl font-semibold text-slate-900'>{users.length + rates.length}</p>
        </article>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <section className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-4'>
            <h2 className='text-xl font-semibold text-slate-900'>Cuentas recientes</h2>
            <span className='text-sm text-gray-500'>{accounts.length} cuentas</span>
          </div>
          <div className='mt-6 space-y-4'>
            {recentAccounts.map((account) => (
              <article key={account._id} className='rounded-3xl border border-slate-100 p-4'>
                <h3 className='font-semibold text-slate-900'>{account.accountNumber}</h3>
                <p className='text-sm text-gray-500'>{toTitleCase(account.type)}</p>
                <div className='mt-3 flex flex-wrap gap-x-3 gap-y-2 text-sm text-slate-600'>
                  <span className='rounded-full bg-slate-100 px-3 py-1'>{formatMoney(account.balance)}</span>
                  <span className='rounded-full bg-slate-100 px-3 py-1'>Creada {formatDateTime(account.createdAt)}</span>
                </div>
              </article>
            ))}
            {recentAccounts.length === 0 && <p className='text-sm text-gray-500'>No hay cuentas disponibles.</p>}
          </div>
        </section>

        <section className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-4'>
            <h2 className='text-xl font-semibold text-slate-900'>Transferencias recientes</h2>
            <span className='text-sm text-gray-500'>Historial bancario</span>
          </div>
          <div className='mt-6 space-y-4'>
            {recentTransactions.map((transaction) => (
              <article key={transaction._id} className='rounded-3xl border border-slate-100 p-4'>
                <div className='flex items-center justify-between gap-4'>
                  <p className='font-semibold text-slate-900'>{transaction.type}</p>
                  <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700'>
                    {formatMoney(transaction.amount)}
                  </span>
                </div>
                <p className='mt-1 text-sm text-gray-500'>
                  {transaction.originAccount?.accountNumber ?? '—'} → {transaction.destinationAccount?.accountNumber ?? '—'}
                </p>
                <p className='mt-2 text-sm text-gray-600'>{formatDateTime(transaction.date)}</p>
              </article>
            ))}
            {recentTransactions.length === 0 && <p className='text-sm text-gray-500'>No hay transferencias registradas.</p>}
          </div>
        </section>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <section className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-4'>
            <h2 className='text-xl font-semibold text-slate-900'>Límites vigentes</h2>
            <span className='text-sm text-gray-500'>{limits.length} reglas</span>
          </div>
          <div className='mt-6 space-y-4'>
            {limits.slice(0, 4).map((limit) => (
              <article key={limit._id} className='rounded-3xl border border-slate-100 p-4'>
                <p className='font-semibold text-slate-900'>
                  {toTitleCase(limit.accountType || 'General')} · {limit.transactionType || 'General'}
                </p>
                <p className='mt-2 text-sm text-gray-600'>Máximo por transacción: {formatMoney(limit.maxPerTransaction)}</p>
                <p className='text-sm text-gray-600'>Máximo diario: {formatMoney(limit.maxDailyTotal)}</p>
              </article>
            ))}
            {limits.length === 0 && <p className='text-sm text-gray-500'>No hay límites configurados.</p>}
          </div>
        </section>

        <section className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-4'>
            <h2 className='text-xl font-semibold text-slate-900'>Reversiones pendientes</h2>
            <span className='text-sm text-gray-500'>Pendientes de revisión</span>
          </div>
          <div className='mt-6 space-y-4'>
            {recentReversals.map((reversal) => (
              <article key={reversal._id} className='rounded-3xl border border-slate-100 p-4'>
                <p className='font-semibold text-slate-900'>{reversal.reason}</p>
                <p className='mt-1 text-sm text-gray-500'>Transacción #{String(reversal.transactionId?._id ?? reversal.transactionId).slice(-6)}</p>
                <p className='mt-2 text-sm text-gray-600'>{formatMoney(reversal.amount)}</p>
              </article>
            ))}
            {recentReversals.length === 0 && <p className='text-sm text-gray-500'>No hay reversiones pendientes.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};
