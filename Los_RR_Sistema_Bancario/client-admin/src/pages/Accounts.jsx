import { useEffect, useMemo, useState } from 'react';
import { depositToAccount, getAccountHistory, getAccounts, getTransactions, withdrawFromAccount, requestAccountDisable, requestAccountReactivation } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { useAuthStore } from '../features/auth/store/authStore.js';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatMoney, formatDateTime, toTitleCase } from '../shared/utils/banking.js';

export const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disableReason, setDisableReason] = useState('');
  const [disableProcessing, setDisableProcessing] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [reactivateDpi, setReactivateDpi] = useState('');
  const [reactivateDescription, setReactivateDescription] = useState('');
  const [reactivateProcessing, setReactivateProcessing] = useState(false);
  const [actionType, setActionType] = useState('deposit');
  const [activeAccount, setActiveAccount] = useState(null);
  const [form, setForm] = useState({ amount: '' });
  const [historyFilters, setHistoryFilters] = useState({ type: 'ALL', direction: 'ALL', minAmount: '', maxAmount: '', search: '' });

  const isAdmin = useAuthStore((state) => state.isAdmin);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const [accountsData, transactionsData] = await Promise.all([getAccounts(), getTransactions()]);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (error) {
      showError('No se pudieron cargar las cuentas');
    } finally {
      setLoading(false);
    }
  };

  const buildHistoryParams = () => {
    const params = {};
    if (historyFilters.type && historyFilters.type !== 'ALL') params.type = historyFilters.type;
    if (historyFilters.direction && historyFilters.direction !== 'ALL') params.direction = historyFilters.direction;
    if (historyFilters.minAmount) params.minAmount = historyFilters.minAmount;
    if (historyFilters.maxAmount) params.maxAmount = historyFilters.maxAmount;
    if (historyFilters.search) params.search = historyFilters.search;
    return params;
  };

  const loadAccountHistory = async (accountId) => {
    if (!accountId) return;
    try {
      setHistoryLoading(true);
      const data = await getAccountHistory(accountId, buildHistoryParams());
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      showError('No se pudo cargar el historial de la cuenta');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
     console.debug('Accounts loaded:', accounts);
    console.debug('Current user id:', currentUserId, 'isAdmin:', isAdmin);
  }, [accounts, currentUserId, isAdmin]);

  useEffect(() => {
    if (!isAdmin && accounts.length > 0 && !selectedAccount) {
      const activeAcct = accounts.find((a) => a.isActive !== false);
      const accountToShow = activeAcct || accounts[0];
      if (accountToShow) {
        setSelectedAccount(accountToShow);
        loadAccountHistory(accountToShow._id);
      } else {
        setSelectedAccount(null);
      }
    }
  }, [accounts, isAdmin]);

  useEffect(() => {
    if (selectedAccount && !isAdmin) {
      loadAccountHistory(selectedAccount._id);
    }
  }, [selectedAccount, historyFilters, isAdmin]);

  const getAccountLabel = (account) => account?.accountNumber || account?.name || toTitleCase(account?.type) || 'Cuenta';

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        account.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
        account.type?.toLowerCase().includes(search.toLowerCase()) ||
        String(account.balance ?? '').includes(search),
      ),
    [accounts, search],
  );

  const handleOpenAccountDetails = (account) => {
    if (!account.isActive) {
      showError('Esta cuenta se encuentra deshabilitada');
      return;
    }

    setSelectedAccount(account);
    setAccountDetailsOpen(true);
    loadAccountHistory(account._id);
  };

  const openActionModal = (account, type) => {
    setActiveAccount(account);
    setActionType(type);
    setForm({ amount: '' });
    setActionModalOpen(true);
  };

  const handleActionSubmit = async (event) => {
    event.preventDefault();
    if (!activeAccount) return showError('Seleccione una cuenta');

    try {
      const payload = {
        accountId: activeAccount._id,
        amount: Number(form.amount) || 0,
      };

      if (actionType === 'deposit') {
        await depositToAccount(payload);
        showSuccess('Depósito realizado');
      } else {
        await withdrawFromAccount(payload);
        showSuccess('Retiro realizado');
      }

      setActionModalOpen(false);
      loadAccounts();
      if (activeAccount?._id) loadAccountHistory(activeAccount._id);
    } catch (error) {
      showError(error?.response?.data?.message || 'No se pudo procesar la operación');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:justify-between md:items-end'>
        <div>
          <p className='text-sm text-[#64748B]'>{isAdmin ? 'Gestión de cuentas' : 'Resumen de tu cuenta'}</p>
          <h1 className='text-3xl font-bold text-[#2563EB]'>{isAdmin ? 'Cuentas' : 'Cuenta'}</h1>
          {isAdmin ? (
            <p className='mt-2 text-sm text-[#64748B]'>Vista de sólo lectura para administradores. Aquí puedes ver datos y filtrar cuentas.</p>
          ) : (
            <p className='mt-2 text-sm text-[#64748B]'>Aquí puedes ver tu cuenta, saldo e historial.</p>
          )}
        </div>
      </div>

      {isAdmin ? (
        <>
          <div className='flex flex-col gap-4 md:flex-row md:items-center'>
            <input
              type='search'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Buscar por número, tipo o saldo'
              className='w-full max-w-lg rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#1E293B] shadow-sm focus:border-[#2563EB] focus:outline-none'
            />
          </div>

          <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
            {filteredAccounts.map((account) => (
              <article
                key={account._id ?? account.accountNumber}
                className='rounded-3xl border border-[rgba(226,232,240,0.8)] bg-white p-6 shadow-sm hover:border-[#2563EB] hover:shadow-md'
                onClick={() => handleOpenAccountDetails(account)}
              >
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <h2 className='text-xl font-semibold text-[#1E293B]'>{account.accountNumber}</h2>
                    <p className='mt-2 text-sm text-[#64748B]'>{toTitleCase(account.type)}</p>
                  </div>
                  <span className='rounded-full bg-[rgba(226,232,240,0.5)] px-3 py-1 text-sm font-semibold text-[#1E293B]'>
                    {formatMoney(account.balance)}
                  </span>
                </div>
                <p className='mt-4 text-sm text-[#64748B]'>Creada {formatDateTime(account.createdAt)}</p>
                <p className='mt-5 text-sm font-medium text-[#2563EB]'>Toca para ver movimientos</p>
                {!account.isActive && String(currentUserId) === String(account.userId || account.user?._id || account.user?.id || '') && !isAdmin && (
                  <div className='mt-4'>
                    <button
                      className='rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90'
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAccount(account);
                        setReactivateDpi('');
                        setReactivateDescription('');
                        setReactivateModalOpen(true);
                      }}
                    >
                      Solicitar habilitación
                    </button>
                  </div>
                )}
              </article>
            ))}
            {filteredAccounts.length === 0 && (
              <div className='rounded-3xl border border-[rgba(226,232,240,0.8)] bg-white p-8 text-center text-sm text-[#64748B] shadow-sm col-span-full'>
                No se encontró ninguna cuenta.
              </div>
            )}
          </div>
        </>
      ) : selectedAccount ? (
        <>
          <div className='rounded-3xl border border-[rgba(226,232,240,0.8)] bg-white p-8 shadow-sm'>
            <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
              <div>
                <p className='text-sm text-[#64748B]'>Tu cuenta</p>
                <h2 className='text-4xl font-semibold text-[#1E293B]'>{getAccountLabel(selectedAccount)}</h2>
                <p className='mt-3 text-base uppercase tracking-[0.16em] text-[#2563EB]'>{toTitleCase(selectedAccount.type)}</p>
              </div>
              <div className='rounded-3xl bg-[rgba(248,250,252,0.8)] p-6 text-center'>
                <p className='text-sm text-[#64748B]'>Saldo disponible</p>
                <p className='mt-3 text-5xl font-bold text-[#1E293B]'>{formatMoney(selectedAccount.balance)}</p>
                <p className='mt-1 text-sm text-[#64748B]'>{selectedAccount.currency || 'GTQ'}</p>
              </div>
            </div>

            <div className='mt-8 grid gap-4 sm:grid-cols-2'>
              <div className='rounded-3xl border border-[rgba(226,232,240,0.6)] bg-[rgba(248,250,252,0.8)] p-5'>
                <p className='text-sm text-[#64748B]'>Creada</p>
                <p className='mt-2 text-lg font-semibold text-[#1E293B]'>{formatDateTime(selectedAccount.createdAt)}</p>
              </div>
              <div className='rounded-3xl border border-[rgba(226,232,240,0.6)] bg-[rgba(248,250,252,0.8)] p-5'>
                <p className='text-sm text-[#64748B]'>Estado</p>
                <p className='mt-2 text-lg font-semibold text-[#1E293B]'>{selectedAccount.isActive ? 'Activa' : 'Suspendida'}</p>
              </div>
            </div>

            {!selectedAccount.isActive && !isAdmin && (
              <div className='mt-6 rounded-3xl border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-900'>
                <p className='font-semibold'>Cuenta deshabilitada</p>
                <p className='mt-2'>Puedes solicitar habilitación desde aquí.</p>
                <button
                  type='button'
                  onClick={() => {
                    setReactivateDpi('');
                    setReactivateDescription('');
                    setReactivateModalOpen(true);
                  }}
                  className='mt-4 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:opacity-90'
                >
                  Solicitar habilitación
                </button>
              </div>
            )}

          </div>

          <div className='mt-8 rounded-3xl border border-[rgba(226,232,240,0.8)] bg-white p-6 shadow-sm'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-[#64748B]'>Movimientos de la cuenta</p>
                <h2 className='text-xl font-semibold text-[#1E293B]'>{selectedAccount.accountNumber}</h2>
              </div>
            </div>

            <div className='mt-6 space-y-4'>
              <div className='rounded-3xl border border-[rgba(226,232,240,0.8)] bg-[rgba(248,250,252,0.8)] p-4'>
                <p className='text-sm text-[#64748B]'>Saldo actual</p>
                <p className='text-lg font-semibold text-[#1E293B]'>{formatMoney(selectedAccount.balance)}</p>
              </div>

              <div className='rounded-3xl border border-[rgba(226,232,240,0.8)] bg-white p-4'>
                <p className='mb-4 text-sm font-medium text-[#1E293B]'>Movimientos</p>

                {historyLoading ? (
                  <p className='text-sm text-[#64748B]'>Cargando movimientos...</p>
                ) : history.length === 0 ? (
                  <p className='text-sm text-[#64748B]'>No ha habido movimientos en esta cuenta.</p>
                ) : (
                  <div className='space-y-3'>
                    {history.map((transaction) => (
                      <div key={transaction._id ?? `${transaction.createdAt}-${transaction.amount}`} className='rounded-3xl border border-[rgba(226,232,240,0.6)] bg-[rgba(248,250,252,0.8)] p-4'>
                        <div className='flex flex-wrap items-center justify-between gap-3'>
                          <span className='text-sm font-semibold text-[#1E293B]'>{transaction.type ?? 'Movimiento'}</span>
                          <span className='text-sm text-[#64748B]'>{formatDateTime(transaction.createdAt)}</span>
                        </div>
                        <p className='mt-2 text-sm text-[#64748B]'>Monto: {formatMoney(transaction.amount)}</p>
                        <p className='text-sm text-[#64748B]'>Origen: {transaction.originAccount?.accountNumber ?? 'N/A'}</p>
                        <p className='text-sm text-[#64748B]'>Destino: {transaction.destinationAccount?.accountNumber ?? 'N/A'}</p>
                        <p className='text-sm text-[#64748B]'>Descripción: {transaction.description ?? '-'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='mt-6 flex justify-end'>
            <button
              className='rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:opacity-90'
              onClick={() => {
                setDisableReason('');
                setDisableModalOpen(true);
              }}
            >
              Solicitar deshabilitación
            </button>
          </div>
        </>
      ) : (
        <div className='rounded-3xl border border-[rgba(226,232,240,0.8)] bg-white p-8 text-center text-sm text-[#64748B] shadow-sm'>
          No se encontró ninguna cuenta.
        </div>
      )}

      {accountDetailsOpen && selectedAccount && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-[#64748B]'>Movimientos de la cuenta</p>
                <h2 className='text-2xl font-semibold text-[#1E293B]'>{selectedAccount.accountNumber}</h2>
              </div>
              <button
                type='button'
                onClick={() => setAccountDetailsOpen(false)}
                className='rounded-full border border-[#E2E8F0] px-4 py-2 text-sm text-[#1E293B] hover:bg-[rgba(248,250,252,0.8)]'
              >
                Cerrar
              </button>
            </div>
            <div className='mt-6 space-y-4'>
              <div className='rounded-3xl border border-[rgba(226,232,240,0.8)] bg-[rgba(248,250,252,0.8)] p-4'>
                <p className='text-sm text-[#64748B]'>Saldo actual</p>
                <p className='text-lg font-semibold text-[#1E293B]'>{formatMoney(selectedAccount.balance)}</p>
              </div>
              <div className='rounded-3xl border border-[rgba(226,232,240,0.8)] bg-white p-4'>
                <div className='space-y-3'>
                  {historyLoading ? (
                    <p className='text-sm text-[#64748B]'>Cargando movimientos...</p>
                  ) : history.length === 0 ? (
                    <p className='text-sm text-[#64748B]'>No ha habido movimientos en esta cuenta.</p>
                  ) : (
                    history.map((transaction) => (
                      <div key={transaction._id ?? `${transaction.createdAt}-${transaction.amount}`} className='rounded-3xl border border-[rgba(226,232,240,0.6)] bg-[rgba(248,250,252,0.8)] p-4'>
                        <div className='flex flex-wrap items-center justify-between gap-3'>
                          <span className='text-sm font-semibold text-[#1E293B]'>{transaction.type ?? 'Movimiento'}</span>
                          <span className='text-sm text-[#64748B]'>{formatDateTime(transaction.createdAt)}</span>
                        </div>
                        <p className='mt-2 text-sm text-[#64748B]'>Monto: {formatMoney(transaction.amount)}</p>
                        <p className='text-sm text-[#64748B]'>Origen: {transaction.originAccount?.accountNumber ?? 'N/A'}</p>
                        <p className='text-sm text-[#64748B]'>Destino: {transaction.destinationAccount?.accountNumber ?? 'N/A'}</p>
                        <p className='text-sm text-[#64748B]'>Descripción: {transaction.description ?? '-'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionModalOpen && activeAccount && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-[#64748B]'>{actionType === 'deposit' ? 'Depósito' : 'Retiro'}</p>
                <h2 className='text-2xl font-semibold text-[#1E293B]'>{activeAccount.accountNumber}</h2>
              </div>
              <button
                type='button'
                onClick={() => setActionModalOpen(false)}
                className='rounded-full border border-[#E2E8F0] px-4 py-2 text-sm text-[#1E293B] hover:bg-[rgba(248,250,252,0.8)]'
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={handleActionSubmit} className='mt-6 grid gap-4'>
              <label className='block'>
                <span className='text-sm font-medium text-[#1E293B]'>Monto</span>
                <input
                  type='number'
                  min='0.01'
                  step='0.01'
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  className='mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
                />
              </label>
              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setActionModalOpen(false)}
                  className='rounded-full border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#1E293B] transition hover:bg-[rgba(248,250,252,0.8)]'
                >
                  Cancelar
                </button>
                <button type='submit' className='rounded-full bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90'>
                  {actionType === 'deposit' ? 'Depositar' : 'Retirar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {disableModalOpen && selectedAccount && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-[#64748B]'>Solicitud de deshabilitación</p>
                <h2 className='text-2xl font-semibold text-[#1E293B]'>{selectedAccount.accountNumber}</h2>
              </div>
              <button
                type='button'
                onClick={() => setDisableModalOpen(false)}
                className='rounded-full border border-[#E2E8F0] px-4 py-2 text-sm text-[#1E293B] hover:bg-[rgba(248,250,252,0.8)]'
              >
                Cerrar
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedAccount) return showError('Cuenta no seleccionada');
                if (!disableReason || disableReason.trim().length < 5) return showError('Ingrese un motivo válido (mínimo 5 caracteres)');
                try {
                  setDisableProcessing(true);
                  await requestAccountDisable(selectedAccount._id, { reason: disableReason });
                  showSuccess('Solicitud enviada. Espera confirmación del banco.');
                  setDisableModalOpen(false);
                  setDisableReason('');
                  loadAccounts();
                } catch (err) {
                  console.error(err);
                  showError(err?.response?.data?.message || 'No se pudo enviar la solicitud');
                } finally {
                  setDisableProcessing(false);
                }
              }}
              className='mt-6 grid gap-4'
            >
              <label className='block'>
                <span className='text-sm font-medium text-[#1E293B]'>Motivo de la deshabilitación</span>
                <textarea
                  value={disableReason}
                  onChange={(ev) => setDisableReason(ev.target.value)}
                  rows={4}
                  placeholder='Describe por qué deseas deshabilitar esta cuenta...'
                  className='mt-2 w-full rounded-xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
                />
              </label>

              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setDisableModalOpen(false)}
                  className='rounded-full border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#1E293B] transition hover:bg-[rgba(248,250,252,0.8)]'
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  disabled={disableProcessing}
                  className='rounded-full bg-[#EF4444] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50'
                >
                  {disableProcessing ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reactivateModalOpen && selectedAccount && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-[#64748B]'>Solicitud de habilitación</p>
                <h2 className='text-2xl font-semibold text-[#1E293B]'>{selectedAccount.accountNumber}</h2>
              </div>
              <button
                type='button'
                onClick={() => setReactivateModalOpen(false)}
                className='rounded-full border border-[#E2E8F0] px-4 py-2 text-sm text-[#1E293B] hover:bg-[rgba(248,250,252,0.8)]'
              >
                Cerrar
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedAccount) return showError('Cuenta no seleccionada');
                const dpiClean = String(reactivateDpi || '').replace(/\s+/g, '');
                if (!dpiClean || !/^[0-9]{5,20}$/.test(dpiClean)) return showError('Ingrese un DPI válido (solo dígitos, 5-20 caracteres)');
                if (!reactivateDescription || reactivateDescription.trim().length < 10) return showError('Ingrese una descripción válida (mínimo 10 caracteres)');
                try {
                  setReactivateProcessing(true);
                  await requestAccountReactivation(selectedAccount._id, { dpi: dpiClean, description: reactivateDescription });
                  showSuccess('Solicitud de habilitación enviada. Espera revisión del banco.');
                  setReactivateModalOpen(false);
                  setReactivateDpi('');
                  setReactivateDescription('');
                } catch (err) {
                  console.error(err);
                  showError(err?.response?.data?.message || 'No se pudo enviar la solicitud');
                } finally {
                  setReactivateProcessing(false);
                }
              }}
              className='mt-6 grid gap-4'
            >
              <label className='block'>
                <span className='text-sm font-medium text-[#1E293B]'>DPI</span>
                <input
                  type='text'
                  value={reactivateDpi}
                  onChange={(ev) => setReactivateDpi(ev.target.value)}
                  placeholder='Ingrese su DPI (solo dígitos)'
                  className='mt-2 w-full rounded-xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
                />
              </label>

              <label className='block'>
                <span className='text-sm font-medium text-[#1E293B]'>Descripción</span>
                <textarea
                  value={reactivateDescription}
                  onChange={(ev) => setReactivateDescription(ev.target.value)}
                  rows={4}
                  placeholder='Explique por qué necesita reactivar la cuenta...'
                  className='mt-2 w-full rounded-xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
                />
              </label>

              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setReactivateModalOpen(false)}
                  className='rounded-full border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#1E293B] transition hover:bg-[rgba(248,250,252,0.8)]'
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  disabled={reactivateProcessing}
                  className='rounded-full bg-[#10B981] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50'
                >
                  {reactivateProcessing ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
