import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore.js';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const LoginForm = ({ onForgot, onRegister }) => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const getErrorMessage = (err) => {
    if (!err) return null;
    const lowerError = err.toLowerCase();
    
    if (lowerError.includes('no encontrado') || lowerError.includes('no existe') || lowerError.includes('invalid')) {
      return 'Correo o contraseña inválidos. Intenta de nuevo.';
    }
    if (lowerError.includes('contraseña') || lowerError.includes('password')) {
      return 'Contraseña inválida. Intenta de nuevo.';
    }
    if (lowerError.includes('correo') || lowerError.includes('email')) {
      return 'El correo no está registrado en el sistema.';
    }
    if (lowerError.includes('restringido') || lowerError.includes('autorizado')) {
      return 'Acceso restringido. Contacta al administrador.';
    }
    return err;
  };

  const onSubmit = async (data) => {
    const res = await login(data);
    if (res.success) {
      navigate('/dashboard');
      toast.success('¡Bienvenido al sistema bancario!', { duration: 3000 });
    }
  };

  const displayError = getErrorMessage(error);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div>
        <label htmlFor='email' className='block text-sm font-semibold text-[#002D62] mb-2'>
          Correo electrónico
        </label>
        <input
          type='email'
          id='email'
          placeholder='usuario@banco.com'
          className='w-full rounded-2xl border border-slate-300/90 bg-surface px-4 py-3 text-sm text-slate-900 shadow-sm transition duration-200 focus:border-main-blue focus:ring-2 focus:ring-main-blue/20 outline-none'
          {...register('email', {
            required: 'Correo electrónico obligatorio',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Ingresa un correo electrónico válido (ejemplo: usuario@banco.com)',
            },
          })}
        />
        {errors.email && <p className='text-red-600 text-xs mt-2'>{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor='password' className='block text-sm font-semibold text-[#002D62] mb-2'>
          Contraseña
        </label>
        <input
          type='password'
          id='password'
          placeholder='* * * * * * *'
          className='w-full rounded-2xl border border-slate-300/90 bg-surface px-4 py-3 text-sm text-slate-900 shadow-sm transition duration-200 focus:border-main-blue focus:ring-2 focus:ring-main-blue/20 outline-none'
          {...register('password', {
            required: 'Contraseña obligatoria',
            minLength: {
              value: 8,
              message: 'La contraseña debe tener al menos 8 caracteres',
            },
          })}
        />

        {errors.password && <p className='text-red-600 text-xs mt-2'>{errors.password.message}</p>}
      </div>
      {displayError && <p className='text-red-600 text-sm text-center bg-red-50/60 rounded-xl px-3 py-2'>{displayError}</p>}
      <button
        type='submit'
        disabled={loading}
        className='w-full rounded-2xl bg-main-blue px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(0,45,98,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(0,45,98,0.22)] disabled:cursor-not-allowed disabled:opacity-60'
      >
        {loading ? 'Iniciando...' : 'Ingresar'}
      </button>
      <div className='flex flex-col gap-3 text-center text-sm'>
        <button
          type='button'
          onClick={onForgot}
          className='text-main-blue transition hover:text-secondary hover:underline'
        >
          ¿Olvidaste tu contraseña?
        </button>
        <p className='text-slate-600'>
          ¿No tienes cuenta?{' '}
          <button type='button' onClick={onRegister} className='text-main-blue font-semibold transition hover:text-secondary hover:underline'>
            Regístrate
          </button>
        </p>
      </div>
    </form>
  );
};
