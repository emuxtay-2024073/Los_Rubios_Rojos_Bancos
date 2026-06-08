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
  } = useForm({ defaultValues: { accountType: 'ahorro' } });

  const password = watch('password', '');

  const onSubmit = async (data) => {
    setSuccessMessage('');
    setLocalError('');

    const payload = {
      username: data.username,
      email: data.email,
      phoneNumber: data.phoneNumber,
      dpi: data.dpi,
      password: data.password,
      role: 'USER',
      accountType: data.accountType || 'ahorro',
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
        setLocalError(errMsg || 'Usuario registrado pero no se pudo enviar el correo de verificación. Intenta iniciar sesión para verificar tu cuenta.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='auth-form'>
      <div className='auth-form-grid'>
        <div className='auth-field-group'>
          <label htmlFor='username' className='auth-field-label'>
            Nombre de usuario
          </label>
          <div className='auth-input-shell auth-input-shell--plain'>
            <input
              type='text'
              id='username'
              autoComplete='username'
              placeholder='analista123'
              className='auth-input'
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
          </div>
          {errors.username && <p className='auth-field-error'>{errors.username.message}</p>}
        </div>

        <div className='auth-field-group'>
          <label htmlFor='email' className='auth-field-label'>
            Correo electrónico
          </label>
          <div className='auth-input-shell auth-input-shell--plain'>
            <input
              type='email'
              id='email'
              autoComplete='email'
              placeholder='analista@banco.com'
              className='auth-input'
              {...register('email', {
                required: 'Correo electrónico obligatorio',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Ingresa un correo electrónico válido',
                },
              })}
            />
          </div>
          {errors.email && <p className='auth-field-error'>{errors.email.message}</p>}
        </div>

        <div className='auth-field-group'>
          <label htmlFor='phoneNumber' className='auth-field-label'>
            Teléfono
          </label>
          <div className='auth-input-shell auth-input-shell--plain'>
            <input
              type='tel'
              id='phoneNumber'
              autoComplete='tel'
              placeholder='+502 7000 0000'
              className='auth-input'
              {...register('phoneNumber', {
                required: 'Teléfono obligatorio',
                pattern: {
                  value: /^[+]?([0-9]{1,3})?[\s.-]?[(]?[0-9]{3}[)]?[\s.-]?[0-9]{3,4}[\s.-]?[0-9]{4}$/,
                  message: 'Ingresa un número de teléfono válido (ej: +502 7000 0000)',
                },
              })}
            />
          </div>
          {errors.phoneNumber && <p className='auth-field-error'>{errors.phoneNumber.message}</p>}
        </div>

        <div className='auth-field-group'>
          <label htmlFor='dpi' className='auth-field-label'>
            DPI
          </label>
          <div className='auth-input-shell auth-input-shell--plain'>
            <input
              type='text'
              id='dpi'
              placeholder='1234567890101'
              className='auth-input'
              {...register('dpi', {
                required: 'DPI obligatorio',
                pattern: {
                  value: /^[0-9]{13,15}$/,
                  message: 'DPI inválido (debe contener 13-15 dígitos)',
                },
              })}
            />
          </div>
          {errors.dpi && <p className='auth-field-error'>{errors.dpi.message}</p>}
        </div>

        <div className='auth-field-group'>
          <label htmlFor='password' className='auth-field-label'>
            Contraseña
          </label>
          <div className='auth-input-shell auth-input-shell--plain'>
            <input
              type='password'
              id='password'
              autoComplete='new-password'
              placeholder='* * * * * * *'
              className='auth-input'
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
          </div>
          {errors.password && <p className='auth-field-error'>{errors.password.message}</p>}
        </div>

        <div className='auth-field-group'>
          <label htmlFor='confirmPassword' className='auth-field-label'>
            Confirmar contraseña
          </label>
          <div className='auth-input-shell auth-input-shell--plain'>
            <input
              type='password'
              id='confirmPassword'
              autoComplete='new-password'
              placeholder='* * * * * * *'
              className='auth-input'
              {...register('confirmPassword', {
                required: 'Debes confirmar la contraseña',
                validate: (value) => value === password || 'Las contraseñas no coinciden',
              })}
            />
          </div>
          {errors.confirmPassword && <p className='auth-field-error'>{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <div className='auth-field-group'>
        <label htmlFor='accountType' className='auth-field-label'>
          Tipo de cuenta
        </label>
        <div className='auth-input-shell auth-input-shell--plain'>
          <select
            id='accountType'
            className='auth-input auth-select'
            {...register('accountType', {
              required: 'El tipo de cuenta es obligatorio',
            })}
          >
            <option value='ahorro'>Cuenta de Ahorro</option>
            <option value='monetaria'>Cuenta Monetaria</option>
          </select>
        </div>
        {errors.accountType && <p className='auth-field-error'>{errors.accountType.message}</p>}
      </div>

      {localError && (
        <div className='auth-status auth-status--error'>
          <p>{localError}</p>
        </div>
      )}

      {successMessage && (
        <div className='auth-status auth-status--success'>
          <p>{successMessage}</p>
        </div>
      )}

      <button
        type='submit'
        disabled={loading}
        className='auth-submit'
      >
        {loading ? 'Registrando...' : 'Crear acceso'}
      </button>

      <p className='auth-switch'>
        ¿Ya tienes una cuenta?{' '}
        <button
          type='button'
          onClick={onLogin}
          className='auth-link'
        >
          Inicia sesión
        </button>
      </p>
    </form>
  );
};
