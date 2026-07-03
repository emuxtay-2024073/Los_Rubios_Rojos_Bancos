import { toast } from 'react-hot-toast';

// Colores y estilos personalizados
const baseStyle = {
  borderRadius: '8px',
  fontWeight: 600,
  fontFamily: 'inherit',
  fontSize: '1rem',
  padding: '16px 24px',
  boxShadow: '0 2px 16px 0 rgba(0,0,0,0.08)',
};

export const showSuccess = (message) =>
  toast.success(message, {
    style: {
      ...baseStyle,
      background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
      color: '#fff',
      border: '2px solid #22c55e',
    },
    iconTheme: {
      primary: '#22c55e',
      secondary: '#fff',
    },
  });

export const showError = (message) =>
  toast.error(message, {
    style: {
      ...baseStyle,
      background: 'linear-gradient(90deg, #1E3A8A 0%, #0A2472 100%)',
      color: '#fff',
      border: '2px solid #1E3A8A',
    },
    iconTheme: {
      primary: '#1E3A8A',
      secondary: '#fff',
    },
  });

export const showInfo = (message) =>
  toast(message, {
    style: {
      ...baseStyle,
      background: 'linear-gradient(90deg, #0ea5e9 0%, #0369a1 100%)',
      color: '#fff',
      border: '2px solid #0ea5e9',
    },
    iconTheme: {
      primary: '#0ea5e9',
      secondary: '#fff',
    },
  });
