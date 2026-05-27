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
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  ArrowUturnLeftIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

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

  const getTransactionIcon = (type) => {
    const normalizedType = String(type || '').toLowerCase();

    if (normalizedType.includes('dep')) {
      return ArrowDownTrayIcon;
    }
    if (normalizedType.includes('retiro') || normalizedType.includes('withdraw')) {
      return ArrowUpTrayIcon;
    }
    if (normalizedType.includes('revers')) {
      return ArrowUturnLeftIcon;
    }
    if (normalizedType.includes('transf')) {
      return ArrowsRightLeftIcon;
    }
    return CurrencyDollarIcon;
  };

  return (
    <div className='space-y-8 animate-fadeIn'>
      <div className='space-y-4'>
        <div>
          <p className='subtitle'>Panel de administración bancaria</p>
          <h1 className='text-4xl font-bold text-[var(--navy)]'>Resumen general</h1>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <article className='card'>
            <p className='text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]'>Cuentas activas</p>
            <p className='mt-5 text-4xl font-bold text-[var(--navy)]'>{accounts.length}</p>
          </article>
          <article className='card'>
            <p className='text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]'>Transferencias</p>
            <p className='mt-5 text-4xl font-bold text-[var(--navy)]'>{transactions.length}</p>
          </article>
          <article className='card'>
            <p className='text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]'>Beneficiarios</p>
            <p className='mt-5 text-4xl font-bold text-[var(--navy)]'>{beneficiaries.length}</p>
          </article>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <section className='card p-6'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <h2 className='text-xl font-semibold text-[var(--navy)]'>Cuentas recientes</h2>
              <p className='subtitle'>Últimas aperturas y su estado</p>
            </div>
            <span className='text-sm text-[var(--text-secondary)]'>{accounts.length} cuentas</span>
          </div>
          <div className='mt-6 space-y-4'>
            {recentAccounts.map((account) => (
              <article key={account._id ?? account.accountNumber} className='card border border-slate-100 p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-[var(--navy)]'>{account.accountNumber}</h3>
                    <p className='text-sm text-[var(--text-secondary)]'>{toTitleCase(account.type)}</p>
                  </div>
                  <span className='rounded-2xl bg-[var(--soft-gold)]/12 px-3 py-1 text-sm font-semibold text-[var(--soft-gold)]'>
                    {formatMoney(account.balance)}
                  </span>
                </div>
                <p className='mt-4 text-sm text-[var(--text-secondary)]'>Creada {formatDateTime(account.createdAt)}</p>
              </article>
            ))}
            {recentAccounts.length === 0 && <p className='text-sm text-[var(--text-secondary)]'>No hay cuentas disponibles.</p>}
          </div>
        </section>

        <section className='card p-6'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <h2 className='text-xl font-semibold text-[var(--navy)]'>Movimientos recientes</h2>
              <p className='subtitle'>Historial de transferencias bajo un formato más moderno.</p>
            </div>
            <span className='text-sm text-[var(--text-secondary)]'>Últimos registros</span>
          </div>
          <div className='mt-6 space-y-4'>
            {recentTransactions.map((transaction) => {
              const Icon = getTransactionIcon(transaction.type);
              return (
                <article
                  key={transaction._id ?? `${transaction.date}-${transaction.amount}`}
                  className='card border border-slate-100 p-5 hover:bg-[#fcf9f5]'
                >
                  <div className='flex items-center justify-between gap-4'>
                    <div className='inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--soft-gold)]/15 text-[var(--soft-gold)]'>
                      <Icon className='h-6 w-6' />
                    </div>
                    <span className='rounded-full bg-[var(--soft-gold)]/12 px-3 py-1 text-xs font-semibold text-[var(--soft-gold)]'>
                      {formatMoney(transaction.amount)}
                    </span>
                  </div>

                  <div className='mt-4'>
                    <h3 className='text-lg font-semibold text-[var(--navy)]'>{transaction.type}</h3>
                    <p className='mt-2 text-sm text-[var(--text-secondary)]'>
                      {transaction.originAccount?.accountNumber ?? '—'} → {transaction.destinationAccount?.accountNumber ?? '—'}
                    </p>
                  </div>
                  <p className='mt-3 text-sm text-[var(--text-secondary)]'>{formatDateTime(transaction.date)}</p>
                </article>
              );
            })}
            {recentTransactions.length === 0 && <p className='text-sm text-[var(--text-secondary)]'>No hay transferencias registradas.</p>}
          </div>
        </section>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <section className='card p-6'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <h2 className='text-xl font-semibold text-[var(--navy)]'>Límites vigentes</h2>
              <p className='subtitle'>Reglas de transacción activas</p>
            </div>
            <span className='text-sm text-[var(--text-secondary)]'>{limits.length} reglas</span>
          </div>
          <div className='mt-6 space-y-4'>
            {limits.slice(0, 4).map((limit) => (
              <article key={limit._id ?? `${limit.accountType}-${limit.transactionType}`} className='rounded-3xl border border-slate-100 p-4'>
                <p className='font-semibold text-[var(--navy)]'>
                  {toTitleCase(limit.accountType || 'General')} · {limit.transactionType || 'General'}
                </p>
                <p className='mt-2 text-sm text-[var(--text-secondary)]'>Máximo por transacción: {formatMoney(limit.maxPerTransaction)}</p>
                <p className='text-sm text-[var(--text-secondary)]'>Máximo diario: {formatMoney(limit.maxDailyTotal)}</p>
              </article>
            ))}
            {limits.length === 0 && <p className='text-sm text-[var(--text-secondary)]'>No hay límites configurados.</p>}
          </div>
        </section>

        <section className='card p-6'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <h2 className='text-xl font-semibold text-[var(--navy)]'>Reversiones pendientes</h2>
              <p className='subtitle'>Solicitudes por revisar</p>
            </div>
            <span className='text-sm text-[var(--text-secondary)]'>Pendientes</span>
          </div>
          <div className='mt-6 space-y-4'>
            {recentReversals.map((reversal) => (
              <article key={reversal._id ?? reversal.transactionId} className='rounded-3xl border border-slate-100 p-4'>
                <p className='font-semibold text-[var(--navy)]'>{reversal.reason}</p>
                <p className='mt-1 text-sm text-[var(--text-secondary)]'>Transacción #{String(reversal.transactionId?._id ?? reversal.transactionId).slice(-6)}</p>
                <p className='mt-2 text-sm font-semibold text-[var(--navy)]'>{formatMoney(reversal.amount)}</p>
              </article>
            ))}
            {recentReversals.length === 0 && <p className='text-sm text-[var(--text-secondary)]'>No hay reversiones pendientes.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};
