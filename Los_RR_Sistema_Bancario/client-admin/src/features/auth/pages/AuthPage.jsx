import { useState } from 'react';
import { LoginForm } from '../components/LoginForm.jsx';
import { ForgotPassword } from '../components/ForgotPassword.jsx';
import { RegisterForm } from '../components/RegisterForm.jsx';
import { useAuthStore } from '../store/authStore.js';
import logo from '../../../assets/img/los_rubios_rojos_logo.svg';

export const AuthPage = () => {
  const clearError = useAuthStore((state) => state.clearError);
  const [view, setView] = useState('login');

  const switchView = (nextView) => {
    clearError();
    setView(nextView);
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
      <div className='w-full max-w-xl bg-white rounded-xl shadow-lg border-gray-200 p-6 md:pd-10'>
        <div className='flex justify-center mb-6'>
          <img src={logo} alt='Los Rubios Rojos Logo' className='h-20 w-auto' />
        </div>

        <div className='text-center mb-6'>
          <h1 className='text-2xl lg:text-3xl font-bold text-gray-900 mb-2'>
            {view === 'forgot'
              ? 'Recuperar contraseña'
              : view === 'register'
              ? 'Registro de administrador'
              : 'Sistema Bancario Bancos RR'}
          </h1>
          <p className='text-gray-600 text-base max-w-md mx-auto'>
            {view === 'forgot'
              ? 'Ingresa tu correo para recuperar la contraseña'
              : view === 'register'
              ? 'Crea una cuenta administrativa con la clave secreta'
              : 'Accede al panel de administración bancaria'}
          </p>
        </div>

        {view === 'forgot' ? (
          <ForgotPassword
            onSwitch={() => {
              switchView('login');
            }}
          />
        ) : view === 'register' ? (
          <RegisterForm onLogin={() => switchView('login')} />
        ) : (
          <>
            <LoginForm
              onForgot={() => {
                switchView('forgot');
              }}
              onRegister={() => {
                switchView('register');
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}; //Configuracion para la página de Login.
