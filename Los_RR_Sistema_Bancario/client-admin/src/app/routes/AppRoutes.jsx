import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { DashboardPage } from '../layouts/DashboardPage.jsx';
import { ProtectedRoutes } from './ProtectedRoutes.jsx';
import { UnauthorizedPage } from '../../features/auth/pages/UnauthorizedPage.jsx';
import { RoleGuard } from './RoleGuard.jsx';
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage.jsx';
import { Dashboard } from '../../pages/Dashboard.jsx';
import { AdminAccountsView } from '../../pages/AdminAccountsView.jsx';
import { AdminBeneficiariesView } from '../../pages/AdminBeneficiariesView.jsx';
import { AdminTransfersView } from '../../pages/AdminTransfersView.jsx';
import { AdminLimitsView } from '../../pages/AdminLimitsView.jsx';
import { AdminReversalsView } from '../../pages/AdminReversalsView.jsx';
import { AdminCurrencyView } from '../../pages/AdminCurrencyView.jsx';
import { AdminUsersView } from '../../pages/AdminUsersView.jsx';

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
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE']}>
              <Dashboard />
            </RoleGuard>
          }
        />
        <Route
          path='accounts'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE']}>
              <AdminAccountsView />
            </RoleGuard>
          }
        />
        <Route
          path='beneficiaries'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE']}>
              <AdminBeneficiariesView />
            </RoleGuard>
          }
        />
        <Route
          path='transactions'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE']}>
              <AdminTransfersView />
            </RoleGuard>
          }
        />
        <Route
          path='limits'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE']}>
              <AdminLimitsView />
            </RoleGuard>
          }
        />
        <Route
          path='reversals'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE']}>
              <AdminReversalsView />
            </RoleGuard>
          }
        />
        <Route
          path='currency'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE']}>
              <AdminCurrencyView />
            </RoleGuard>
          }
        />
        <Route
          path='users'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE']}>
              <AdminUsersView />
            </RoleGuard>
          }
        />
        <Route path='*' element={<Navigate to='/dashboard' replace />} />
      </Route>
    </Routes>
  );
};
