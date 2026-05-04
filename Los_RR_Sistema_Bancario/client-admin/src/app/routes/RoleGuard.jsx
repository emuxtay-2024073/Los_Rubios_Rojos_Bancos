import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';

export const RoleGuard = ({ children, allowedRoles = [] }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const allowed = allowedRoles.map((role) => role.toUpperCase());
  const hasAccess = isAuthenticated && allowed.includes(user?.role?.toUpperCase());

  if (!hasAccess) {
    return <Navigate to='/' replace />;
  }

  return children;
};
