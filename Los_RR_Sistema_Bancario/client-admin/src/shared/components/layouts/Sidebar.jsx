import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore.js';

export const Sidebar = () => {
  const location = useLocation();
  const userRole = useAuthStore((state) => state.user?.role);
  const role = userRole?.toString().toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'ADMIN_ROLE';

  const items = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Cuentas', to: '/dashboard/accounts' },
    { label: 'Beneficiarios', to: '/dashboard/beneficiaries' },
    { label: 'Transferencias', to: '/dashboard/transactions' },
    ...(isAdmin
      ? [
          { label: 'Límites', to: '/dashboard/limits' },
          { label: 'Reversiones', to: '/dashboard/reversals' },
          { label: 'Divisas', to: '/dashboard/currency' },
          { label: 'Usuarios', to: '/dashboard/users' },
        ]
      : []),
  ];

  const isActive = (itemTo) => {
    if (itemTo === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === itemTo || location.pathname.startsWith(`${itemTo}/`);
  };

  return (
    <aside className='w-60 bg-white min-h-[calc(100vh-4rem)] p-4 shadow-sm'>
      <div className='mb-6'>
        <h2 className='text-xl font-semibold text-main-blue'>Bancos RR</h2>
        <p className='text-sm text-gray-500'>Administración bancaria</p>
      </div>
      <ul className='space-y-1'>
        {items.map((item) => {
          const active = isActive(item.to);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`block px-4 py-2 rounded-lg font-medium transition-colors sidebar-underline${active ? ' active text-main-blue' : ' text-gray-700 hover:bg-gray-100'}`}
                style={active ? { fontWeight: 700 } : {}}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};
