import { useEffect, useMemo, useState } from 'react';
import {
  deactivateUser,
  getUsers,
  reactivateUser,
  updateUserRole,
} from '../services/adminApi.js';
import { Spinner } from '../features/auth/components/Spinner.jsx';
import { showError, showSuccess } from '../shared/utils/toast.js';
import { formatDateTime, toTitleCase } from '../shared/utils/banking.js';

const roleOptions = ['Cliente', 'Admin'];

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
    } catch {
      showError('No se pudo actualizar el rol');
    }
  };

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
          <p className='text-sm text-gray-500'>Administración de accesos</p>
          <h1 className='text-3xl font-bold text-main-blue'>Usuarios</h1>
          <p className='mt-2 text-sm text-gray-500'>Filtra, revisa usuarios y administra el estado de las cuentas. Hay {inactiveUsersCount} cuentas inactivas que puedes habilitar desde la tabla.</p>
        </div>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            className='rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-main-blue focus:outline-none'
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
            className='rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-main-blue focus:outline-none'
          >
            <option value=''>Todos los estados</option>
            <option value='active'>Activos</option>
            <option value='inactive'>Inactivos</option>
          </select>
        </div>
      </div>

      <div className='rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-sm text-gray-500'>Usuarios registrados</p>
            <p className='mt-2 text-3xl font-semibold text-slate-900'>{filteredUsers.length}</p>
          </div>
          <input
            type='search'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Buscar por usuario o correo'
            className='w-full max-w-xs rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
          />
        </div>

        <div className='mt-6 overflow-x-auto'>
          <table className='min-w-full border-collapse text-left'>
            <thead className='bg-slate-50 text-sm text-slate-600'>
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
                <tr key={user._id ?? user.email} className='border-t border-gray-100 hover:bg-slate-50'>
                  <td className='px-5 py-4'>{toTitleCase(user.username)}</td>
                  <td className='px-5 py-4'>{user.email}</td>
                  <td className='px-5 py-4'>{user.role}</td>
                  <td className='px-5 py-4'>
                    <span className='rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700'>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className='px-5 py-4'>{formatDateTime(user.createdAt)}</td>
                  <td className='px-5 py-4'>
                    <div className='flex flex-wrap gap-2'>
                      <select
                        value={user.role}
                        onChange={(event) => handleRoleChange(user._id, event.target.value)}
                        className='rounded-3xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-main-blue focus:outline-none'
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <button
                        type='button'
                        onClick={() => handleToggleState(user)}
                        className={`rounded-full px-4 py-2 text-sm font-medium text-white transition ${user.isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                      >
                        {user.isActive ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan='6' className='px-5 py-8 text-center text-sm text-gray-500'>
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
