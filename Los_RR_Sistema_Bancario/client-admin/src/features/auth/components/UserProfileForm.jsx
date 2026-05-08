import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore.js';
import toast from 'react-hot-toast';

export const UserProfileForm = ({ onClose }) => {
  const [isDisableRequested, setIsDisableRequested] = useState(false);
  const user = useAuthStore((state) => state.user);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      dpi: user?.dpi || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const response = await fetch(`/api/auth/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          email: data.email,
          phoneNumber: data.phoneNumber,
          dpi: data.dpi,
        }),
      });

      if (response.ok) {
        toast.success('Perfil actualizado exitosamente');
        onClose?.();
      } else {
        toast.error('Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const handleRequestDisable = async () => {
    const reason = prompt('¿Por qué deseas deshabilitar tu cuenta?');
    if (!reason) return;

    try {
      const response = await fetch(`/api/auth/users/${user?.id}/disable-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        setIsDisableRequested(true);
        toast.success('Solicitud de deshabilitación enviada al banco');
      } else {
        toast.error('Error al enviar solicitud');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">Mi Perfil</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Correo electrónico
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            {...register('email', { required: 'El correo es obligatorio' })}
          />
          {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Teléfono
          </label>
          <input
            type="tel"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            {...register('phoneNumber')}
          />
          {errors.phoneNumber && <p className="text-red-600 text-xs mt-1">{errors.phoneNumber.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            DPI
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            {...register('dpi', {
              pattern: {
                value: /^[0-9]{13,15}$/,
                message: 'El DPI debe contener solo números (13-15 dígitos)',
              },
            })}
          />
          {errors.dpi && <p className="text-red-600 text-xs mt-1">{errors.dpi.message}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-main-blue hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg text-sm"
        >
          Guardar cambios
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Seguridad de Cuenta</h3>
        
        {isDisableRequested ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ✓ Solicitud de deshabilitación enviada. El banco revisará tu solicitud.
          </div>
        ) : (
          <button
            onClick={handleRequestDisable}
            className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Solicitar deshabilitación de cuenta
          </button>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg text-sm"
      >
        Cerrar
      </button>
    </div>
  );
};
