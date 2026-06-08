import { useEffect, useMemo, useState } from 'react';
import { getAccounts, getAccountByNumber, getTransactions, transferMoney, requestReversal } from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { useAuthStore } from '../features/auth/store/authStore.js';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatDateTime, formatMoney } from '../shared/utils/banking.js';

const emptyTransfer = {
  fromAccountNumber: '',
  toAccountNumber: '',
  amount: '',
  description: '',
};

const emptyReversal = {
  transactionId: '',
  reason: '',
};

export const Transfers = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyTransfer);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Estado para modal de reversión
  const [reversalModalOpen, setReversalModalOpen] = useState(false);
  const [reversalForm, setReversalForm] = useState(emptyReversal);
  const [reversalLoading, setReversalLoading] = useState(false);

  const isAdmin = useAuthStore((state) => state.isAdmin);
  const currentUser = useAuthStore((state) => state.user);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, transactionsData] = await Promise.all([getAccounts(), getTransactions()]);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch {
      showError('No se pudieron cargar las transferencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const transferTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'TRANSFERENCIA'),
    [transactions],
  );

  const filteredTransactions = useMemo(
    () =>
      transferTransactions.filter((transaction) =>
        transaction.type?.toLowerCase().includes(search.toLowerCase()) ||
        transaction.originAccount?.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
        transaction.destinationAccount?.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
        String(transaction._id ?? '').toLowerCase().includes(search.toLowerCase()) ||
        String(transaction.amount ?? '').includes(search),
      ),
    [search, transferTransactions],
  );

  const openTransferForm = () => {
    const myAccount = accounts.find((acc) => acc.userId === currentUser?.id);
    setForm({ ...emptyTransfer, fromAccountNumber: myAccount?.accountNumber || '' });
    setTransferModalOpen(true);
  };

  // Abrir modal de reversión con el ID de la transacción ya cargado
  const openReversalModal = (transaction) => {
    setReversalForm({ transactionId: transaction._id, reason: '' });
    setReversalModalOpen(true);
  };

  const getReversalStatusLabel = (transaction) => {
    if (transaction.isReversed) return 'Reversada';

    const status = transaction.reversalRequestId?.status;
    switch (status) {
      case 'PENDING':
        return 'Pendiente de reversión';
      case 'APPROVED':
        return 'Reversión aprobada';
      case 'COMPLETED':
        return 'Reversión completada';
      case 'REJECTED':
        return 'Reversión rechazada';
      case 'CANCELLED':
        return 'Reversión cancelada';
      default:
        return '—';
    }
  };

  const canRequestReversal = (transaction) => {
    const originId = transaction.originAccount?._id ?? transaction.originAccount;
    const originNum = transaction.originAccount?.accountNumber;
    const isOwnOutgoing = accounts.some(
      (acc) =>
        (originNum && acc.accountNumber === originNum) ||
        (originId && String(acc._id) === String(originId)),
    );

    if (!isOwnOutgoing) return false;
    if (transaction.isReversed) return false;

    const status = transaction.reversalRequestId?.status;
    return !['PENDING', 'APPROVED'].includes(status);
  };

  const handleReversalSubmit = async (event) => {
    event.preventDefault();
    if (!reversalForm.reason.trim()) {
      showError('El motivo es obligatorio');
      return;
    }
    try {
      setReversalLoading(true);
      await requestReversal(reversalForm);
      showSuccess('Solicitud de reversión enviada correctamente');
      setReversalModalOpen(false);
      setReversalForm(emptyReversal);
      loadData();
    } catch (error) {
      const responseData = error?.response?.data;
      showError(responseData?.waitMessage || responseData?.message || 'No se pudo crear la solicitud de reversión');
    } finally {
      setReversalLoading(false);
    }
  };

  const validateTransfer = () => {
    const errors = {};

    if (!form.fromAccountNumber || form.fromAccountNumber.trim() === '') {
      errors.fromAccountNumber = 'La cuenta de origen es requerida';
    }

    if (!form.toAccountNumber || form.toAccountNumber.trim() === '') {
      errors.toAccountNumber = 'La cuenta de destino es requerida';
    }

    if (form.fromAccountNumber && form.toAccountNumber && form.fromAccountNumber.trim() === form.toAccountNumber.trim()) {
      errors.toAccountNumber = 'No puedes transferir hacia la misma cuenta';
    }

    const fromAccountExists = accounts.some((acc) => acc.accountNumber === form.fromAccountNumber);

    if (form.fromAccountNumber && !fromAccountExists) {
      errors.fromAccountNumber = 'La cuenta de origen no existe';
    }

    if (!isAdmin) {
      const myAccount = accounts.find((acc) => acc.userId === currentUser?.id);
      if (myAccount && form.fromAccountNumber !== myAccount.accountNumber) {
        errors.fromAccountNumber = 'La cuenta de origen debe ser tu cuenta activa';
      }
    }

    if (!form.amount || form.amount === '') {
      errors.amount = 'El monto es requerido';
    } else if (Number(form.amount) <= 0) {
      errors.amount = 'El monto debe ser mayor a 0';
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.amount)) {
      errors.amount = 'El monto tiene un formato inválido';
    }

    if (fromAccountExists) {
      const fromAccount = accounts.find((acc) => acc.accountNumber === form.fromAccountNumber);
      if (fromAccount && Number(form.amount) > fromAccount.balance) {
        errors.amount = `Saldo insuficiente. Tu saldo es de ${fromAccount.balance}`;
      }
    }

    if (form.description && form.description.length > 200) {
      errors.description = 'La descripción no puede exceder 200 caracteres';
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateTransfer();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const fromAccount = accounts.find((acc) => acc.accountNumber === form.fromAccountNumber);
      if (!fromAccount) {
        setValidationErrors({ fromAccountNumber: 'La cuenta de origen no existe' });
        return;
      }

      const toAccounts = await getAccountByNumber(form.toAccountNumber);
      const toAccount = Array.isArray(toAccounts) ? toAccounts[0] : null;
      if (!toAccount) {
        setValidationErrors({ toAccountNumber: 'La cuenta de destino no existe' });
        return;
      }

      await transferMoney({
        fromAccountId: fromAccount._id,
        toAccountId: toAccount._id,
        amount: Number(form.amount),
        description: form.description || '',
      });
      showSuccess('Transferencia realizada exitosamente');
      setTransferModalOpen(false);
      setForm(emptyTransfer);
      setValidationErrors({});
      loadData();
    } catch (error) {
      const responseMessage = error?.response?.data?.error || error?.response?.data?.message;
      showError(responseMessage || 'No se pudo realizar la transferencia');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:justify-between md:items-end'>
        <div>
          <p className='text-sm text-[#64748B]'>Movimientos entre cuentas</p>
          <h1 className='text-3xl font-bold text-[#2563EB]'>Transferencias</h1>
          {isAdmin && (
            <p className='mt-2 text-sm text-[#64748B]'>Vista de sólo lectura para administradores. Puedes filtrar y revisar transferencias, pero no crear nuevas desde aquí.</p>
          )}
        </div>
        {!isAdmin && (
          <button
            type='button'
            onClick={openTransferForm}
            className='rounded-full bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90'
          >
            + Nueva transferencia
          </button>
        )}
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <article className='rounded-3xl border border-[rgba(226,232,240,0.8)] bg-white p-6 shadow-sm'>
          <p className='text-sm text-[#64748B]'>Transferencias totales</p>
          <p className='mt-2 text-3xl font-semibold text-[#1E293B]'>{transferTransactions.length}</p>
        </article>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <input
          type='search'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Buscar por ID, cuenta o monto'
          className='w-full max-w-lg rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#1E293B] shadow-sm focus:border-[#2563EB] focus:outline-none'
        />
      </div>

      <div className='rounded-3xl border border-[rgba(226,232,240,0.8)] bg-white p-6 shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='min-w-full border-collapse text-left'>
            <thead className='bg-[#0F172A] text-sm text-white'>
              <tr>
                <th className='px-5 py-4'>ID transacción</th>
                <th className='px-5 py-4'>Origen</th>
                <th className='px-5 py-4'>Destino</th>
                <th className='px-5 py-4'>Monto</th>
                <th className='px-5 py-4'>Fecha</th>
                <th className='px-5 py-4'>Estado</th>
                {!isAdmin && <th className='px-5 py-4'>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction._id ?? `${transaction.date}-${transaction.amount}`} className='border-t border-[rgba(226,232,240,0.6)] hover:bg-[rgba(37,99,235,0.04)]'>
                  <td className='px-5 py-4'>
                    <span
                      className='font-mono text-xs text-[#64748B] cursor-pointer hover:text-[#2563EB]'
                      title={transaction._id}
                      onClick={() => navigator.clipboard?.writeText(transaction._id).then(() => showSuccess('ID copiado'))}
                    >
                      {String(transaction._id ?? '').slice(-8)}
                    </span>
                  </td>
                  <td className='px-5 py-4 text-[#1E293B]'>{transaction.originAccount?.accountNumber ?? '—'}</td>
                  <td className='px-5 py-4 text-[#1E293B]'>{transaction.destinationAccount?.accountNumber ?? '—'}</td>
                  <td className='px-5 py-4 text-[#1E293B]'>{formatMoney(transaction.amount)}</td>
                  <td className='px-5 py-4 text-[#64748B]'>{formatDateTime(transaction.date)}</td>
                  <td className='px-5 py-4'>
                    <span className='inline-flex rounded-full bg-[rgba(226,232,240,0.5)] px-3 py-1 text-xs font-semibold text-[#1E293B]'>
                      {getReversalStatusLabel(transaction)}
                    </span>
                  </td>
                  {!isAdmin && (
                    <td className='px-5 py-4'>
                      {canRequestReversal(transaction) ? (
                        <button
                          type='button'
                          onClick={() => openReversalModal(transaction)}
                          className='rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100'
                        >
                          Revertir
                        </button>
                      ) : (
                        <span className='text-xs text-gray-400'>—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 7} className='px-5 py-8 text-center text-sm text-[#64748B]'>
                    No hay transferencias registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nueva transferencia */}
      {transferModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-[#64748B]'>Formulario de transferencia</p>
                <h2 className='text-2xl font-semibold text-[#1E293B]'>Nueva transferencia</h2>
              </div>
              <button
                type='button'
                onClick={() => setTransferModalOpen(false)}
                className='rounded-full border border-[#E2E8F0] px-4 py-2 text-sm text-[#1E293B] hover:bg-[rgba(248,250,252,0.8)]'
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={handleSubmit} className='mt-6 grid gap-4 sm:grid-cols-2'>
              <label className='block'>
                <span className='text-sm font-medium text-[#1E293B]'>
                  Cuenta origen <span className='text-[#EF4444]'>*</span>
                </span>
                <input
                  type='text'
                  placeholder='Tu número de cuenta'
                  value={form.fromAccountNumber}
                  readOnly={!isAdmin}
                  disabled={!isAdmin}
                  onChange={(event) => {
                    if (!isAdmin) return;
                    setForm({ ...form, fromAccountNumber: event.target.value });
                    setValidationErrors({ ...validationErrors, fromAccountNumber: '' });
                  }}
                  className={`mt-2 w-full rounded-3xl border px-4 py-3 text-sm text-[#1E293B] bg-[rgba(248,250,252,0.8)] focus:border-[#2563EB] focus:outline-none ${
                    validationErrors.fromAccountNumber ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                  }`}
                />
                {validationErrors.fromAccountNumber && (
                  <p className='mt-1 text-xs text-[#EF4444]'>{validationErrors.fromAccountNumber}</p>
                )}
              </label>
              <label className='block'>
                <span className='text-sm font-medium text-[#1E293B]'>
                  Cuenta destino <span className='text-[#EF4444]'>*</span>
                </span>
                <input
                  type='text'
                  placeholder='Número de cuenta destino'
                  value={form.toAccountNumber}
                  onChange={(event) => {
                    setForm({ ...form, toAccountNumber: event.target.value });
                    setValidationErrors({ ...validationErrors, toAccountNumber: '' });
                  }}
                  className={`mt-2 w-full rounded-3xl border px-4 py-3 text-sm text-[#1E293B] bg-[rgba(248,250,252,0.8)] focus:border-[#2563EB] focus:outline-none ${
                    validationErrors.toAccountNumber ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                  }`}
                />
                {validationErrors.toAccountNumber && (
                  <p className='mt-1 text-xs text-[#EF4444]'>{validationErrors.toAccountNumber}</p>
                )}
              </label>
              <label className='block sm:col-span-2'>
                <span className='text-sm font-medium text-[#1E293B]'>
                  Monto <span className='text-[#EF4444]'>*</span>
                </span>
                <input
                  type='number'
                  step='0.01'
                  min='0.01'
                  placeholder='0.00'
                  value={form.amount}
                  onChange={(event) => {
                    setForm({ ...form, amount: event.target.value });
                    setValidationErrors({ ...validationErrors, amount: '' });
                  }}
                  className={`mt-2 w-full rounded-3xl border px-4 py-3 text-sm text-[#1E293B] bg-[rgba(248,250,252,0.8)] focus:border-[#2563EB] focus:outline-none ${
                    validationErrors.amount ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                  }`}
                />
                {validationErrors.amount && (
                  <p className='mt-1 text-xs text-[#EF4444]'>{validationErrors.amount}</p>
                )}
              </label>
              <label className='block sm:col-span-2'>
                <span className='text-sm font-medium text-[#1E293B]'>
                  Descripción <span className='text-[#64748B]'>(opcional)</span>
                </span>
                <textarea
                  placeholder='Describe el motivo de la transferencia'
                  value={form.description}
                  onChange={(event) => {
                    setForm({ ...form, description: event.target.value });
                    setValidationErrors({ ...validationErrors, description: '' });
                  }}
                  maxLength={200}
                  rows={3}
                  className={`mt-2 w-full rounded-3xl border px-4 py-3 text-sm text-[#1E293B] bg-[rgba(248,250,252,0.8)] focus:border-[#2563EB] focus:outline-none resize-none ${
                    validationErrors.description ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                  }`}
                />
                <p className='mt-1 text-xs text-[#64748B]'>
                  {form.description.length}/200
                </p>
                {validationErrors.description && (
                  <p className='mt-1 text-xs text-[#EF4444]'>{validationErrors.description}</p>
                )}
              </label>
              <div className='sm:col-span-2 flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setTransferModalOpen(false)}
                  className='rounded-full border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#1E293B] transition hover:bg-[rgba(248,250,252,0.8)]'
                >
                  Cancelar
                </button>
                <button type='submit' className='rounded-full bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90'>
                  Transferir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal solicitud de reversión */}
      {reversalModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-[#64748B]'>Solicitud de reversión</p>
                <h2 className='text-2xl font-semibold text-[#1E293B]'>Revertir transferencia</h2>
              </div>
              <button
                type='button'
                onClick={() => setReversalModalOpen(false)}
                className='rounded-full border border-[#E2E8F0] px-4 py-2 text-sm text-[#1E293B] hover:bg-[rgba(248,250,252,0.8)]'
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleReversalSubmit} className='mt-6 space-y-4'>
              <div>
                <p className='text-sm font-medium text-[#1E293B]'>ID de transacción</p>
                <p className='mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 font-mono text-sm text-[#64748B]'>
                  {reversalForm.transactionId}
                </p>
                <p className='mt-1 text-xs text-[#64748B]'>El ID se completó automáticamente.</p>
              </div>

              <label className='block'>
                <span className='text-sm font-medium text-[#1E293B]'>
                  Motivo <span className='text-[#EF4444]'>*</span>
                </span>
                <select
                  value={reversalForm.reason}
                  onChange={(event) => setReversalForm((current) => ({ ...current, reason: event.target.value }))}
                  className='mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
                  required
                >
                  <option value=''>Selecciona un motivo...</option>
                  <option value='Error de transferencia'>Error de transferencia</option>
                  <option value='Transferencia duplicada'>Transferencia duplicada</option>
                  <option value='Transferencia no autorizada'>Transferencia no autorizada</option>
                  <option value='Cambio de opinión'>Cambio de opinión</option>
                  <option value='Otro'>Otro</option>
                </select>
              </label>

              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setReversalModalOpen(false)}
                  className='rounded-full border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#1E293B] transition hover:bg-[rgba(248,250,252,0.8)]'
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  disabled={reversalLoading}
                  className='rounded-full bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50'
                >
                  {reversalLoading ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
