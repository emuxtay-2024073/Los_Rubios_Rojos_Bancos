import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVerifyEmail } from '../hooks/useVerifyEmail';
import logo from '../../../assets/img/los_rubios_rojos_logo.svg';

export const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const token = new URLSearchParams(location.search).get('token');

  const handleFinish = useCallback(
    (status) => {
      if (status === 'success') {
        setTimeout(() => navigate('/'), 3500);
      }
    },
    [navigate],
  );

  const { status, message } = useVerifyEmail(token, handleFinish);

  const renderIcon = () => {
    if (status === 'success') {
      return (
        <div
          className='mb-6 flex h-24 w-24 items-center justify-center rounded-full shadow-sm'
          style={{ backgroundColor: 'rgba(10, 36, 114, 0.1)', color: '#0A2472' }}
        >
          <span className='text-5xl'>✅</span>
        </div>
      );
    }

    if (status === 'loading') {
      return (
        <div
          className='mb-6 flex h-24 w-24 items-center justify-center rounded-full shadow-sm'
          style={{ backgroundColor: 'rgba(251, 191, 36, 0.18)', color: '#FBBF24', border: '1px solid rgba(10, 36, 114, 0.12)' }}
        >
          <div className='h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-t-transparent' />
        </div>
      );
    }

    return (
      <div
        className='mb-6 flex h-24 w-24 items-center justify-center rounded-full shadow-sm'
        style={{ backgroundColor: 'rgba(201, 160, 99, 0.18)', color: '#C9A063' }}
      >
        <span className='text-5xl'>❌</span>
      </div>
    );
  };

  const renderTitle = () => {
    if (status === 'success') return '¡Cuenta verificada con éxito!';
    if (status === 'loading') return 'Verificando tu cuenta...';
    return 'No se pudo verificar tu cuenta';
  };

  const renderSubtitle = () => {
    if (status === 'success') return 'Gracias por confirmar tu email. Ya puedes iniciar sesión y comenzar a gestionar tu banca.';
    if (status === 'loading') return 'Estamos confirmando el enlace enviado a tu correo. Un momento, por favor.';
    return message || 'El enlace de verificación es inválido o ha expirado. Comprueba el correo de confirmación e intenta de nuevo.';
  };

  return (
    <div className='min-h-screen bg-surface px-4 py-12'>
      <div className='mx-auto max-w-3xl rounded-[2rem] border border-gray-200 bg-white/95 p-8 shadow-2xl backdrop-blur-sm'>
        <div className='flex flex-col items-center text-center'>
          <img src={logo} alt='Los Rubios Rojos Logo' className='mb-6 h-20 w-20 rounded-full border border-gray-200 bg-white p-3 shadow-sm' />
          {renderIcon()}
          <h1 className='text-3xl font-semibold text-gray-900'>{renderTitle()}</h1>
          <p className='mt-4 max-w-2xl text-sm leading-7 text-gray-700'>{renderSubtitle()}</p>

          <div className='mt-8 flex flex-col items-center gap-3 sm:flex-row'>
            {status !== 'loading' && (
              <button
                type='button'
                onClick={() => navigate('/')}
                className='inline-flex items-center justify-center rounded-full bg-main-blue px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90'
              >
                Ir al inicio
              </button>
            )}
            {status === 'success' && (
              <p className='text-sm text-slate-500'>Serás redirigido automáticamente en unos segundos.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
