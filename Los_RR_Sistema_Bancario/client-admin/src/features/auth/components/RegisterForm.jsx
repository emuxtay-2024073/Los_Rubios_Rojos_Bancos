import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore.js';
import toast from 'react-hot-toast';

export const RegisterForm = ({ onLogin }) => {
  const [successMessage, setSuccessMessage] = useState('');
  const registerUser = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password', '');

  const onSubmit = async (data) => {
    const payload = {
      username: data.username,
      email: data.email,
      password: data.password,
      role: 'admin',
      secretKey: data.secretKey || '',
    };

    const res = await registerUser(payload);
    if (res.success) {
      setSuccessMessage('Cuenta creada. Ya puedes ingresar al panel.');
      toast.success('Cuenta creada exitosamente.', { duration: 3000 });
      setTimeout(() => onLogin(), 1500);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
      <div>
        <label htmlFor='username' className='block text-sm font-medium text-gray-800 mb-1.5'>
          Nombre de usuario
        </label>
        <input
          type='text'
          id='username'
          placeholder='analista123'
          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          {...register('username', {
            required: 'El nombre de usuario es obligatorio',
          })}
        />
        {errors.username && <p className='text-red-600 text-xs mt-1'>{errors.username.message}</p>}
      </div>

      <div>
        <label htmlFor='email' className='block text-sm font-medium text-gray-800 mb-1.5'>
          Correo electrónico
        </label>
        <input
          type='email'
          id='email'
          placeholder='analista@banco.com'
          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          {...register('email', {
            required: 'El correo es obligatorio',
          })}
        />
        {errors.email && <p className='text-red-600 text-xs mt-1'>{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor='password' className='block text-sm font-medium text-gray-800 mb-1.5'>
          Contraseña
        </label>
        <input
          type='password'
          id='password'
          placeholder='* * * * * * *'
          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          {...register('password', {
            required: 'La contraseña es obligatoria',
            minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
          })}
        />
        {errors.password && <p className='text-red-600 text-xs mt-1'>{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-800 mb-1.5'>
          Confirmar contraseña
        </label>
        <input
          type='password'
          id='confirmPassword'
          placeholder='* * * * * * *'
          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          {...register('confirmPassword', {
            required: 'Debes confirmar la contraseña',
            validate: (value) => value === password || 'Las contraseñas no coinciden',
          })}
        />
        {errors.confirmPassword && <p className='text-red-600 text-xs mt-1'>{errors.confirmPassword.message}</p>}
      </div>

      <div>
        <label htmlFor='secretKey' className='block text-sm font-medium text-gray-800 mb-1.5'>
          Clave secreta de administrador
        </label>
        <input
          type='text'
          id='secretKey'
          placeholder='CLAVE_ADMIN'
          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          {...register('secretKey', {
            required: 'La clave secreta es obligatoria para el registro de administrador',
          })}
        />
        {errors.secretKey && <p className='text-red-600 text-xs mt-1'>{errors.secretKey.message}</p>}
      </div>

      {error && <p className='text-red-600 text-sm text-center'>{error}</p>}
      {successMessage && <p className='text-green-600 text-sm text-center'>{successMessage}</p>}

      <button
        type='submit'
        disabled={loading}
        className='w-full bg-main-blue hover:opacity-90 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm'
      >
        {loading ? 'Registrando...' : 'Crear acceso'}
      </button>

      <p className='text-center text-sm'>
        ¿Ya tienes una cuenta?{' '}
        <button type='button' onClick={onLogin} className='text-main-blue hover:underline'>
          Inicia sesión
        </button>
      </p>
    </form>
  );
};
