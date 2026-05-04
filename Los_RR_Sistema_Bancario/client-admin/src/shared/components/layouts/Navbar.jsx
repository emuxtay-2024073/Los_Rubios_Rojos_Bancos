import { Typography } from '@material-tailwind/react';
import { AvatarUser } from '../ui/AvatarUser.jsx';
import imgLogo from '../../../assets/img/los_rubios_rojos_logo.svg';

export const Navbar = () => {
  return (
    <nav className='bg-white shadow-md sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <img
            src={imgLogo}
            alt='Bancos RR Logo'
            className='h-8 md:h-10 w-auto object-contain'
          />
          <Typography variant='h5' className='font-bold text-main-blue'>
            Administración Bancaria
          </Typography>
        </div>
        <AvatarUser />
      </div>
    </nav>
  );
};
