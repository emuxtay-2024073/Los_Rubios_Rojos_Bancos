import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore.js';
import imgLogo from '../../../assets/img/los_rubios_rojos_logo.svg';
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
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const items = [
    ...(isAdmin ? [{ label: 'Dashboard', to: '/dashboard', icon: HomeIcon }] : []),
    { label: isAdmin ? 'Cuentas' : 'Cuenta', to: '/dashboard/accounts', icon: WalletIcon },
    { label: 'Retiros y depósitos', to: '/dashboard/deposits', icon: ArrowDownTrayIcon },
    { label: 'Beneficiarios', to: '/dashboard/beneficiaries', icon: UsersIcon },
    { label: 'Transferencias', to: '/dashboard/transactions', icon: ArrowsRightLeftIcon },
    ...(isAdmin ? [{ label: 'Reversiones', to: '/dashboard/reversals', icon: ArrowUturnLeftIcon }] : []),
    { label: 'Divisas', to: '/dashboard/currency', icon: CurrencyDollarIcon },
    ...(isAdmin
      ? [
          { label: 'Límites', to: '/dashboard/limits', icon: ShieldCheckIcon },
          { label: 'Solicitudes de deshabilitación', to: '/dashboard/disable-requests', icon: DocumentArrowDownIcon },
          { label: 'Solicitudes de habilitación', to: '/dashboard/reactivate-requests', icon: DocumentArrowUpIcon },
          // Mostrar enlace a gestión de usuarios SOLO para SUPER_ADMIN
          ...(role === 'SUPER_ADMIN' ? [{ label: 'Usuarios', to: '/dashboard/users', icon: UserGroupIcon }] : []),
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
    <aside className='sticky top-24 flex w-72 h-[calc(100vh-96px)] flex-col rounded-[24px] bg-[linear-gradient(180deg,#7A0019_0%,#520011_100%)] p-6 shadow-[0_18px_45px_rgba(74,0,17,0.24)] overflow-y-auto animate-slideIn'>
      <div className='mb-8 flex items-center gap-3'>
        <img src={imgLogo} alt='Rubios Rojos' className='h-14 w-14 rounded-2xl border border-white/15 bg-white/95 p-1 shadow-lg' />
        <div>
          <h2 className='text-xl font-bold tracking-tight text-[#F3D486]'>Rubios Rojos</h2>
          <p className='mt-1 text-sm text-white/72'>Sistema Administrativo</p>
        </div>
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
                {Icon && <Icon className={`h-5 w-5 ${active ? 'text-[#F3D486]' : 'text-white/80'}`} />}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className='mt-auto border-t border-white/10 pt-6'>
        <p className='mb-4 text-xs uppercase tracking-[0.2em] text-white/50'>Usuario conectado</p>
        <div className='flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#F3D486]'>
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
