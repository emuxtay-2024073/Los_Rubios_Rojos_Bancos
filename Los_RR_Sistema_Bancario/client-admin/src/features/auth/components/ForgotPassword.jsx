import { useForm } from 'react-hook-form';

export const ForgotPassword = ({ onSwitch }) => {
  const {
    register,
    //handleSubmit,
    formState: { errors },
  } = useForm();
  return (
    <form className='auth-form'>
      <div className='auth-field-group'>
        <label htmlFor='email' className='auth-field-label'>
          Email
        </label>
        <div className='auth-input-shell auth-input-shell--plain'>
          <input
            type='email'
            id='email'
            autoComplete='email'
            placeholder='correo@example.com'
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

      <button
        type='submit'
        className='auth-submit'
      >
        Mandar Token
      </button>

      <p className='auth-switch'>
        ¿Recordaste tu contraseña?{' '}
        <button
          type='button'
          onClick={onSwitch}
          className='auth-link'
        >
          Iniciar Sesión
        </button>
      </p>
    </form>
  );
};
