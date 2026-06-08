import { useState, useEffect } from 'react';
import {
  BuildingLibraryIcon,
  ChartBarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { LoginForm } from '../components/LoginForm.jsx';
import { ForgotPassword } from '../components/ForgotPassword.jsx';
import { RegisterForm } from '../components/RegisterForm.jsx';
import { useAuthStore } from '../store/authStore.js';

const AUTH_COPY = {
  login: {
    overline: 'Acceso seguro',
    subtitle: 'Accede al panel de administración bancaria',
    showcaseCopy:
      'Banca corporativa, control financiero y auditoría operativa en un solo panel.',
  },
  register: {
    overline: 'Alta de cuenta',
    subtitle: 'Crea tu acceso premium para operar dentro del ecosistema bancario',
    showcaseCopy:
      'Registra nuevos usuarios con una experiencia cuidada, profesional y alineada a la identidad bancaria.',
  },
  forgot: {
    overline: 'Recuperación',
    subtitle: 'Solicita tu acceso y vuelve a operar de forma segura',
    showcaseCopy:
      'Recupera credenciales con una interfaz clara, enfocada en confianza, soporte y continuidad operativa.',
  },
};

const AUTH_FEATURES = [
  {
    title: 'Seguridad Avanzada',
    Icon: ShieldCheckIcon,
  },
  {
    title: 'Control Financiero',
    Icon: ChartBarIcon,
  },
  {
    title: 'Gestión Eficiente',
    Icon: BuildingLibraryIcon,
  },
];

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

  const content = AUTH_COPY[view] ?? AUTH_COPY.login;

  return (
    <div className='min-h-screen flex items-center justify-center auth-background px-4 py-12'>
      <div className='auth-card relative w-full max-w-7xl overflow-hidden'>
        <section className='auth-showcase'>
          <div className='auth-architecture' aria-hidden='true' />

          <div className='auth-showcase__content'>
            <div className='auth-monogram' aria-hidden='true'>
              <span className='auth-monogram__crown'>♛</span>
              <span className='auth-monogram__letters'>RR</span>
            </div>

            <div>
              <h1 className='auth-showcase__title'>
                <span>Rubios Rojos</span>
                <span>Bank Virtual</span>
              </h1>
              <div className='auth-showcase__divider' />
              <p className='auth-showcase__copy'>{content.showcaseCopy}</p>
            </div>

            <div className='auth-feature-grid'>
              {AUTH_FEATURES.map(({ title, Icon }) => (
                <div key={title} className='auth-feature-item'>
                  <div className='auth-feature-icon'>
                    <Icon />
                  </div>
                  <p className='auth-feature-title'>{title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className='auth-panel'>
          <div className='auth-panel__content'>
            <div className='auth-panel__header'>
              <div className='auth-monogram auth-monogram--compact' aria-hidden='true'>
                <span className='auth-monogram__crown'>♛</span>
                <span className='auth-monogram__letters'>RR</span>
              </div>

              <p className='auth-panel__eyebrow'>{content.overline}</p>
              <h2 className='auth-panel__title'>Rubios Rojos</h2>
              <div className='auth-panel__brand'>
                <span>Bank Virtual</span>
              </div>
              <p className='auth-panel__subtitle'>{content.subtitle}</p>
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
        </section>
      </div>
    </div>
  );
};
