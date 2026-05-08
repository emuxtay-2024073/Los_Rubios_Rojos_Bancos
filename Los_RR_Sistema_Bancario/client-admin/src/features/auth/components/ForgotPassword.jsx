import { useForm } from 'react-hook-form';

export const ForgotPassword = ({ onSwitch }) => {
  const {
    register,
    //handleSubmit,
    formState: { errors },
  } = useForm();
  return (
    <form className='space-y-6'>
      <div>
        <label htmlFor='email' className='block text-sm font-semibold text-[#002D62] mb-2'>
          Email
        </label>
        <input
          type='email'
          id='email'
          placeholder='correo@example.com'
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

      <button
        type='submit'
        className='w-full rounded-2xl bg-main-blue px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(0,45,98,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(0,45,98,0.22)]'
      >
        Mandar Token
      </button>

      <p className='text-center text-sm text-slate-600'>
        ¿Recordaste tu contraseña?{' '}
        <button
          type='button'
          onClick={onSwitch}
          className='text-main-blue font-semibold transition hover:text-secondary hover:underline'
        >
          Iniciar Sesión
        </button>
      </p>
    </form>
  );
};
