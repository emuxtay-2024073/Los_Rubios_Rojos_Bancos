import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore.js';
import imgLogo from '../../../assets/img/los_rubios_rojos_logo.svg';
import {
  HomeIcon,
  WalletIcon,
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  UsersIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export const ClientSidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const items = [
    { label: 'Mi Panel', to: '/dashboard', icon: HomeIcon },
    { label: 'Mis Cuentas', to: '/dashboard/accounts', icon: WalletIcon },
    { label: 'Depósitos', to: '/dashboard/deposits', icon: ArrowDownTrayIcon },
    { label: 'Transferencias', to: '/dashboard/transactions', icon: ArrowsRightLeftIcon },
    { label: 'Beneficiarios', to: '/dashboard/beneficiaries', icon: UsersIcon },
    { label: 'Divisas', to: '/dashboard/currency', icon: CurrencyDollarIcon },
    { label: 'Historial', to: '/dashboard/history', icon: DocumentTextIcon },
  ];

  const isActive = (itemTo) => {
    if (itemTo === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === itemTo || location.pathname.startsWith(`${itemTo}/`);
  };

  return (
    <aside className='sticky top-24 flex w-72 h-[calc(100vh-96px)] flex-col rounded-[24px] bg-[linear-gradient(180deg,#0A2472_0%,#1E40AF_100%)] p-6 shadow-[0_18px_45px_rgba(10,36,114,0.24)] overflow-y-auto animate-slideIn'>
      <div className='mb-8 flex items-center gap-3'>
        <img src={imgLogo} alt='Rubios Rojos' className='h-14 w-14 rounded-2xl border border-white/15 bg-white/95 p-1 shadow-lg' />
        <div>
          <h2 className='text-xl font-bold tracking-tight text-[#F3D486]'>Rubios Rojos</h2>
          <p className='mt-1 text-sm text-white/72'>Panel de Cliente</p>
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
        <p className='mb-4 text-xs uppercase tracking-[0.2em] text-white/50'>Mi perfil</p>
        <div className='flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#F3D486]'>
            <UserCircleIcon className='h-6 w-6' />
          </div>
          <div>
            <p className='text-sm font-semibold text-white'>{user?.firstName || user?.username || 'Cliente'}</p>
            <p className='text-xs text-white/70'>Cliente</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
