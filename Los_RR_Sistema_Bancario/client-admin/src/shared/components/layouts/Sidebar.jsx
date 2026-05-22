import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore.js';
import {
  HomeIcon,
  WalletIcon,
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  UsersIcon,
  ArrowUturnLeftIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  UserGroupIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const userRole = user?.role;
  const role = userRole?.toString().toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'ADMIN_ROLE';

  const items = [
    ...(isAdmin ? [{ label: 'Dashboard', to: '/dashboard', icon: HomeIcon }] : []),
    { label: isAdmin ? 'Cuentas' : 'Cuenta', to: '/dashboard/accounts', icon: WalletIcon },
    { label: 'Retiros y depósitos', to: '/dashboard/deposits', icon: ArrowDownTrayIcon },
    { label: 'Beneficiarios', to: '/dashboard/beneficiaries', icon: UsersIcon },
    { label: 'Transferencias', to: '/dashboard/transactions', icon: ArrowsRightLeftIcon },
    { label: 'Reversiones', to: '/dashboard/reversals', icon: ArrowUturnLeftIcon },
    { label: 'Divisas', to: '/dashboard/currency', icon: CurrencyDollarIcon },
    ...(isAdmin
      ? [
          { label: 'Límites', to: '/dashboard/limits', icon: ShieldCheckIcon },
          { label: 'Solicitudes de deshabilitación', to: '/dashboard/disable-requests', icon: DocumentArrowDownIcon },
          { label: 'Solicitudes de habilitación', to: '/dashboard/reactivate-requests', icon: DocumentArrowUpIcon },
          { label: 'Usuarios', to: '/dashboard/users', icon: UserGroupIcon },
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
    <aside className='sticky top-24 flex w-72 h-[calc(100vh-96px)] flex-col rounded-[32px] bg-[var(--navy)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)] overflow-y-auto'>
      <div className='mb-8'>
        <h2 className='text-3xl font-bold tracking-tight text-[var(--soft-gold)]'>Bancos RR</h2>
        <p className='mt-2 text-sm text-white/75'>Administración bancaria</p>
      </div>

      <ul className='space-y-2'>
        {items.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`sidebar-menu-link sidebar-item${active ? ' active' : ''}`}
                style={active ? { fontWeight: 700 } : {}}
              >
                {Icon && <Icon className='h-5 w-5 text-[var(--soft-gold)]' />}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className='mt-10 border-t border-white/10 pt-6'>
        <p className='mb-4 text-xs uppercase tracking-[0.3em] text-white/50'>Usuario conectado</p>
        <div className='flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[var(--soft-gold)]'>
            <UserCircleIcon className='h-6 w-6' />
          </div>
          <div>
            <p className='text-sm font-semibold text-white'>{user?.username ?? 'Administrador'}</p>
            <p className='text-xs text-white/70'>{role ?? 'ADMINISTRADOR'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
