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
import { StatCard } from '../shared/components/ui/StatCard.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../shared/components/ui/Card.jsx';
import { Badge } from '../shared/components/ui/Badge.jsx';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  ArrowUturnLeftIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  UsersIcon,
  ChartBarIcon,
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
          <p className='text-sm font-medium text-[#64748B]'>Panel de administración bancaria</p>
          <h1 className='text-4xl font-bold text-[#1E293B]'>Resumen general</h1>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <StatCard
            title='Cuentas activas'
            value={accounts.length}
            change='+12%'
            changeType='positive'
            icon={BanknotesIcon}
          />
          <StatCard
            title='Transferencias'
            value={transactions.length}
            change='+8%'
            changeType='positive'
            icon={ArrowsRightLeftIcon}
          />
          <StatCard
            title='Beneficiarios'
            value={beneficiaries.length}
            change='+5%'
            changeType='positive'
            icon={UsersIcon}
          />
          <StatCard
            title='Usuarios'
            value={users.length}
            change='+3%'
            changeType='positive'
            icon={ChartBarIcon}
          />
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <CardTitle>Cuentas recientes</CardTitle>
                <CardDescription>Últimas aperturas y su estado</CardDescription>
              </div>
              <Badge variant='info'>{accounts.length} cuentas</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentAccounts.map((account) => (
                <article key={account._id ?? account.accountNumber} className='rounded-xl border border-[rgba(226,232,240,0.6)] p-4 hover:bg-[rgba(37,99,235,0.02)] transition-colors'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <h3 className='font-semibold text-[#1E293B]'>{account.accountNumber}</h3>
                      <p className='text-sm text-[#64748B]'>{toTitleCase(account.type)}</p>
                    </div>
                    <Badge variant='accent'>{formatMoney(account.balance)}</Badge>
                  </div>
                  <p className='mt-4 text-sm text-[#64748B]'>Creada {formatDateTime(account.createdAt)}</p>
                </article>
              ))}
              {recentAccounts.length === 0 && <p className='text-sm text-[#64748B]'>No hay cuentas disponibles.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <CardTitle>Movimientos recientes</CardTitle>
                <CardDescription>Historial de transferencias</CardDescription>
              </div>
              <Badge variant='info'>Últimos registros</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentTransactions.map((transaction) => {
                const Icon = getTransactionIcon(transaction.type);
                return (
                  <article
                    key={transaction._id ?? `${transaction.date}-${transaction.amount}`}
                    className='rounded-xl border border-[rgba(226,232,240,0.6)] p-5 hover:bg-[rgba(37,99,235,0.02)] transition-colors'
                  >
                    <div className='flex items-center justify-between gap-4'>
                      <div className='inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(37,99,235,0.1)] text-[#2563EB]'>
                        <Icon className='h-6 w-6' />
                      </div>
                      <Badge variant='accent'>{formatMoney(transaction.amount)}</Badge>
                    </div>

                    <div className='mt-4'>
                      <h3 className='text-lg font-semibold text-[#1E293B]'>{transaction.type}</h3>
                      <p className='mt-2 text-sm text-[#64748B]'>
                        {transaction.originAccount?.accountNumber ?? '—'} → {transaction.destinationAccount?.accountNumber ?? '—'}
                      </p>
                    </div>
                    <p className='mt-3 text-sm text-[#64748B]'>{formatDateTime(transaction.date)}</p>
                  </article>
                );
              })}
              {recentTransactions.length === 0 && <p className='text-sm text-[#64748B]'>No hay transferencias registradas.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <CardTitle>Límites vigentes</CardTitle>
                <CardDescription>Reglas de transacción activas</CardDescription>
              </div>
              <Badge variant='info'>{limits.length} reglas</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {limits.slice(0, 4).map((limit) => (
                <article key={limit._id ?? `${limit.accountType}-${limit.transactionType}`} className='rounded-xl border border-[rgba(226,232,240,0.6)] p-4 hover:bg-[rgba(37,99,235,0.02)] transition-colors'>
                  <p className='font-semibold text-[#1E293B]'>
                    {toTitleCase(limit.accountType || 'General')} · {limit.transactionType || 'General'}
                  </p>
                  <p className='mt-2 text-sm text-[#64748B]'>Máximo por transacción: {formatMoney(limit.maxPerTransaction)}</p>
                  <p className='text-sm text-[#64748B]'>Máximo diario: {formatMoney(limit.maxDailyTotal)}</p>
                </article>
              ))}
              {limits.length === 0 && <p className='text-sm text-[#64748B]'>No hay límites configurados.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <CardTitle>Reversiones pendientes</CardTitle>
                <CardDescription>Solicitudes por revisar</CardDescription>
              </div>
              <Badge variant='warning'>Pendientes</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentReversals.map((reversal) => (
                <article key={reversal._id ?? reversal.transactionId} className='rounded-xl border border-[rgba(226,232,240,0.6)] p-4 hover:bg-[rgba(37,99,235,0.02)] transition-colors'>
                  <p className='font-semibold text-[#1E293B]'>{reversal.reason}</p>
                  <p className='mt-1 text-sm text-[#64748B]'>Transacción #{String(reversal.transactionId?._id ?? reversal.transactionId).slice(-6)}</p>
                  <p className='mt-2 text-sm font-semibold text-[#1E293B]'>{formatMoney(reversal.amount)}</p>
                </article>
              ))}
              {recentReversals.length === 0 && <p className='text-sm text-[#64748B]'>No hay reversiones pendientes.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
