import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';

const normalizeRole = (role) => {
  if (!role) return '';
  const raw = role.toString().trim().toUpperCase();
  if (raw.includes('SUPER')) return 'SUPER_ADMIN';
  if (raw.includes('CLIENT')) return 'CLIENTE';
  if (raw.includes('ADMIN')) return 'ADMIN';
  if (raw.includes('USER')) return 'USER';
  return raw.replace(/[-\s]/g, '_');
};

export const RoleGuard = ({ children, allowedRoles = [] }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const allowed = allowedRoles.map(normalizeRole);
  const userRole = normalizeRole(user?.role);
  const hasAccess = isAuthenticated && allowed.includes(userRole);

  if (!isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  if (!hasAccess) {
    return <Navigate to='/unauthorized' replace />;
  }

  return children;
};
