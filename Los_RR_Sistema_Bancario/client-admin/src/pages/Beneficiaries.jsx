import { useEffect, useMemo, useState } from 'react';
import {
  createBeneficiary,
  deleteBeneficiary,
  getBeneficiaries,
  toggleBeneficiaryFavorite,
  updateBeneficiary,
} from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { useAuthStore } from '../features/auth/store/authStore.js';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatDateTime } from '../shared/utils/banking.js';

const emptyBeneficiary = {
  name: '',
  accountId: '',
  description: '',
  isFavorite: false,
};

export const Beneficiaries = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeBeneficiary, setActiveBeneficiary] = useState(null);
  const [form, setForm] = useState(emptyBeneficiary);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const loadBeneficiaries = async () => {
    try {
      setLoading(true);
      const data = await getBeneficiaries();
      setBeneficiaries(Array.isArray(data) ? data : []);
    } catch {
      showError('No se pudieron cargar los beneficiarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const filteredBeneficiaries = useMemo(
    () =>
      beneficiaries.filter((item) =>
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()),
      ),
    [beneficiaries, search],
  );

  const handleOpenModal = (beneficiary = null) => {
    setActiveBeneficiary(beneficiary);
    setForm(
      beneficiary
        ? {
            name: beneficiary.name ?? '',
            accountId: beneficiary.accountId?._id ?? beneficiary.accountId ?? '',
            description: beneficiary.description ?? '',
            isFavorite: Boolean(beneficiary.isFavorite),
          }
        : emptyBeneficiary,
    );
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        name: form.name,
        accountId: form.accountId,
        description: form.description,
        isFavorite: form.isFavorite,
      };

      if (activeBeneficiary) {
        await updateBeneficiary(activeBeneficiary._id, payload);
        showSuccess('Beneficiario actualizado');
      } else {
        await createBeneficiary(payload);
        showSuccess('Beneficiario agregado');
      }

      setModalOpen(false);
      loadBeneficiaries();
    } catch (error) {
      showError(error?.response?.data?.message || 'No se pudo guardar el beneficiario');
    }
  };

  const handleDelete = async (beneficiary) => {
    const confirmed = window.confirm('¿Eliminar este beneficiario?');
    if (!confirmed) return;

    try {
      await deleteBeneficiary(beneficiary._id);
      showSuccess('Beneficiario eliminado');
      loadBeneficiaries();
    } catch {
      showError('No se pudo eliminar el beneficiario');
    }
  };

  const handleToggleFavorite = async (beneficiary) => {
    try {
      await toggleBeneficiaryFavorite(beneficiary._id);
      showSuccess(beneficiary.isFavorite ? 'Quitado de favoritos' : 'Marcado como favorito');
      loadBeneficiaries();
    } catch {
      showError('No se pudo actualizar el favorito');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:justify-between md:items-end'>
        <div>
          <p className='text-sm text-[#64748B]'>Beneficiarios asociados</p>
          <h1 className='text-3xl font-bold text-[#2563EB]'>Beneficiarios</h1>
          {isAdmin && (
            <p className='mt-2 text-sm text-[#64748B]'>Vista de sólo lectura. El administrador puede revisar beneficiarios y su cuenta asociada, pero no puede crear ni editar aquí.</p>
          )}
        </div>
        {!isAdmin && (
          <button
            onClick={() => handleOpenModal(null)}
            className='rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90'
          >
            + Nuevo beneficiario
          </button>
        )}
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center'>
        <input
          type='search'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Buscar nombre, cuenta o descripción'
          className='w-full max-w-lg rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#1E293B] shadow-sm focus:border-[#2563EB] focus:outline-none'
        />
      </div>

      <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
        {filteredBeneficiaries.map((beneficiary) => (
          <article key={beneficiary._id ?? beneficiary.accountNumber} className='rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h2 className='text-xl font-semibold text-[#1E293B]'>{beneficiary.name}</h2>
                <p className='mt-2 text-sm text-[#64748B]'>Cuenta {beneficiary.accountNumber}</p>
              </div>
              <span className='rounded-full bg-[rgba(226,232,240,0.5)] px-3 py-1 text-xs font-semibold text-[#1E293B]'>
                {beneficiary.isFavorite ? 'Favorito' : 'Normal'}
              </span>
            </div>
            <p className='mt-4 text-sm text-[#64748B]'>{beneficiary.description || 'Sin descripción'}</p>
            <p className='mt-2 text-xs text-[#64748B]'>Agregado {formatDateTime(beneficiary.addedAt)}</p>
            {!isAdmin && (
              <div className='mt-5 flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={() => handleOpenModal(beneficiary)}
                  className='rounded-full bg-[rgba(226,232,240,0.5)] px-4 py-2 text-sm font-medium text-[#1E293B] transition hover:bg-[rgba(226,232,240,0.8)]'
                >
                  Editar
                </button>
                <button
                  type='button'
                  onClick={() => handleToggleFavorite(beneficiary)}
                  className='rounded-full bg-[#F59E0B] px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700'
                >
                  {beneficiary.isFavorite ? 'Quitar favorito' : 'Marcar favorito'}
                </button>
                <button
                  type='button'
                  onClick={() => handleDelete(beneficiary)}
                  className='rounded-full bg-[#06B6D4] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90'
                >
                  Eliminar
                </button>
              </div>
            )}
          </article>
        ))}
        {filteredBeneficiaries.length === 0 && (
          <div className='rounded-3xl border border-[#E2E8F0] bg-white p-8 text-center text-sm text-[#64748B] shadow-sm col-span-full'>
            No hay beneficiarios registrados.
          </div>
        )}
      </div>

      {modalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm text-[#64748B]'>Formulario</p>
                <h2 className='text-2xl font-semibold text-[#1E293B]'>
                  {activeBeneficiary ? 'Editar beneficiario' : 'Nuevo beneficiario'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className='rounded-full border border-[#E2E8F0] px-4 py-2 text-sm text-[#1E293B] hover:bg-[rgba(226,232,240,0.5)]'
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={handleSubmit} className='mt-6 grid gap-4 sm:grid-cols-2'>
              <label className='block'>
                <span className='text-sm font-medium text-[#1E293B]'>Nombre</span>
                <input
                  type='text'
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className='mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
                />
              </label>
              <label className='block'>
                <span className='text-sm font-medium text-[#1E293B]'>Cuenta asociada</span>
                <input
                  type='text'
                  value={form.accountId}
                  onChange={(event) => setForm({ ...form, accountId: event.target.value })}
                  className='mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
                />
              </label>
              <label className='block sm:col-span-2'>
                <span className='text-sm font-medium text-[#1E293B]'>Descripción</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className='mt-2 w-full rounded-3xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
                  rows='4'
                />
              </label>
              <label className='block sm:col-span-2 flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={form.isFavorite}
                  onChange={(event) => setForm({ ...form, isFavorite: event.target.checked })}
                  className='h-4 w-4 rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]'
                />
                <span className='text-sm font-medium text-[#1E293B]'>Marcar como favorito</span>
              </label>
              <div className='sm:col-span-2 flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setModalOpen(false)}
                  className='rounded-full border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#1E293B] transition hover:bg-[rgba(226,232,240,0.5)]'
                >
                  Cancelar
                </button>
                <button type='submit' className='rounded-full bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90'>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
