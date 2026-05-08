import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { DashboardPage } from '../layouts/DashboardPage.jsx';
import { ProtectedRoutes } from './ProtectedRoutes.jsx';
import { UnauthorizedPage } from '../../features/auth/pages/UnauthorizedPage.jsx';
import { RoleGuard } from './RoleGuard.jsx';
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage.jsx';
import { Dashboard } from '../../pages/Dashboard.jsx';
import { Accounts } from '../../pages/Accounts.jsx';
import { Beneficiaries } from '../../pages/Beneficiaries.jsx';
import { Transfers } from '../../pages/Transfers.jsx';
import { Limits } from '../../pages/Limits.jsx';
import { Reversals } from '../../pages/Reversals.jsx';
import { Currency } from '../../pages/Currency.jsx';
import { Users } from '../../pages/Users.jsx';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<AuthPage />} />
      <Route path='/verify-email' element={<VerifyEmailPage />} />
      <Route path='/unauthorized' element={<UnauthorizedPage />} />
      <Route
        path='/dashboard/*'
        element={
          <ProtectedRoutes>
            <DashboardPage />
          </ProtectedRoutes>
        }
      >
        <Route
          index
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'Admin', 'Cliente', 'CLIENTE']}>
              <Dashboard />
            </RoleGuard>
          }
        />
        <Route
          path='accounts'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'Admin', 'Cliente', 'CLIENTE']}>
              <Accounts />
            </RoleGuard>
          }
        />
        <Route
          path='beneficiaries'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'Admin', 'Cliente', 'CLIENTE']}>
              <Beneficiaries />
            </RoleGuard>
          }
        />
        <Route
          path='transactions'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'Admin', 'Cliente', 'CLIENTE']}>
              <Transfers />
            </RoleGuard>
          }
        />
        <Route
          path='limits'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'Admin']}>
              <Limits />
            </RoleGuard>
          }
        />
        <Route
          path='reversals'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'Admin']}>
              <Reversals />
            </RoleGuard>
          }
        />
        <Route
          path='currency'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'Admin']}>
              <Currency />
            </RoleGuard>
          }
        />
        <Route
          path='users'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'Admin']}>
              <Users />
            </RoleGuard>
          }
        />
        <Route path='*' element={<Navigate to='/dashboard' replace />} />
      </Route>
    </Routes>
  );
};
