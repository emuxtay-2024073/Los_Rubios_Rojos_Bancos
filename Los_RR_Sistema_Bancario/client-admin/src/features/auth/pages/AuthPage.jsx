import { useState, useEffect } from 'react';
import { LoginForm } from '../components/LoginForm.jsx';
import { ForgotPassword } from '../components/ForgotPassword.jsx';
import { RegisterForm } from '../components/RegisterForm.jsx';
import { useAuthStore } from '../store/authStore.js';
import logo from '../../../assets/img/los_rubios_rojos_logo.svg';

export const AuthPage = () => {
  const clearError = useAuthStore((state) => state.clearError);
  const resetLoadingState = useAuthStore((state) => state.resetLoadingState);
  const [view, setView] = useState('login');

  useEffect(() => {
    resetLoadingState();
  }, [resetLoadingState]);

  const switchView = (nextView) => {
    clearError();
    setView(nextView);
  };

  return (
    <div className='min-h-screen flex items-center justify-center auth-background px-4 py-12'>
      <div className='relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_30px_70px_rgba(0,45,98,0.12)] backdrop-blur-xl md:p-10'>
        <div className='pointer-events-none absolute -top-20 -left-16 h-48 w-48 rounded-full bg-main-blue/10 blur-3xl' />
        <div className='pointer-events-none absolute -bottom-24 -right-10 h-52 w-52 rounded-full bg-accent/15 blur-3xl' />

        <div className='relative'>
          <div className='flex justify-center mb-8'>
            <img src={logo} alt='Los Rubios Rojos Logo' className='h-16 w-auto' />
          </div>

          <div className='text-center mb-10'>
            <h1 className='text-3xl md:text-4xl font-semibold text-[#002D62] mb-3 leading-tight'>
              {view === 'forgot'
                ? 'Recuperar contraseña'
                : view === 'register'
                ? 'Registro de cuenta'
                : 'Sistema Bancario Bancos RR'}
            </h1>
            <p className='mx-auto max-w-2xl text-sm text-slate-600/85 leading-relaxed'>
              {view === 'forgot'
                ? 'Ingresa tu correo para recuperar la contraseña'
                : view === 'register'
                ? 'Crea una cuenta de usuario o administrador según el rol seleccionado'
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
            <LoginForm
              onForgot={() => {
                switchView('forgot');
              }}
              onRegister={() => {
                switchView('register');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
