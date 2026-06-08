import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../shared/components/ui/Card.jsx';
import { StatCard } from '../shared/components/ui/StatCard.jsx';
import { Badge } from '../shared/components/ui/Badge.jsx';
import { Button } from '../shared/components/ui/Button.jsx';
import { formatMoney, formatDateTime } from '../shared/utils/banking.js';
import {
  BanknotesIcon,
  ArrowsRightLeftIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrendingUpIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

export const ClientDashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      // In a real app, this would fetch from your API
      setAccounts([
        { _id: '1', accountNumber: '****4521', type: 'Ahorros', balance: 15420.50, status: 'active' },
        { _id: '2', accountNumber: '****8832', type: 'Corriente', balance: 8750.00, status: 'active' },
      ]);
      
      setTransactions([
        { _id: '1', type: 'Transferencia', amount: 500.00, date: new Date(), status: 'completed' },
        { _id: '2', type: 'Depósito', amount: 1000.00, date: new Date(Date.now() - 86400000), status: 'completed' },
        { _id: '3', type: 'Retiro', amount: 200.00, date: new Date(Date.now() - 172800000), status: 'completed' },
      ]);
      
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]'></div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className='space-y-8 animate-fadeIn'>
      <div className='space-y-4'>
        <div>
          <p className='text-sm font-medium text-[#64748B]'>Bienvenido de nuevo</p>
          <h1 className='text-4xl font-bold text-[#1E293B]'>Mi Panel</h1>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <StatCard
            title='Balance Total'
            value={formatMoney(totalBalance)}
            change='+5.2%'
            changeType='positive'
            icon={BanknotesIcon}
          />
          <StatCard
            title='Transferencias'
            value={transactions.filter(t => t.type === 'Transferencia').length}
            change='+12%'
            changeType='positive'
            icon={ArrowsRightLeftIcon}
          />
          <StatCard
            title='Depósitos'
            value={transactions.filter(t => t.type === 'Depósito').length}
            change='+8%'
            changeType='positive'
            icon={ArrowDownTrayIcon}
          />
          <StatCard
            title='Cuentas Activas'
            value={accounts.length}
            icon={CreditCardIcon}
          />
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-3'>
        <Card className='xl:col-span-2'>
          <CardHeader>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <CardTitle>Mis Cuentas</CardTitle>
                <CardDescription>Gestiona tus cuentas bancarias</CardDescription>
              </div>
              <Button variant='primary' size='sm'>
                Nueva Cuenta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {accounts.map((account) => (
                <article key={account._id} className='rounded-xl border border-[rgba(226,232,240,0.6)] p-5 hover:bg-[rgba(37,99,235,0.02)] transition-colors'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3'>
                        <h3 className='font-semibold text-[#1E293B]'>{account.accountNumber}</h3>
                        <Badge variant='success'>Activa</Badge>
                      </div>
                      <p className='text-sm text-[#64748B] mt-1'>{account.type}</p>
                      <p className='text-2xl font-bold text-[#1E293B] mt-3'>{formatMoney(account.balance)}</p>
                    </div>
                    <div className='flex gap-2'>
                      <Button variant='outline' size='sm'>
                        Ver
                      </Button>
                      <Button variant='primary' size='sm'>
                        Transferir
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Operaciones frecuentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <Button variant='primary' className='w-full justify-start gap-3'>
                <ArrowDownTrayIcon className='h-5 w-5' />
                Realizar Depósito
              </Button>
              <Button variant='secondary' className='w-full justify-start gap-3'>
                <ArrowsRightLeftIcon className='h-5 w-5' />
                Transferir Dinero
              </Button>
              <Button variant='accent' className='w-full justify-start gap-3'>
                <ArrowUpTrayIcon className='h-5 w-5' />
                Retirar Fondos
              </Button>
              <Button variant='outline' className='w-full justify-start gap-3'>
                <TrendingUpIcon className='h-5 w-5' />
                Ver Historial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <CardTitle>Movimientos Recientes</CardTitle>
              <CardDescription>Últimas transacciones realizadas</CardDescription>
            </div>
            <Button variant='outline' size='sm'>
              Ver Todo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {transactions.map((transaction) => (
              <article key={transaction._id} className='flex items-center justify-between rounded-xl border border-[rgba(226,232,240,0.6)] p-4 hover:bg-[rgba(37,99,235,0.02)] transition-colors'>
                <div className='flex items-center gap-4'>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    transaction.type === 'Depósito' ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981]' :
                    transaction.type === 'Retiro' ? 'bg-[rgba(239,68,68,0.1)] text-[#EF4444]' :
                    'bg-[rgba(37,99,235,0.1)] text-[#2563EB]'
                  }`}>
                    {transaction.type === 'Depósito' && <ArrowDownTrayIcon className='h-5 w-5' />}
                    {transaction.type === 'Retiro' && <ArrowUpTrayIcon className='h-5 w-5' />}
                    {transaction.type === 'Transferencia' && <ArrowsRightLeftIcon className='h-5 w-5' />}
                  </div>
                  <div>
                    <p className='font-semibold text-[#1E293B]'>{transaction.type}</p>
                    <p className='text-sm text-[#64748B]'>{formatDateTime(transaction.date)}</p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className={`font-semibold ${
                    transaction.type === 'Depósito' ? 'text-[#10B981]' :
                    transaction.type === 'Retiro' ? 'text-[#EF4444]' :
                    'text-[#1E293B]'
                  }`}>
                    {transaction.type === 'Depósito' ? '+' : transaction.type === 'Retiro' ? '-' : ''}{formatMoney(transaction.amount)}
                  </p>
                  <Badge variant={transaction.status === 'completed' ? 'success' : 'warning'} size='sm'>
                    {transaction.status === 'completed' ? 'Completado' : 'Pendiente'}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
