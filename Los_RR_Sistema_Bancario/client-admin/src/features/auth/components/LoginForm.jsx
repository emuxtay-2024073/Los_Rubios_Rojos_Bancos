import { useForm } from 'react-hook-form';
import {
  EnvelopeIcon,
  EyeIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
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
    
    if (lowerError.includes('verificar') || lowerError.includes('correo electrónico')) {
      return 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.';
    }
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
    <form onSubmit={handleSubmit(onSubmit)} className='auth-form'>
      <div className='auth-field-group'>
        <label htmlFor='email' className='auth-field-label'>
          Correo electrónico
        </label>
        <div className='auth-input-shell'>
          <EnvelopeIcon className='auth-input-icon' />
          <input
            type='email'
            id='email'
            autoComplete='email'
            placeholder='usuario@banco.com'
            className='auth-input'
            {...register('email', {
              required: 'Correo electrónico obligatorio',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Ingresa un correo electrónico válido (ejemplo: usuario@banco.com)',
              },
            })}
          />
        </div>
        {errors.email && <p className='auth-field-error'>{errors.email.message}</p>}
      </div>

      <div className='auth-field-group'>
        <label htmlFor='password' className='auth-field-label'>
          Contraseña
        </label>
        <div className='auth-input-shell'>
          <LockClosedIcon className='auth-input-icon' />
          <input
            type='password'
            id='password'
            autoComplete='current-password'
            placeholder='* * * * * * *'
            className='auth-input auth-input--icon-right'
            {...register('password', {
              required: 'Contraseña obligatoria',
              minLength: {
                value: 8,
                message: 'La contraseña debe tener al menos 8 caracteres',
              },
            })}
          />
          <EyeIcon className='auth-input-icon auth-input-icon--right' />
        </div>

        {errors.password && <p className='auth-field-error'>{errors.password.message}</p>}
      </div>

      <div className='auth-form-meta'>
        <label htmlFor='rememberMe' className='auth-check'>
          <input id='rememberMe' type='checkbox' />
          <span>Recordarme</span>
        </label>
        <button type='button' onClick={onForgot} className='auth-link'>
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {displayError && <p className='auth-status auth-status--error'>{displayError}</p>}

      <button
        type='submit'
        disabled={loading}
        className='auth-submit'
      >
        <LockClosedIcon className='auth-submit__icon' />
        {loading ? 'Iniciando...' : 'Ingresar'}
      </button>

      <p className='auth-switch'>
          ¿No tienes cuenta?{' '}
          <button type='button' onClick={onRegister} className='auth-link'>
            Regístrate
          </button>
      </p>
    </form>
  );
};
