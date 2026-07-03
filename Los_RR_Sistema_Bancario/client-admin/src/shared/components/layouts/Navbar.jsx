import { Typography } from '@material-tailwind/react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { AvatarUser } from '../ui/AvatarUser.jsx';
import { useAuthStore } from '../../../features/auth/store/authStore.js';
import imgLogo from '../../../assets/img/los_rubios_rojos_logo.svg';

export const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.firstName || user?.name || user?.username || 'Administrador';
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <nav className='app-header sticky top-0 z-50 animate-fadeIn'>
      <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-6 py-4'>
        <div className='flex min-w-0 flex-1 items-start gap-4'>
          <img
            src={imgLogo}
            alt='Bancos RR Logo'
            className='h-11 md:h-13 w-auto rounded-2xl object-contain shadow-sm'
          />
          <div className='min-w-0'>
            <Typography variant='h5' className='header-title text-[#0A2472]'>
              Rubios Rojos Bank Virtual
            </Typography>
            <div className='mt-2 flex flex-wrap items-center gap-5 text-sm text-[#64748B]'>
              <span className='font-medium'>Hola, {firstName}</span>
              <span className='inline-flex items-center gap-2 text-[#6B7280]'>
                <CalendarDaysIcon className='h-4 w-4' />
                {today}
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-center justify-end min-w-0'>
          <AvatarUser />
        </div>
      </div>
    </nav>
  );
};
