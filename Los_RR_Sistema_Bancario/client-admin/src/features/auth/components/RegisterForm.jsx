import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore.js';
import toast from 'react-hot-toast';

export const RegisterForm = ({ onLogin }) => {
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const registerUser = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { role: 'user' } });

  const password = watch('password', '');
  const selectedRole = watch('role', 'user');

  const onSubmit = async (data) => {
    setSuccessMessage('');
    setLocalError('');

    const payload = {
      username: data.username,
      email: data.email,
      phoneNumber: data.phoneNumber,
      dpi: data.dpi,
      password: data.password,
      role: data.role === 'admin' ? 'Admin' : 'Cliente',
      secretKey: data.role === 'admin' ? data.secretKey || '' : '',
    };

    const res = await registerUser(payload);

    if (res.success) {
      setSuccessMessage(`Cuenta creada. Revisa tu bandeja de entrada en ${data.email} para verificar tu correo.`);
      toast.success('¡Registro exitoso! Revisa tu correo.', { duration: 4000 });
      setTimeout(() => onLogin(), 3000);
    } else {
      const errMsg = res.error || '';
      const esErrorDeCorreo =
        errMsg.toLowerCase().includes('email') ||
        errMsg.toLowerCase().includes('smtp') ||
        errMsg.toLowerCase().includes('mail') ||
        errMsg.toLowerCase().includes('timeout') ||
        errMsg.toLowerCase().includes('timed out');

      if (esErrorDeCorreo) {
        setSuccessMessage(`Cuenta creada. Es posible que el correo de verificación tarde unos minutos en llegar a ${data.email}.`);
        toast.success('Cuenta creada. Revisa tu correo en unos minutos.', { duration: 4000 });
        setTimeout(() => onLogin(), 3000);
      } else {
        setLocalError(errMsg || 'Error al registrar usuario');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div>
        <label htmlFor='username' className='block text-sm font-semibold text-[#002D62] mb-2'>
          Nombre de usuario
        </label>
        <input
          type='text'
          id='username'
          placeholder='analista123'
          className='w-full rounded-2xl border border-slate-300/90 bg-surface px-4 py-3 text-sm text-slate-900 shadow-sm transition duration-200 focus:border-main-blue focus:ring-2 focus:ring-main-blue/20 outline-none'
          {...register('username', {
            required: 'Nombre de usuario obligatorio',
            minLength: {
              value: 3,
              message: 'El nombre de usuario debe tener al menos 3 caracteres',
            },
            pattern: {
              value: /^[a-zA-Z0-9_-]+$/,
              message: 'Solo se permiten letras, números, guiones y guiones bajos',
            },
          })}
        />
        {errors.username && <p className='text-red-600 text-xs mt-2'>{errors.username.message}</p>}
      </div>

      <div>
        <label htmlFor='email' className='block text-sm font-semibold text-[#002D62] mb-2'>
          Correo electrónico
        </label>
        <input
          type='email'
          id='email'
          placeholder='analista@banco.com'
          className='w-full rounded-2xl border border-slate-300/90 bg-surface px-4 py-3 text-sm text-slate-900 shadow-sm transition duration-200 focus:border-main-blue focus:ring-2 focus:ring-main-blue/20 outline-none'
          {...register('email', {
            required: 'Correo electrónico obligatorio',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Ingresa un correo electrónico válido',
            },
          })}
        />
        {errors.email && <p className='text-red-600 text-xs mt-2'>{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor='phoneNumber' className='block text-sm font-semibold text-[#002D62] mb-2'>
          Teléfono
        </label>
        <input
          type='tel'
          id='phoneNumber'
          placeholder='+502 7000 0000'
          className='w-full rounded-2xl border border-slate-300/90 bg-surface px-4 py-3 text-sm text-slate-900 shadow-sm transition duration-200 focus:border-main-blue focus:ring-2 focus:ring-main-blue/20 outline-none'
          {...register('phoneNumber', {
            required: 'Teléfono obligatorio',
            pattern: {
              value: /^[+]?([0-9]{1,3})?[\s.-]?[(]?[0-9]{3}[)]?[\s.-]?[0-9]{3,4}[\s.-]?[0-9]{4}$/,
              message: 'Ingresa un número de teléfono válido (ej: +502 7000 0000)',
            },
          })}
        />
        {errors.phoneNumber && (
          <p className='text-red-600 text-xs mt-2'>{errors.phoneNumber.message}</p>
        )}
      </div>

      <div>
        <label htmlFor='dpi' className='block text-sm font-semibold text-[#002D62] mb-2'>
          DPI
        </label>
        <input
          type='text'
          id='dpi'
          placeholder='1234567890101'
          className='w-full rounded-2xl border border-slate-300/90 bg-surface px-4 py-3 text-sm text-slate-900 shadow-sm transition duration-200 focus:border-main-blue focus:ring-2 focus:ring-main-blue/20 outline-none'
          {...register('dpi', {
            required: 'DPI obligatorio',
            pattern: {
              value: /^[0-9]{13,15}$/,
              message: 'DPI inválido (debe contener 13-15 dígitos)',
            },
          })}
        />
        {errors.dpi && <p className='text-red-600 text-xs mt-2'>{errors.dpi.message}</p>}
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
              message: 'Mínimo 8 caracteres',
            },
            pattern: {
              value: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
              message: 'Debe incluir mayúscula, número y símbolo (!@#$%^&*)',
            },
          })}
        />
        {errors.password && <p className='text-red-600 text-xs mt-2'>{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor='confirmPassword' className='block text-sm font-semibold text-[#002D62] mb-2'>
          Confirmar contraseña
        </label>
        <input
          type='password'
          id='confirmPassword'
          placeholder='* * * * * * *'
          className='w-full rounded-2xl border border-slate-300/90 bg-surface px-4 py-3 text-sm text-slate-900 shadow-sm transition duration-200 focus:border-main-blue focus:ring-2 focus:ring-main-blue/20 outline-none'
          {...register('confirmPassword', {
            required: 'Debes confirmar la contraseña',
            validate: (value) => value === password || 'Las contraseñas no coinciden',
          })}
        />
        {errors.confirmPassword && (
          <p className='text-red-600 text-xs mt-2'>{errors.confirmPassword.message}</p>
        )}
      </div>

      <div>
        <label htmlFor='role' className='block text-sm font-semibold text-[#002D62] mb-2'>
          Seleccionar rol
        </label>
        <select
          id='role'
          className='w-full rounded-2xl border border-slate-300/90 bg-surface px-4 py-3 text-sm text-slate-900 shadow-sm transition duration-200 focus:border-main-blue focus:ring-2 focus:ring-main-blue/20 outline-none'
          {...register('role', {
            required: 'El rol es obligatorio',
          })}
        >
          <option value='user'>Usuario</option>
          <option value='admin'>Administrador</option>
        </select>
        {errors.role && <p className='text-red-600 text-xs mt-2'>{errors.role.message}</p>}
      </div>

      {selectedRole === 'admin' && (
        <div>
          <label htmlFor='secretKey' className='block text-sm font-semibold text-[#002D62] mb-2'>
            Clave secreta de administrador
          </label>
          <input
            type='password'
            id='secretKey'
            placeholder='CLAVE_ADMIN0101'
            className='w-full rounded-2xl border border-slate-300/90 bg-surface px-4 py-3 text-sm text-slate-900 shadow-sm transition duration-200 focus:border-main-blue focus:ring-2 focus:ring-main-blue/20 outline-none'
            {...register('secretKey', {
              required: 'La clave secreta es obligatoria para el registro de administrador',
              validate: (value) => value === 'CLAVE_ADMIN0101' || 'La clave secreta es inválida',
            })}
          />
          {errors.secretKey && (
            <p className='text-red-600 text-xs mt-2'>{errors.secretKey.message}</p>
          )}
        </div>
      )}

      {localError && (
        <div className='flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3'>
          <span className='mt-0.5 text-red-500'>✕</span>
          <p className='text-sm text-red-700'>{localError}</p>
        </div>
      )}

      {successMessage && (
        <div className='flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3'>
          <span className='mt-0.5 text-green-500'>✓</span>
          <p className='text-sm text-green-700'>{successMessage}</p>
        </div>
      )}

      <button
        type='submit'
        disabled={loading}
        className='w-full rounded-2xl bg-main-blue px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(0,45,98,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(0,45,98,0.22)] disabled:cursor-not-allowed disabled:opacity-60'
      >
        {loading ? 'Registrando...' : 'Crear acceso'}
      </button>

      <p className='text-center text-sm text-slate-600'>
        ¿Ya tienes una cuenta?{' '}
        <button
          type='button'
          onClick={onLogin}
          className='text-main-blue font-semibold transition hover:text-secondary hover:underline'
        >
          Inicia sesión
        </button>
      </p>
    </form>
  );
};