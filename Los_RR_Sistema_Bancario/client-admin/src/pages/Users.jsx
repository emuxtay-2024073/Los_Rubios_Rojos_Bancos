import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../features/auth/store/authStore.js';
import {
  deactivateUser,
  getUsers,
  reactivateUser,
  updateUserRole,
} from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatDateTime, toTitleCase } from '../shared/utils/banking.js';

const roleOptions = ['USER', 'ADMIN', 'SUPER_ADMIN'];

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const inactiveUsersCount = users.filter((user) => !user.isActive).length;

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : data?.users ?? []);
    } catch {
      showError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);
      const matchesRole = !selectedRole || user.role === selectedRole;
      const matchesState =
        !selectedState ||
        (selectedState === 'active' && user.isActive) ||
        (selectedState === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesState;
    });
  }, [search, selectedRole, selectedState, users]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      showSuccess('Rol actualizado');
      loadUsers();
    } catch (err) {
      showError(err?.message || 'No se pudo actualizar el rol');
    }
  };

  const currentRole = useAuthStore((state) => state.user?.role?.toUpperCase());
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const handleToggleState = async (user) => {
    try {
      if (user.isActive) {
        await deactivateUser(user._id);
        showSuccess('Usuario desactivado');
      } else {
        await reactivateUser(user._id);
        showSuccess('Usuario reactivado');
      }
      loadUsers();
    } catch {
      showError('No se pudo actualizar el estado del usuario');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:justify-between md:items-end'>
        <div>
          <p className='text-sm text-[#64748B]'>Administración de accesos</p>
          <h1 className='text-3xl font-bold text-[#2563EB]'>Usuarios</h1>
          <p className='mt-2 text-sm text-[#64748B]'>Filtra, revisa usuarios y administra el estado de las cuentas. Hay {inactiveUsersCount} cuentas inactivas que puedes habilitar desde la tabla.</p>
        </div>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            className='rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#1E293B] shadow-sm focus:border-[#2563EB] focus:outline-none'
          >
            <option value=''>Todos los roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            value={selectedState}
            onChange={(event) => setSelectedState(event.target.value)}
            className='rounded-3xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#1E293B] shadow-sm focus:border-[#2563EB] focus:outline-none'
          >
            <option value=''>Todos los estados</option>
            <option value='active'>Activos</option>
            <option value='inactive'>Inactivos</option>
          </select>
        </div>
      </div>

      <div className='rounded-3xl border border-[rgba(226,232,240,0.8)] bg-white p-6 shadow-sm'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-sm text-[#64748B]'>Usuarios registrados</p>
            <p className='mt-2 text-3xl font-semibold text-[#1E293B]'>{filteredUsers.length}</p>
          </div>
          <input
            type='search'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Buscar por usuario o correo'
            className='w-full max-w-xs rounded-3xl border border-[#E2E8F0] bg-[rgba(248,250,252,0.8)] px-4 py-3 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
          />
        </div>

        <div className='mt-6 overflow-x-auto'>
          <table className='min-w-full border-collapse text-left'>
            <thead className='bg-[#0F172A] text-sm text-white'>
              <tr>
                <th className='px-5 py-4'>Usuario</th>
                <th className='px-5 py-4'>Correo</th>
                <th className='px-5 py-4'>Rol</th>
                <th className='px-5 py-4'>Estado</th>
                <th className='px-5 py-4'>Registro</th>
                <th className='px-5 py-4'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id ?? user.email} className='border-t border-[rgba(226,232,240,0.6)] hover:bg-[rgba(37,99,235,0.04)]'>
                  <td className='px-5 py-4 text-[#1E293B]'>{toTitleCase(user.username)}</td>
                  <td className='px-5 py-4 text-[#1E293B]'>{user.email}</td>
                  <td className='px-5 py-4 text-[#1E293B]'>{user.role}</td>
                  <td className='px-5 py-4'>
                    <span className='rounded-full bg-[rgba(226,232,240,0.5)] px-3 py-1 text-sm font-semibold text-[#1E293B]'>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className='px-5 py-4 text-[#64748B]'>{formatDateTime(user.createdAt)}</td>
                  <td className='px-5 py-4'>
                    <div className='flex flex-wrap gap-2'>
                      {isSuperAdmin ? (
                        <select
                          value={user.role}
                          onChange={(event) => handleRoleChange(user._id, event.target.value)}
                          className='rounded-3xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-[#2563EB] focus:outline-none'
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className='px-3 py-2 text-sm text-[#1E293B]'>{user.role}</span>
                      )}
                      <button
                        type='button'
                        onClick={() => handleToggleState(user)}
                        className={`rounded-full px-4 py-2 text-sm font-medium text-white transition ${user.isActive ? 'bg-[#F59E0B] hover:bg-amber-700' : 'bg-[#10B981] hover:bg-emerald-700'}`}
                      >
                        {user.isActive ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan='6' className='px-5 py-8 text-center text-sm text-[#64748B]'>
                    No hay usuarios que coincidan con los filtros.
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
